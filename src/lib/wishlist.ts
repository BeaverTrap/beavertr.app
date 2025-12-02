import { db } from './db';
import { wishlistItems, wishlists, friendships, priceAlerts } from './schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function getDefaultWishlist(userId: string) {
  const [defaultWishlist] = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.isDefault, true)))
    .limit(1);
  
  if (defaultWishlist) return defaultWishlist;
  
  // Create default wishlist if none exists
  const id = randomUUID();
  const now = new Date();
  
  // Generate unique share link
  const { generateUniqueShareLink } = await import('./share-link');
  const shareLink = await generateUniqueShareLink(async (link) => {
    const existing = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.shareLink, link))
      .limit(1);
    return existing.length > 0;
  });
  
  // Assign random icon and color for default wishlist
  const { getRandomIconAndColor } = await import('./random-icon');
  const { icon, color } = getRandomIconAndColor();
  
  await db.insert(wishlists).values({
    id,
    name: 'My Wishlist',
    description: null,
    privacy: 'public',
    shareLink,
    icon,
    color,
    isDefault: true,
    userId,
    createdAt: now,
    updatedAt: now,
  });
  
  const [newWishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, id))
    .limit(1);
  
  return newWishlist;
}

export async function getWishlistItems(wishlistId: string) {
  return await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.wishlistId, wishlistId))
    .orderBy(wishlistItems.displayOrder, desc(wishlistItems.priority), desc(wishlistItems.createdAt));
}

export async function addWishlistItem(
  wishlistId: string,
  userId: string,
  data: {
    title: string;
    url: string;
    affiliateUrl?: string;
    image?: string;
    price?: string;
    description?: string;
    priority?: number;
    notes?: string;
    itemType?: string;
    category?: string;
    tags?: string;
    size?: string;
    quantity?: number;
  }
) {
  const id = randomUUID();
  const now = new Date();
  
  await db.insert(wishlistItems).values({
    id,
    title: data.title,
    url: data.url,
    affiliateUrl: data.affiliateUrl || null,
    image: data.image || null,
    price: data.price || null,
    description: data.description || null,
    priority: data.priority || 0,
    notes: data.notes || null,
    itemType: data.itemType || null,
    category: data.category || null,
    tags: data.tags || null,
    size: data.size || null,
    quantity: data.quantity || null,
    wishlistId,
    userId,
    createdAt: now,
    updatedAt: now,
  });

  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, id))
    .limit(1);

  return item;
}

export async function updateWishlistItem(
  userId: string,
  id: string,
  data: {
    title?: string;
    image?: string;
    price?: string;
    description?: string;
    priority?: number;
    notes?: string;
    itemType?: string;
    category?: string;
    tags?: string;
    size?: string;
    quantity?: number;
    affiliateUrl?: string;
  }
) {
  const now = new Date();
  
  // If price is being updated, track price history
  let priceHistoryUpdate = undefined;
  if (data.price !== undefined) {
    const [currentItem] = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.id, id))
      .limit(1);
    
    if (currentItem) {
      const currentPrice = currentItem.price;
      const newPrice = data.price;
      
      // Only track if price actually changed
      if (currentPrice !== newPrice && newPrice) {
        const history = currentItem.priceHistory ? JSON.parse(currentItem.priceHistory) : [];
        history.push({
          price: newPrice,
          date: now.getTime(),
        });
        // Keep only last 30 price points
        const trimmedHistory = history.slice(-30);
        priceHistoryUpdate = JSON.stringify(trimmedHistory);
      }
    }
  }
  
  await db
    .update(wishlistItems)
    .set({
      ...data,
      priceHistory: priceHistoryUpdate !== undefined ? priceHistoryUpdate : undefined,
      updatedAt: now,
    })
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)));
  
  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, id))
    .limit(1);
  
  // Check price alerts if price changed
  if (data.price !== undefined && item) {
    await checkPriceAlerts(item.id, item.price);
  }
  
  return item;
}

// Helper function to parse price string to number
function parsePrice(priceStr: string | null | undefined): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Check price alerts and trigger notifications if conditions are met
export async function checkPriceAlerts(itemId: string, currentPrice: string | null) {
  if (!currentPrice) return;
  
  const currentPriceNum = parsePrice(currentPrice);
  if (currentPriceNum === null) return;
  
  // Get all active alerts for this item
  const alerts = await db
    .select()
    .from(priceAlerts)
    .where(and(eq(priceAlerts.itemId, itemId), eq(priceAlerts.isActive, true)));
  
  // Get the item to check price history
  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, itemId))
    .limit(1);
  
  if (!item) return;
  
  // Get previous price from history
  const history = item.priceHistory ? JSON.parse(item.priceHistory) : [];
  const previousPriceEntry = history.length > 1 ? history[history.length - 2] : null;
  const previousPriceNum = previousPriceEntry ? parsePrice(previousPriceEntry.price) : null;
  
  for (const alert of alerts) {
    let shouldNotify = false;
    
    // Check target price alert
    if (alert.targetPrice) {
      const targetPriceNum = parsePrice(alert.targetPrice);
      if (targetPriceNum !== null && currentPriceNum <= targetPriceNum) {
        shouldNotify = true;
      }
    }
    
    // Check percent drop alert
    if (alert.percentDrop && previousPriceNum !== null) {
      const percentChange = ((previousPriceNum - currentPriceNum) / previousPriceNum) * 100;
      if (percentChange >= alert.percentDrop) {
        shouldNotify = true;
      }
    }
    
    if (shouldNotify) {
      // Update last notified time
      await db
        .update(priceAlerts)
        .set({
          lastNotifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(priceAlerts.id, alert.id));
      
      // TODO: Send email notification (will be implemented in email notification system)
      console.log(`Price alert triggered for item ${itemId}, alert ${alert.id}`);
    }
  }
}

export async function deleteWishlistItem(userId: string, id: string): Promise<boolean> {
  const result = await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)));
  
  return (result as any).changes > 0;
}

export async function claimItem(itemId: string, userId: string) {
  const now = new Date();
  
  await db
    .update(wishlistItems)
    .set({
      isClaimed: true,
      claimedBy: userId,
      claimStatus: 'pending', // Set to pending, needs owner confirmation
      updatedAt: now,
    })
    .where(eq(wishlistItems.id, itemId));
}

export async function purchaseItem(itemId: string, userId: string) {
  const now = new Date();
  
  await db
    .update(wishlistItems)
    .set({
      isPurchased: true,
      purchasedBy: userId,
      updatedAt: now,
    })
    .where(eq(wishlistItems.id, itemId));
}

export async function unpurchaseItem(itemId: string, ownerId: string) {
  const now = new Date();
  
  // First verify the owner owns this item
  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, itemId))
    .limit(1);
  
  if (!item || item.userId !== ownerId) {
    throw new Error("Unauthorized: You don't own this item");
  }
  
  await db
    .update(wishlistItems)
    .set({
      isPurchased: false,
      purchasedBy: null,
      // Reset claim status if it was confirmed
      claimStatus: item.claimStatus === 'confirmed' ? 'none' : item.claimStatus,
      updatedAt: now,
    })
    .where(eq(wishlistItems.id, itemId));
}

export async function unclaimItem(itemId: string) {
  const now = new Date();
  
  await db
    .update(wishlistItems)
    .set({
      isClaimed: false,
      claimedBy: null,
      claimStatus: 'none',
      updatedAt: now,
    })
    .where(eq(wishlistItems.id, itemId));
}

export async function markAsPurchased(
  itemId: string,
  userId: string,
  data: {
    purchaseProof?: string | null;
    purchaseDate?: Date | null;
    trackingNumber?: string | null;
    purchaseNotes?: string | null;
    purchaseAmount?: string | null;
    isAnonymous?: boolean;
  }
) {
  const now = new Date();
  
  // Verify the user claimed this item
  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, itemId))
    .limit(1);
  
  if (!item || item.claimedBy !== userId) {
    throw new Error("Unauthorized: You must have claimed this item to mark it as purchased");
  }
  
  await db
    .update(wishlistItems)
    .set({
      claimStatus: 'purchased', // New status: purchased by claimer with proof
      isPurchased: true,
      purchasedBy: userId,
      purchaseProof: data.purchaseProof || null,
      purchaseDate: data.purchaseDate || null,
      trackingNumber: data.trackingNumber || null,
      purchaseNotes: data.purchaseNotes || null,
      purchaseAmount: data.purchaseAmount || null,
      isAnonymous: data.isAnonymous || false,
      updatedAt: now,
    })
    .where(eq(wishlistItems.id, itemId));
}

export async function isModerator(moderatorId: string, ownerId: string): Promise<boolean> {
  // Check if moderatorId is a moderator for ownerId
  // Moderator relationship can be: owner -> moderator OR moderator -> owner
  const [friendship1] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.userId, ownerId),
        eq(friendships.friendId, moderatorId),
        eq(friendships.relationshipType, 'moderator'),
        eq(friendships.status, 'accepted')
      )
    )
    .limit(1);
  
  const [friendship2] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.userId, moderatorId),
        eq(friendships.friendId, ownerId),
        eq(friendships.relationshipType, 'moderator'),
        eq(friendships.status, 'accepted')
      )
    )
    .limit(1);
  
  return !!(friendship1 || friendship2);
}

export async function verifyProof(itemId: string, verifierId: string, verified: boolean) {
  const now = new Date();
  
  // Get the item and check permissions
  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, itemId))
    .limit(1);
  
  if (!item) {
    throw new Error("Item not found");
  }
  
  // Check if verifier is the owner or a moderator
  const isOwner = item.userId === verifierId;
  const isMod = await isModerator(verifierId, item.userId);
  
  if (!isOwner && !isMod) {
    throw new Error("Unauthorized: You must be the owner or a moderator to verify proof");
  }
  
  if (verified) {
    // Verify the proof - mark receipt as verified and confirm purchase
    await db
      .update(wishlistItems)
      .set({
        proofVerified: true,
        proofRejected: false,
        proofVerifiedAt: now,
        proofVerifiedBy: verifierId,
        claimStatus: 'confirmed',
        isPurchased: true,
        purchasedBy: item.claimedBy || item.purchasedBy,
        updatedAt: now,
      })
      .where(eq(wishlistItems.id, itemId));
  } else {
    // Reject the proof - mark receipt as rejected but keep claim
    await db
      .update(wishlistItems)
      .set({
        proofVerified: false,
        proofRejected: true,
        proofVerifiedAt: now,
        proofVerifiedBy: verifierId,
        updatedAt: now,
      })
      .where(eq(wishlistItems.id, itemId));
  }
}

export async function confirmClaim(itemId: string, ownerId: string, confirm: boolean) {
  const now = new Date();
  
  // First verify the owner owns this item
  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, itemId))
    .limit(1);
  
  if (!item || item.userId !== ownerId) {
    throw new Error("Unauthorized: You don't own this item");
  }
  
  if (confirm) {
    // Confirm the claim - mark as purchased
    await db
      .update(wishlistItems)
      .set({
        claimStatus: 'confirmed',
        isPurchased: true,
        purchasedBy: item.claimedBy,
        updatedAt: now,
      })
      .where(eq(wishlistItems.id, itemId));
  } else {
    // Reject the claim - unclaim the item
    await db
      .update(wishlistItems)
      .set({
        claimStatus: 'rejected',
        isClaimed: false,
        claimedBy: null,
        updatedAt: now,
      })
      .where(eq(wishlistItems.id, itemId));
  }
}

// Price Alert Functions
export async function createPriceAlert(
  itemId: string,
  userId: string,
  data: {
    targetPrice?: string;
    percentDrop?: number;
  }
) {
  const id = randomUUID();
  const now = new Date();
  
  await db.insert(priceAlerts).values({
    id,
    itemId,
    userId,
    targetPrice: data.targetPrice || null,
    percentDrop: data.percentDrop || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  
  const [alert] = await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.id, id))
    .limit(1);
  
  return alert;
}

export async function getPriceAlerts(itemId: string, userId?: string) {
  const conditions = [eq(priceAlerts.itemId, itemId)];
  if (userId) {
    conditions.push(eq(priceAlerts.userId, userId));
  }
  
  return await db
    .select()
    .from(priceAlerts)
    .where(and(...conditions))
    .orderBy(desc(priceAlerts.createdAt));
}

export async function updatePriceAlert(
  alertId: string,
  userId: string,
  data: {
    targetPrice?: string | null;
    percentDrop?: number | null;
    isActive?: boolean;
  }
) {
  const now = new Date();
  
  // Verify ownership
  const [alert] = await db
    .select()
    .from(priceAlerts)
    .where(and(eq(priceAlerts.id, alertId), eq(priceAlerts.userId, userId)))
    .limit(1);
  
  if (!alert) {
    throw new Error("Alert not found or unauthorized");
  }
  
  await db
    .update(priceAlerts)
    .set({
      ...data,
      updatedAt: now,
    })
    .where(eq(priceAlerts.id, alertId));
  
  const [updatedAlert] = await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.id, alertId))
    .limit(1);
  
  return updatedAlert;
}

export async function deletePriceAlert(alertId: string, userId: string) {
  const result = await db
    .delete(priceAlerts)
    .where(and(eq(priceAlerts.id, alertId), eq(priceAlerts.userId, userId)));
  
  return (result as any).changes > 0;
}

