"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import EditAffiliateLink from "./EditAffiliateLink";
import EditItemDetails from "./EditItemDetails";
import PurchaseProofModal from "./PurchaseProofModal";

interface WishlistItem {
  id: string;
  title: string;
  url: string;
  affiliateUrl?: string | null;
  image?: string | null;
  price?: string | null;
  description?: string | null;
  priority?: number | null;
  notes?: string | null;
  size?: string | null;
  quantity?: number | null;
  isClaimed?: boolean;
  isPurchased?: boolean;
  claimStatus?: string | null;
  claimedBy?: string | null;
  purchasedBy?: string | null;
  purchaseProof?: string | null;
  purchaseDate?: string | null;
  trackingNumber?: string | null;
  purchaseNotes?: string | null;
  purchaseAmount?: string | null;
  proofVerified?: boolean;
  proofRejected?: boolean;
  proofVerifiedAt?: string | null;
  proofVerifiedBy?: string | null;
  isAnonymous?: boolean;
  createdAt: string;
}

interface WishlistListProps {
  wishlistId: string;
  isOwner?: boolean;
}

// Helper function to extract store name from URL
function getStoreName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Remove www. prefix
    const domain = hostname.replace(/^www\./, '');
    
    // Extract main domain (e.g., "amazon.com" from "www.amazon.com")
    const parts = domain.split('.');
    if (parts.length >= 2) {
      const mainDomain = parts.slice(-2).join('.');
      
      // Map common domains to store names
      const storeMap: Record<string, string> = {
        'amazon.com': 'Amazon',
        'amzn.to': 'Amazon',
        'target.com': 'Target',
        'walmart.com': 'Walmart',
        'bestbuy.com': 'Best Buy',
        'etsy.com': 'Etsy',
        'ebay.com': 'eBay',
        'shopify.com': 'Shopify Store',
        'bigcommerce.com': 'BigCommerce Store',
      };
      
      if (storeMap[mainDomain]) {
        return storeMap[mainDomain];
      }
      
      // Return capitalized domain name
      return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
    }
    
    return domain;
  } catch {
    // If URL parsing fails, try to extract from string
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    if (match && match[1]) {
      const domain = match[1].split('.')[0];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
    return 'Store';
  }
}

export default function WishlistList({ wishlistId, isOwner = false }: WishlistListProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [showPurchaseModal, setShowPurchaseModal] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const { data: session } = useSession();

  // Check if current user is a moderator for this wishlist
  useEffect(() => {
    if (session?.user?.id && wishlistId && !isOwner) {
      fetch(`/api/wishlists/${wishlistId}/check-moderator`)
        .then(res => res.json())
        .then(data => setIsModerator(data.isModerator || false))
        .catch(() => setIsModerator(false));
    }
  }, [session, wishlistId, isOwner]);

  useEffect(() => {
    fetchItems();
  }, [wishlistId]);

  useEffect(() => {
    // Auto-refresh prices on page load, especially for Amazon products
    // Only run once when items are first loaded, not on every items change
    if (items.length > 0 && !loading && !hasAutoRefreshed) {
      const amazonItems = items.filter(item => 
        (item.url.includes("amazon.com") || item.url.includes("amzn.to")) &&
        !refreshing.has(item.id)
      );
      
      // Refresh Amazon items automatically (they have frequent sales)
      // Only refresh once per page load, with a delay between each item
      if (amazonItems.length > 0) {
        setHasAutoRefreshed(true);
        
        amazonItems.forEach((item, index) => {
          // Stagger the refreshes to avoid overwhelming the server
          setTimeout(() => {
            autoRefreshPrice(item);
          }, 2000 + (index * 1000)); // 2s delay, then 1s between each
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, loading]); // Only run when items are first loaded

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/wishlist/items?wishlistId=${wishlistId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const autoRefreshPrice = async (item: WishlistItem) => {
    // Skip if already refreshing this item
    if (refreshing.has(item.id)) return;
    
    setRefreshing(prev => new Set(prev).add(item.id));
    
    try {
      const response = await fetch("/api/wishlist/items/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, url: item.url }),
      });
      
      if (response.ok) {
        const updatedItem = await response.json();
        // Update just this item in the list instead of refreshing all items
        // Preserve the existing price while updating to prevent flickering
        setItems(prevItems => 
          prevItems.map(i => 
            i.id === item.id 
              ? { ...i, ...updatedItem, price: updatedItem.price || i.price } 
              : i
          )
        );
      }
    } catch (error) {
      console.error("Error auto-refreshing price:", error);
    } finally {
      setRefreshing(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    
    try {
      const response = await fetch(`/api/wishlist/items?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setItems(items.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleClaim = async (id: string, action: "claim" | "purchase" | "unclaim" | "confirm" | "unpurchase" | "markPurchased" | "verifyProof", confirm?: boolean) => {
    try {
      const response = await fetch("/api/wishlist/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, action, confirm }),
      });
      
      if (response.ok) {
        fetchItems(); // Refresh list
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update claim");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Error updating claim");
    }
  };

  const handleRefresh = async (item: WishlistItem) => {
    // Skip if already refreshing this item
    if (refreshing.has(item.id)) return;
    
    setRefreshing(prev => new Set(prev).add(item.id));
    
    try {
      const response = await fetch("/api/wishlist/items/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, url: item.url }),
      });
      
      if (response.ok) {
        const updatedItem = await response.json();
        // Update just this item in the list instead of refreshing all items
        // Preserve the existing price while updating to prevent flickering
        setItems(prevItems => 
          prevItems.map(i => 
            i.id === item.id 
              ? { ...i, ...updatedItem, price: updatedItem.price || i.price } 
              : i
          )
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to refresh item");
      }
    } catch (error) {
      console.error("Error refreshing item:", error);
      alert("Error refreshing item");
    } finally {
      setRefreshing(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return <div className="text-zinc-400">Loading...</div>;
  }

  if (items.length === 0) {
    return <div className="text-zinc-400">No items yet. Add some!</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        // Determine the clickable URL (affiliate if valid, otherwise original)
        const getClickableUrl = () => {
          if (item.affiliateUrl) {
            try {
              const url = new URL(item.affiliateUrl);
              // Reject associate guide pages
              if (url.hostname.includes('associates.amazon.com') ||
                  url.pathname.includes('associates-start') ||
                  url.pathname.includes('associates/help')) {
                return item.url;
              }
              // Reject browse/category pages
              if (url.pathname === '/b' || url.pathname.startsWith('/b?')) {
                return item.url;
              }
              // For Amazon, check if it has product identifiers
              if (url.hostname.includes('amazon.com') || url.hostname.includes('amzn.to')) {
                const hasProductId = url.pathname.includes('/dp/') || 
                                    url.pathname.includes('/gp/product/') ||
                                    url.pathname.includes('/product/') ||
                                    url.searchParams.has('asin');
                return hasProductId ? item.affiliateUrl : item.url;
              }
              return item.affiliateUrl;
            } catch {
              return item.url;
            }
          }
          return item.url;
        };
        
        const clickableUrl = getClickableUrl();
        
        return (
        <div
          key={item.id}
          className={`p-4 rounded-lg bg-zinc-800 border transition-colors overflow-hidden ${
            item.isPurchased
              ? "border-green-600 opacity-60"
              : item.isClaimed
              ? "border-yellow-600"
              : "border-zinc-700 hover:border-zinc-600"
          }`}
        >
          {/* Image - Clickable */}
          {item.image && (
            <a
              href={clickableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </a>
          )}

          {/* Store Name */}
          <div className="mb-2">
            <a
              href={clickableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-2 py-1 text-xs rounded bg-zinc-700/50 text-zinc-300 border border-zinc-600/50 hover:bg-zinc-600/50 hover:text-white transition-colors"
              title={`View on ${getStoreName(item.url)}`}
            >
              {getStoreName(item.url)}
            </a>
          </div>

          {/* Title - Clickable */}
          <a
            href={clickableUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 hover:text-blue-400 transition-colors cursor-pointer">
              {item.title}
            </h3>
          </a>

          {/* Price */}
          <div className="text-xl font-bold text-green-400 mb-2">
            {refreshing.has(item.id) ? (
              <span className="text-zinc-500 text-sm">Updating...</span>
            ) : item.price ? (
              (() => {
                // Split price and discount percentage
                const priceMatch = item.price.match(/^([^-\s]+)\s*(-\d+%)$/);
                if (priceMatch) {
                  const [, price, discount] = priceMatch;
                  return (
                    <>
                      <span>{price}</span>
                      <span className="text-red-500 ml-1">{discount}</span>
                    </>
                  );
                }
                return item.price;
              })()
            ) : (
              <span className="text-zinc-500 text-sm">No price</span>
            )}
          </div>

          {/* Description */}
          {item.description && (() => {
            const isExpanded = expandedDescriptions.has(item.id);
            const description = item.description;
            const shouldTruncate = description.length > 150;
            const displayText = isExpanded || !shouldTruncate 
              ? description 
              : description.substring(0, 150) + '...';
            
            return (
              <div className="mb-3">
                <p className="text-sm text-zinc-400">
                  {displayText}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => {
                      setExpandedDescriptions(prev => {
                        const newSet = new Set(prev);
                        if (isExpanded) {
                          newSet.delete(item.id);
                        } else {
                          newSet.add(item.id);
                        }
                        return newSet;
                      });
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Status badges */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {item.isPurchased && (
              <span className="px-2 py-1 text-xs rounded bg-green-600/20 text-green-400">
                ✓ Purchased
              </span>
            )}
            {item.claimStatus === 'purchased' && (
              <span className="px-2 py-1 text-xs rounded bg-green-600/20 text-green-400">
                ✓ Purchased (with proof)
              </span>
            )}
            {item.claimStatus === 'pending' && (
              <span className="px-2 py-1 text-xs rounded bg-yellow-600/20 text-yellow-400">
                ⏳ Claim Pending
              </span>
            )}
            {item.claimStatus === 'confirmed' && !item.isPurchased && (
              <span className="px-2 py-1 text-xs rounded bg-green-600/20 text-green-400">
                ✓ Claim Confirmed
              </span>
            )}
            {item.isClaimed && item.claimStatus !== 'pending' && item.claimStatus !== 'confirmed' && item.claimStatus !== 'purchased' && !item.isPurchased && (
              <span className="px-2 py-1 text-xs rounded bg-yellow-600/20 text-yellow-400">
                Claimed
              </span>
            )}
            {item.priority === 1 && (
              <span className="px-2 py-1 text-xs rounded bg-red-600/20 text-red-400">
                High Priority
              </span>
            )}
          </div>

          {/* Purchase information display */}
          {(item.claimStatus === 'purchased' || item.isPurchased) && (item.purchaseProof || item.purchaseDate || item.trackingNumber || item.purchaseNotes || item.purchaseAmount) && (
            <div className={`mb-3 p-3 rounded border ${
              item.proofVerified 
                ? 'bg-green-900/20 border-green-600/30' 
                : item.proofRejected 
                ? 'bg-red-900/20 border-red-600/30'
                : 'bg-yellow-900/20 border-yellow-600/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-green-400">Purchase Information:</p>
                {item.proofVerified && (
                  <span className="px-2 py-1 text-xs rounded bg-green-600/20 text-green-400">
                    ✓ Verified
                  </span>
                )}
                {item.proofRejected && (
                  <span className="px-2 py-1 text-xs rounded bg-red-600/20 text-red-400">
                    ✗ Proof Rejected
                  </span>
                )}
                {!item.proofVerified && !item.proofRejected && item.purchaseProof && (isOwner || isModerator) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClaim(item.id, "verifyProof", true)}
                      className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
                    >
                      ✓ Verify Receipt
                    </button>
                    <button
                      onClick={() => handleClaim(item.id, "verifyProof", false)}
                      className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                    >
                      ✗ Reject Proof
                    </button>
                    {isModerator && !isOwner && (
                      <span className="text-xs text-zinc-400 px-2 py-1">(Moderator)</span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1 text-xs text-zinc-300">
                {item.purchaseDate && (
                  <p>📅 Purchased: {new Date(item.purchaseDate).toLocaleDateString()}</p>
                )}
                {item.purchaseAmount && (
                  <p>💰 Amount Paid: {item.purchaseAmount}</p>
                )}
                {item.trackingNumber && (
                  <p>📦 Tracking: {item.trackingNumber}</p>
                )}
                {item.purchaseNotes && (
                  <p>📝 Notes: {item.purchaseNotes}</p>
                )}
                {item.purchaseProof && (
                  <div>
                    <p className="mb-1">🧾 Receipt/Proof:</p>
                    <a
                      href={item.purchaseProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      View Receipt
                    </a>
                    {!item.proofVerified && !item.proofRejected && (isOwner || isModerator) && (
                      <p className="text-yellow-400 text-xs mt-1">
                        ⚠️ Please review the receipt and verify or reject it
                      </p>
                    )}
                  </div>
                )}
                {item.proofVerifiedAt && (
                  <p className="text-zinc-500 text-xs mt-2">
                    Verified on {new Date(item.proofVerifiedAt).toLocaleDateString()}
                    {item.proofVerifiedBy && (
                      <span className="ml-2">(by moderator)</span>
                    )}
                  </p>
                )}
                {item.isAnonymous && (
                  <p className="text-zinc-500 text-xs mt-2 italic">
                    🔒 Anonymous purchase
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending claim notice for owner (only if no proof provided yet) */}
          {isOwner && item.claimStatus === 'pending' && item.claimedBy && !item.purchaseProof && (
            <div className="mb-3 p-3 rounded bg-yellow-900/20 border border-yellow-600/30">
              <p className="text-sm text-yellow-400 mb-2">
                ⚠️ Someone has claimed this item but hasn't provided purchase proof yet. 
                You can confirm or reject the claim, or wait for them to submit proof.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleClaim(item.id, "confirm", true)}
                  className="text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
                >
                  ✓ Confirm Purchase
                </button>
                <button
                  onClick={() => handleClaim(item.id, "confirm", false)}
                  className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                >
                  ✗ Reject Claim
                </button>
              </div>
            </div>
          )}

          {/* Size, Quantity, Notes */}
          {(item.size || item.quantity || item.notes) && (
            <div className="text-sm text-zinc-400 mb-3 space-y-1">
              {item.size && (
                <div>
                  <span className="text-zinc-500">Size:</span> <span className="text-white">{item.size}</span>
                </div>
              )}
              {item.quantity && (
                <div>
                  <span className="text-zinc-500">Quantity:</span> <span className="text-white">{item.quantity}</span>
                </div>
              )}
              {item.notes && (
                <div className="italic text-zinc-300">
                  <span className="text-zinc-500">Note:</span> {item.notes}
                </div>
              )}
            </div>
          )}

          {/* Affiliate Disclosure */}
          {item.affiliateUrl && (
            <div className="text-xs text-zinc-500 mb-3 p-2 rounded bg-zinc-900/50 border border-zinc-700/50">
              <span className="text-amber-400">ℹ️</span> This item contains an affiliate link. The wishlist creator will receive a commission if you purchase through this link.
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-700">
            {(() => {
              // Validate affiliate URL - make sure it's a valid product page
              const isValidAffiliateUrl = item.affiliateUrl && (() => {
                try {
                  const url = new URL(item.affiliateUrl);
                  // Reject associate guide pages
                  if (url.hostname.includes('associates.amazon.com') ||
                      url.pathname.includes('associates-start') ||
                      url.pathname.includes('associates/help')) {
                    return false;
                  }
                  // Reject browse/category pages
                  if (url.pathname === '/b' || url.pathname.startsWith('/b?')) {
                    return false;
                  }
                  // For Amazon, check if it has product identifiers
                  if (url.hostname.includes('amazon.com') || url.hostname.includes('amzn.to')) {
                    const hasProductId = url.pathname.includes('/dp/') || 
                                        url.pathname.includes('/gp/product/') ||
                                        url.pathname.includes('/product/') ||
                                        url.searchParams.has('asin');
                    return hasProductId;
                  }
                  return true;
                } catch {
                  return false;
                }
              })();
              const purchaseUrl = (isValidAffiliateUrl ? item.affiliateUrl : item.url) || item.url;
              
              return (
                <a
                  href={purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 whitespace-nowrap"
                  title={isValidAffiliateUrl ? "Using affiliate link" : "View product"}
                >
                  {isValidAffiliateUrl ? "Purchase →" : "View →"}
                </a>
              );
            })()}
            
            <div className="flex flex-wrap gap-2 flex-1 justify-end">
              {isOwner && (
                <>
                  {item.isPurchased && (
                    <button
                      onClick={() => handleClaim(item.id, "unpurchase")}
                      className="text-xs px-2 py-1 rounded bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 whitespace-nowrap"
                      title="Unmark as purchased"
                    >
                      ↶ Unmark Purchased
                    </button>
                  )}
                  <EditItemDetails item={item} onUpdate={fetchItems} />
                  {(item.url.includes("amazon.com") || item.url.includes("amzn.to")) && (
                    <EditAffiliateLink item={item} onUpdate={fetchItems} />
                  )}
                  <button
                    onClick={() => handleRefresh(item)}
                    className="text-xs px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 whitespace-nowrap"
                    title="Refresh item data"
                  >
                    ↻ Refresh
                  </button>
                </>
              )}
              {session && !item.isPurchased && (
                <>
                  {item.isClaimed && item.claimedBy === session.user?.id ? (
                    <>
                      <button
                        onClick={() => setShowPurchaseModal(item.id)}
                        className="text-xs px-2 py-1 rounded bg-green-600/20 hover:bg-green-600/30 text-green-400 whitespace-nowrap"
                      >
                        ✓ Mark as Purchased
                      </button>
                      <button
                        onClick={() => handleClaim(item.id, "unclaim")}
                        className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white whitespace-nowrap"
                      >
                        Unclaim
                      </button>
                    </>
                  ) : item.isClaimed ? (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-400 whitespace-nowrap">
                      Claimed by someone else
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaim(item.id, "claim")}
                      className="text-xs px-2 py-1 rounded bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 whitespace-nowrap"
                    >
                      Claim
                    </button>
                  )}
                  {(() => {
                    // Validate affiliate URL for purchase button too
                    const isValidAffiliateUrl = item.affiliateUrl && (() => {
                      try {
                        const url = new URL(item.affiliateUrl);
                        // Reject associate guide pages
                        if (url.hostname.includes('associates.amazon.com') ||
                            url.pathname.includes('associates-start') ||
                            url.pathname.includes('associates/help')) {
                          return false;
                        }
                        // Reject browse/category pages
                        if (url.pathname === '/b' || url.pathname.startsWith('/b?')) {
                          return false;
                        }
                        // For Amazon, check if it has product identifiers
                        if (url.hostname.includes('amazon.com') || url.hostname.includes('amzn.to')) {
                          const hasProductId = url.pathname.includes('/dp/') || 
                                              url.pathname.includes('/gp/product/') ||
                                              url.pathname.includes('/product/') ||
                                              url.searchParams.has('asin');
                          return hasProductId;
                        }
                        return true;
                      } catch {
                        return false;
                      }
                    })();
                    const purchaseUrl = (isValidAffiliateUrl ? item.affiliateUrl : item.url) || item.url;
                    
                    return (
                      <a
                        href={purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded bg-green-600/20 hover:bg-green-600/30 text-green-400 whitespace-nowrap inline-block text-center"
                      >
                        Purchase
                      </a>
                    );
                  })()}
                </>
              )}
              {isOwner && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 whitespace-nowrap"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })}

      {/* Purchase Proof Modal */}
      {showPurchaseModal && (() => {
        const item = items.find(i => i.id === showPurchaseModal);
        return item ? (
          <PurchaseProofModal
            isOpen={true}
            onClose={() => setShowPurchaseModal(null)}
            itemId={item.id}
            itemTitle={item.title}
            onSuccess={() => {
              fetchItems();
              setShowPurchaseModal(null);
            }}
          />
        ) : null;
      })()}
    </div>
  );
}
