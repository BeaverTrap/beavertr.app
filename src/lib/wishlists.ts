import { db } from './db';
import { wishlists, wishlistItems } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function getUserWishlists(userId: string) {
  return await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .orderBy(desc(wishlists.isDefault), desc(wishlists.createdAt));
}

export async function getWishlistById(wishlistId: string, userId?: string) {
  const query = db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, wishlistId))
    .limit(1);
  
  const [wishlist] = await query;
  
  // Check privacy
  if (wishlist) {
    // Personal: only creator can see
    if (wishlist.privacy === 'personal' && wishlist.userId !== userId) {
      return null;
    }
    // Private: only logged-in users with share link (handled at route level)
    if (wishlist.privacy === 'private' && wishlist.userId !== userId) {
      // Allow access if user is logged in (share link access)
      // This will be further restricted at the route level
    }
  }
  
  return wishlist;
}

export async function createWishlist(
  userId: string,
  data: {
    name: string;
    description?: string;
    privacy?: string;
    icon?: string;
    color?: string;
    isDefault?: boolean;
  }
) {
  try {
    // Verify user exists, if not, try to create from session
    const { users } = await import('./schema');
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      // User might not exist yet - this can happen if they signed in before user creation was added
      // Try to get user info from auth token (we'll need email)
      console.warn(`User ${userId} not found in database. User may need to sign out and sign back in.`);
      throw new Error(`User not found. Please sign out and sign back in to create your account.`);
    }

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
    
    // If this is default, unset other defaults
    if (data.isDefault) {
      await db
        .update(wishlists)
        .set({ isDefault: false })
        .where(eq(wishlists.userId, userId));
    }
    
    // If no icon/color provided, assign random ones
    let icon = data.icon || null;
    let color = data.color || null;
    
    if (!icon || !color) {
      const { getRandomIconAndColor } = await import('./random-icon');
      const random = getRandomIconAndColor();
      icon = icon || random.icon;
      color = color || random.color;
    }
    
    await db.insert(wishlists).values({
      id,
      name: data.name,
      description: data.description || null,
      privacy: data.privacy || 'public',
      shareLink,
      icon,
      color,
      isDefault: data.isDefault || false,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    const [wishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, id))
      .limit(1);

    if (!wishlist) {
      throw new Error("Failed to retrieve created wishlist");
    }

    return wishlist;
  } catch (error: any) {
    console.error("Error in createWishlist:", error);
    // Provide more specific error messages
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      throw new Error("User not found. Please sign in again.");
    }
    if (error.message?.includes('UNIQUE constraint failed')) {
      throw new Error("A wishlist with this name already exists.");
    }
    throw error;
  }
}

export async function getWishlistByShareLink(shareLink: string) {
  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.shareLink, shareLink))
    .limit(1);
  
  return wishlist;
}

export async function deleteWishlist(wishlistId: string, userId: string) {
  // Verify ownership
  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.id, wishlistId), eq(wishlists.userId, userId)))
    .limit(1);
  
  if (!wishlist) {
    throw new Error("Wishlist not found or you don't have permission to delete it");
  }
  
  // Delete the wishlist (cascade will delete items)
  await db
    .delete(wishlists)
    .where(eq(wishlists.id, wishlistId));
  
  return true;
}

export async function updateWishlist(wishlistId: string, userId: string, data: {
  name?: string;
  description?: string;
  privacy?: string;
  icon?: string;
  color?: string;
}) {
  console.log("updateWishlist called:", { wishlistId, userId, data });
  
  // Verify ownership
  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.id, wishlistId), eq(wishlists.userId, userId)))
    .limit(1);
  
  console.log("Found wishlist:", wishlist ? { id: wishlist.id, userId: wishlist.userId } : "not found");
  
  if (!wishlist) {
    // Check if wishlist exists at all
    const [anyWishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, wishlistId))
      .limit(1);
    
    if (!anyWishlist) {
      throw new Error("Wishlist not found");
    } else {
      throw new Error("You don't have permission to update this wishlist");
    }
  }
  
  const now = new Date();
  
  await db
    .update(wishlists)
    .set({
      ...data,
      updatedAt: now,
    })
    .where(eq(wishlists.id, wishlistId));
  
  const [updated] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, wishlistId))
    .limit(1);
  
  return updated;
}

export async function getWishlistItems(wishlistId: string) {
  return await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.wishlistId, wishlistId))
    .orderBy(desc(wishlistItems.priority), desc(wishlistItems.createdAt));
}

