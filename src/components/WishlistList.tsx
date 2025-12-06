"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import EditAffiliateLink from "./EditAffiliateLink";
import EditItemDetails from "./EditItemDetails";
import PurchaseProofModal from "./PurchaseProofModal";
import ItemComments from "./ItemComments";
import ItemReactions from "./ItemReactions";
import ImageCropper from "./ImageCropper";

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
  itemType?: string | null;
  category?: string | null;
  tags?: string | null;
  size?: string | null;
  quantity?: number | null;
  priceHistory?: string | null;
  displayOrder?: number | null;
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
  const [editingSize, setEditingSize] = useState<{ [key: string]: string }>({});
  const [editingImage, setEditingImage] = useState<{ itemId: string; image: string; file?: File } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ [key: string]: string }>({});
  
  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "price" | "priority" | "name" | "order">("date");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "claimed" | "purchased">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStore, setFilterStore] = useState<string>("all");
  const [filterPrime, setFilterPrime] = useState<boolean | null>(null);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
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

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query) ||
          item.size?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filterStatus === "available") {
        return !item.isClaimed && !item.isPurchased && item.claimStatus !== "purchased";
      } else if (filterStatus === "claimed") {
        return item.isClaimed || item.claimStatus === "pending" || item.claimStatus === "confirmed";
      } else if (filterStatus === "purchased") {
        return item.isPurchased || item.claimStatus === "purchased";
      }
      
      // Category filter
      if (filterCategory !== "all" && item.category !== filterCategory) {
        return false;
      }
      
      // Store filter
      if (filterStore !== "all") {
        const itemStore = getStoreName(item.url);
        if (itemStore !== filterStore) {
          return false;
        }
      }
      
      // Prime filter (for Amazon items)
      if (filterPrime !== null) {
        const isAmazon = item.url.includes("amazon.com") || item.url.includes("amzn.to");
        if (filterPrime) {
          // Only show Amazon items, and check if description mentions Prime
          if (!isAmazon) return false;
          const hasPrime = item.description?.toLowerCase().includes("prime") || 
                          item.title?.toLowerCase().includes("prime") ||
                          item.notes?.toLowerCase().includes("prime");
          if (!hasPrime) return false;
        } else {
          // Show non-Prime items (either non-Amazon or Amazon without Prime)
          if (isAmazon) {
            const hasPrime = item.description?.toLowerCase().includes("prime") || 
                            item.title?.toLowerCase().includes("prime") ||
                            item.notes?.toLowerCase().includes("prime");
            if (hasPrime) return false;
          }
        }
      }
      
      // Price range filter
      if (priceMin || priceMax) {
        const itemPrice = parseFloat(item.price?.replace(/[^0-9.]/g, "") || "0");
        if (priceMin) {
          const min = parseFloat(priceMin);
          if (!isNaN(min) && itemPrice < min) return false;
        }
        if (priceMax) {
          const max = parseFloat(priceMax);
          if (!isNaN(max) && itemPrice > max) return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") {
        const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, "") || "0");
        const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, "") || "0");
        return priceB - priceA; // Highest first
      } else if (sortBy === "priority") {
        return (b.priority || 0) - (a.priority || 0); // High priority first
      } else if (sortBy === "name") {
        return (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "order") {
        return (a.displayOrder || 0) - (b.displayOrder || 0); // By display order
      } else { // date (default)
        // When not sorting by order, still respect displayOrder if items have it set
        if (a.displayOrder !== null && b.displayOrder !== null) {
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
      }
    });

  if (items.length === 0) {
    return <div className="text-zinc-400">No items yet. Add some!</div>;
  }

  return (
    <div>
      {/* Search, Filter, and Sort Controls */}
      <div className="mb-4 space-y-2">
        {/* Search Bar */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-all"
            title={showSearch ? "Hide search" : "Show search"}
          >
            <svg className={`w-4 h-4 transition-transform ${showSearch ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSearch && (
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {isOwner && (
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                if (bulkMode) {
                  setSelectedItems(new Set());
                  setShowBulkActions(false);
                }
              }}
              className={`px-4 py-2 rounded-xl border transition-colors ${
                bulkMode 
                  ? "bg-blue-600/80 border-blue-500 text-white" 
                  : "bg-zinc-800/80 border-zinc-700/50 text-white hover:bg-zinc-700/80"
              }`}
            >
              {bulkMode ? "Cancel" : "Select"}
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-all"
          >
            <svg className={`w-4 h-4 transition-transform ${showFilters ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {isOwner && bulkMode && selectedItems.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-900/20 border border-blue-700/50">
            <span className="text-sm text-blue-300">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={async () => {
                  if (confirm(`Delete ${selectedItems.size} item(s)?`)) {
                    try {
                      await Promise.all(
                        Array.from(selectedItems).map(id =>
                          fetch(`/api/wishlist/items?id=${id}`, { method: "DELETE" })
                        )
                      );
                      setSelectedItems(new Set());
                      setBulkMode(false);
                      fetchItems();
                    } catch (error) {
                      console.error("Error deleting items:", error);
                      alert("Error deleting items");
                    }
                  }
                }}
                className="px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Selected
              </button>
              <button
                onClick={() => {
                  const newPriority = prompt("Set priority (1 = High, 0 = Normal, -1 = Low):");
                  if (newPriority !== null) {
                    const priority = parseInt(newPriority);
                    if (!isNaN(priority)) {
                      Promise.all(
                        Array.from(selectedItems).map(id =>
                          fetch("/api/wishlist/items", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id, priority }),
                          })
                        )
                      ).then(() => {
                        setSelectedItems(new Set());
                        setBulkMode(false);
                        fetchItems();
                      });
                    }
                  }
                }}
                className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Set Priority
              </button>
              <button
                onClick={() => {
                  const category = prompt("Set category:");
                  if (category !== null) {
                    Promise.all(
                      Array.from(selectedItems).map(id =>
                        fetch("/api/wishlist/items", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id, category: category.trim() || null }),
                        })
                      )
                    ).then(() => {
                      setSelectedItems(new Set());
                      setBulkMode(false);
                      fetchItems();
                    });
                  }
                }}
                className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Set Category
              </button>
            </div>
          </div>
        )}

        {/* Filter and Sort Options */}
        {showFilters && (
          <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 text-xs rounded-md bg-zinc-900/50 border border-zinc-800/50 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-700/50 transition-all"
                >
                  <option value="date">Date</option>
                  <option value="price">Price</option>
                  <option value="priority">Priority</option>
                  <option value="name">Name</option>
                  <option value="order">Custom Order</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-2 py-1 text-xs rounded-md bg-zinc-900/50 border border-zinc-800/50 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-700/50 transition-all"
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="claimed">Claimed</option>
                  <option value="purchased">Purchased</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Category:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2 py-1 text-xs rounded-md bg-zinc-900/50 border border-zinc-800/50 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-700/50 transition-all"
                >
                  <option value="all">All</option>
                  {Array.from(new Set(items.map(i => i.category).filter(Boolean) as string[])).map(cat => (
                    <option key={cat} value={String(cat)}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Store:</label>
                <select
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  className="px-2 py-1 text-xs rounded-md bg-zinc-900/50 border border-zinc-800/50 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-700/50 transition-all"
                >
                  <option value="all">All</option>
                  {Array.from(new Set(items.map(i => getStoreName(i.url)))).sort().map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Prime:</label>
                <select
                  value={filterPrime === null ? "all" : filterPrime ? "prime" : "non-prime"}
                  onChange={(e) => {
                    if (e.target.value === "all") setFilterPrime(null);
                    else if (e.target.value === "prime") setFilterPrime(true);
                    else setFilterPrime(false);
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-zinc-900/50 border border-zinc-700/30 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-600/50 transition-all"
                >
                  <option value="all">All Items</option>
                  <option value="prime">Prime Only</option>
                  <option value="non-prime">Non-Prime</option>
                </select>
              </div>
            </div>
            
            {/* Price Range */}
            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm text-zinc-300">Price Range:</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">$</span>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  min="0"
                  step="0.01"
                  className="w-24 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
                />
              </div>
              <span className="text-zinc-500">to</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">$</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  min="0"
                  step="0.01"
                  className="w-24 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
                />
              </div>
              {(priceMin || priceMax) && (
                <button
                  onClick={() => {
                    setPriceMin("");
                    setPriceMax("");
                  }}
                  className="px-2 py-1 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-white"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
              <div className="text-sm text-zinc-400">
                Showing {filteredAndSortedItems.length} of {items.length} items
              </div>
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterCategory("all");
                  setFilterStore("all");
                  setFilterPrime(null);
                  setPriceMin("");
                  setPriceMax("");
                }}
                className="px-3 py-1 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items Grid */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-zinc-400 text-center py-8">
          {searchQuery || filterStatus !== "all" 
            ? "No items match your filters" 
            : "No items yet. Add some!"}
        </div>
      ) : (
        <div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          onDragOver={(e) => {
            if (isOwner && !bulkMode && draggedItem) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }
          }}
        >
          {filteredAndSortedItems.map((item) => {
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
        
        const isDragging = draggedItem === item.id;
        
        return (
        <div
          key={item.id}
          draggable={isOwner && !bulkMode}
          onDragStart={(e) => {
            setDraggedItem(item.id);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.id);
            (e.target as HTMLElement).style.opacity = '0.5';
          }}
          onDragOver={(e) => {
            if (isOwner && !bulkMode && draggedItem && draggedItem !== item.id) {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
              (e.currentTarget as HTMLElement).classList.add('ring-2', 'ring-blue-500/50');
            }
          }}
          onDragLeave={(e) => {
            (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-blue-500/50');
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-blue-500/50');
            
            if (!isOwner || bulkMode || !draggedItem || draggedItem === item.id) return;
            
            // Get all items in the wishlist (not filtered/sorted)
            const allItems = [...items];
            const draggedIndex = allItems.findIndex(i => i.id === draggedItem);
            const targetIndex = allItems.findIndex(i => i.id === item.id);
            
            if (draggedIndex === -1 || targetIndex === -1) return;
            
            // Calculate new display orders based on current order
            const itemsToUpdate: Array<{ id: string; displayOrder: number }> = [];
            const newItems = [...allItems];
            const [dragged] = newItems.splice(draggedIndex, 1);
            newItems.splice(targetIndex, 0, dragged);
            
            // Update display orders - use a base offset to ensure they're unique
            const baseOrder = Math.max(...allItems.map(i => i.displayOrder || 0), 0);
            newItems.forEach((item, index) => {
              itemsToUpdate.push({ id: item.id, displayOrder: baseOrder + index + 1 });
            });
            
            // Save new order
            try {
              await Promise.all(
                itemsToUpdate.map(({ id, displayOrder }) =>
                  fetch("/api/wishlist/items", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, displayOrder }),
                  })
                )
              );
              setDraggedItem(null);
              fetchItems();
            } catch (error) {
              console.error("Error reordering items:", error);
              setDraggedItem(null);
            }
          }}
          onDragEnd={(e) => {
            (e.target as HTMLElement).style.opacity = '1';
            setDraggedItem(null);
          }}
          className={`group relative bg-zinc-900/40 backdrop-blur-sm rounded-xl border border-zinc-800/50 transition-all duration-200 ${
            item.isPurchased
              ? "opacity-50 border-green-500/20"
              : item.isClaimed
              ? "border-yellow-500/20"
              : selectedItems.has(item.id)
              ? "border-blue-500/50 ring-1 ring-blue-500/30"
              : isDragging
              ? "opacity-50 scale-95"
              : "hover:border-zinc-700/70 hover:bg-zinc-900/60"
          } ${isOwner && !bulkMode ? "cursor-grab active:cursor-grabbing" : ""}`}
        >
          {/* Bulk Selection Checkbox */}
          {isOwner && bulkMode && (
            <div className="mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedItems);
                    if (e.target.checked) {
                      newSelected.add(item.id);
                    } else {
                      newSelected.delete(item.id);
                    }
                    setSelectedItems(newSelected);
                    setShowBulkActions(newSelected.size > 0);
                  }}
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-2 focus:ring-blue-500/50"
                />
                <span className="text-xs text-zinc-400">Select</span>
              </label>
            </div>
          )}
          {/* Image - Clickable with Edit Option */}
          {item.image && (
            <div className="relative w-full aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-zinc-950/50 group/image">
              <a
                href={clickableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full hover:opacity-90 transition-opacity cursor-pointer"
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
              {isOwner && (
                <button
                  onClick={() => {
                    setEditingImage({ itemId: item.id, image: item.image || '' });
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover/image:opacity-100 transition-all backdrop-blur-md"
                  title="Edit image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="p-3 space-y-2">
          {/* Store Name */}
          <div>
            <a
              href={clickableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-full bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 transition-colors"
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
            <h3 className="text-sm font-medium text-white line-clamp-2 hover:text-blue-400 transition-colors leading-snug">
              {item.title}
            </h3>
          </a>

          {/* Price */}
          <div className="text-base font-semibold text-green-400">
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
            const shouldTruncate = description.length > 100;
            const displayText = isExpanded || !shouldTruncate 
              ? description 
              : description.substring(0, 100) + '...';
            
            return (
              <div>
                <p className="text-xs text-zinc-500 leading-relaxed">
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
                    className="text-[10px] text-zinc-500 hover:text-zinc-400 mt-1 transition-colors"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            );
          })()}
          </div>

          {/* Status badges */}
          <div className="px-3 pb-3 flex gap-1.5 flex-wrap items-center">
            {item.isPurchased && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-400">
                Purchased
              </span>
            )}
            {item.claimStatus === 'purchased' && !item.isPurchased && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-400">
                Purchased
              </span>
            )}
            {item.claimStatus === 'pending' && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-yellow-500/10 text-yellow-400">
                Pending
              </span>
            )}
            {item.claimStatus === 'confirmed' && !item.isPurchased && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-400">
                Confirmed
              </span>
            )}
            {item.isClaimed && item.claimStatus !== 'pending' && item.claimStatus !== 'confirmed' && item.claimStatus !== 'purchased' && !item.isPurchased && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-yellow-500/10 text-yellow-400">
                Claimed
              </span>
            )}
            {item.priority === 1 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-500/10 text-red-400">
                High
              </span>
            )}
            {/* Category - editable for owners */}
            {isOwner ? (
              <div className="flex items-center gap-1">
                {editingCategory[item.id] !== undefined ? (
                  <input
                    type="text"
                    value={editingCategory[item.id]}
                    onChange={(e) => {
                      setEditingCategory(prev => ({ ...prev, [item.id]: e.target.value }));
                    }}
                    onBlur={async (e) => {
                      const newCategory = e.target.value.trim();
                      setEditingCategory(prev => {
                        const newState = { ...prev };
                        delete newState[item.id];
                        return newState;
                      });
                      if (newCategory !== (item.category || '')) {
                        try {
                          await fetch("/api/wishlist/items", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: item.id, category: newCategory || null }),
                          });
                          fetchItems();
                        } catch (error) {
                          console.error("Error updating category:", error);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                      if (e.key === "Escape") {
                        setEditingCategory(prev => {
                          const newState = { ...prev };
                          delete newState[item.id];
                          return newState;
                        });
                      }
                    }}
                    placeholder="Category"
                    autoFocus
                    className="px-2 py-0.5 text-xs rounded-md bg-zinc-900/50 border border-zinc-700/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-24"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditingCategory(prev => ({ ...prev, [item.id]: item.category || '' }));
                    }}
                    className={`px-1.5 py-0.5 text-[10px] rounded-full transition-all ${
                      item.category
                        ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/15"
                        : "bg-zinc-800/30 text-zinc-500 hover:bg-zinc-700/40 hover:text-zinc-400"
                    }`}
                    title="Click to edit category"
                  >
                    {item.category || "+"}
                  </button>
                )}
              </div>
            ) : item.category ? (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500/10 text-blue-400">
                {item.category}
              </span>
            ) : null}
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
              {/* Size - inline edit for owners, display for others */}
              {item.size && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Size:</span>
                  {isOwner ? (
                    <input
                      type="text"
                      value={editingSize[item.id] !== undefined ? editingSize[item.id] : item.size}
                      onChange={(e) => {
                        setEditingSize(prev => ({ ...prev, [item.id]: e.target.value }));
                      }}
                      onBlur={async (e) => {
                        const newSize = e.target.value.trim();
                        setEditingSize(prev => {
                          const newState = { ...prev };
                          delete newState[item.id];
                          return newState;
                        });
                        if (newSize !== item.size) {
                          try {
                            await fetch("/api/wishlist/items", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: item.id, size: newSize || null }),
                            });
                            fetchItems();
                          } catch (error) {
                            console.error("Error updating size:", error);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      className="px-2 py-0.5 text-sm rounded bg-zinc-900/50 border border-zinc-700/50 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-24"
                    />
                  ) : (
                    <span className="text-white">{item.size}</span>
                  )}
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
          
          {/* Add size button for owners if no size exists */}
          {isOwner && !item.size && (
            <div className="mb-3">
              <button
                onClick={() => {
                  setEditingSize(prev => ({ ...prev, [item.id]: "" }));
                }}
                    className="text-xs px-2 py-1 rounded-md bg-zinc-800/30 hover:bg-zinc-700/40 text-zinc-300 border border-zinc-700/30 hover:border-zinc-600/50 transition-all"
              >
                + Add size
              </button>
              {editingSize[item.id] !== undefined && (
                <input
                  type="text"
                  value={editingSize[item.id]}
                  onChange={(e) => {
                    setEditingSize(prev => ({ ...prev, [item.id]: e.target.value }));
                  }}
                  onBlur={async (e) => {
                    const newSize = e.target.value.trim();
                    setEditingSize(prev => {
                      const newState = { ...prev };
                      delete newState[item.id];
                      return newState;
                    });
                    if (newSize) {
                      try {
                        await fetch("/api/wishlist/items", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: item.id, size: newSize }),
                        });
                        fetchItems();
                      } catch (error) {
                        console.error("Error updating size:", error);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                    if (e.key === "Escape") {
                      setEditingSize(prev => {
                        const newState = { ...prev };
                        delete newState[item.id];
                        return newState;
                      });
                    }
                  }}
                  placeholder="Large, XL, 10"
                  autoFocus
                  className="ml-2 px-2 py-0.5 text-sm rounded bg-zinc-900/50 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-24"
                />
              )}
            </div>
          )}

          {/* Affiliate Disclosure */}
          {item.affiliateUrl && (
            <div className="text-xs text-zinc-500 mb-3 p-2 rounded bg-zinc-900/50 border border-zinc-700/50">
              <span className="text-amber-400">ℹ️</span> This item contains an affiliate link. The wishlist creator will receive a commission if you purchase through this link.
            </div>
          )}

          {/* Reactions */}
          <ItemReactions itemId={item.id} />

          {/* Comments */}
          <ItemComments itemId={item.id} isOwner={isOwner} />

          {/* Actions */}
          <div className="px-3 pb-3 pt-2 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/50">
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
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
                  title={isValidAffiliateUrl ? "Using affiliate link" : "View product"}
                >
                  {isValidAffiliateUrl ? "Purchase" : "View"} →
                </a>
              );
            })()}
            
            <div className="flex flex-wrap gap-1 flex-1 justify-end">
              {isOwner && (
                <>
                  {item.isPurchased && (
                    <button
                      onClick={() => handleClaim(item.id, "unpurchase")}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 hover:bg-orange-500/15 text-orange-400 transition-all"
                      title="Unmark as purchased"
                    >
                      Unmark
                    </button>
                  )}
                  <EditItemDetails item={item} onUpdate={fetchItems} />
                  {(item.url.includes("amazon.com") || item.url.includes("amzn.to")) && (
                    <EditAffiliateLink item={item} onUpdate={fetchItems} />
                  )}
                  <button
                    onClick={() => handleRefresh(item)}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/15 text-blue-400 transition-all"
                    title="Refresh item data"
                  >
                    ↻
                  </button>
                </>
              )}
              {session && !item.isPurchased && (
                <>
                  {item.isClaimed && item.claimedBy === session.user?.id ? (
                    <>
                      <button
                        onClick={() => setShowPurchaseModal(item.id)}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 hover:bg-green-500/15 text-green-400 transition-all"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleClaim(item.id, "unclaim")}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 transition-all"
                      >
                        Unclaim
                      </button>
                    </>
                  ) : item.isClaimed ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                      Claimed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaim(item.id, "claim")}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 hover:bg-yellow-500/15 text-yellow-400 transition-all"
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
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 hover:bg-green-500/15 text-green-400 transition-all whitespace-nowrap inline-block text-center"
                      >
                        Buy
                      </a>
                    );
                  })()}
                </>
              )}
              {isOwner && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 hover:bg-red-500/15 text-red-400 transition-all"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })}
        </div>
      )}

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

      {/* Image Editor Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 rounded-lg border border-zinc-700 p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Edit Image</h2>
              <button
                onClick={() => setEditingImage(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ImageCropper
              image={editingImage.image}
              originalFile={editingImage.file}
              uploading={uploadingImage}
              aspect={undefined}
              cropShape="rect"
              title="Edit Image"
              onCropComplete={async (croppedImage, mimeType) => {
                setUploadingImage(true);
                try {
                  // Convert data URL to blob
                  const response = await fetch(croppedImage);
                  const blob = await response.blob();
                  
                  // Upload to Vercel Blob Storage
                  const formData = new FormData();
                  const fileExtension = mimeType.split('/')[1] || 'jpg';
                  formData.append('file', blob, `item-${editingImage.itemId}-${Date.now()}.${fileExtension}`);
                  
                  const uploadResponse = await fetch('/api/wishlist/items/upload-image', {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(errorData.error || 'Failed to upload image');
                  }
                  
                  const { url } = await uploadResponse.json();
                  
                  // Update item with new image URL
                  const updateResponse = await fetch('/api/wishlist/items', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingImage.itemId, image: url }),
                  });
                  
                  if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.error || 'Failed to update item');
                  }
                  
                  await fetchItems();
                  setEditingImage(null);
                } catch (error: any) {
                  console.error('Error updating image:', error);
                  alert(error.message || 'Failed to update image. Please try again.');
                } finally {
                  setUploadingImage(false);
                }
              }}
              onCancel={() => setEditingImage(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
