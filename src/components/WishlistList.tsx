"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import EditAffiliateLink from "./EditAffiliateLink";
import EditItemDetails from "./EditItemDetails";
import PurchaseProofModal from "./PurchaseProofModal";
import ItemComments from "./ItemComments";
import ItemReactions from "./ItemReactions";

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
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
      }
    });

  if (items.length === 0) {
    return <div className="text-zinc-400">No items yet. Add some!</div>;
  }

  return (
    <div>
      {/* Search, Filter, and Sort Controls */}
      <div className="mb-6 space-y-3">
        {/* Search Bar */}
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-white hover:bg-zinc-700/80 transition-colors flex items-center gap-2"
            title={showSearch ? "Hide search" : "Show search"}
          >
            <span>{showSearch ? "🔍" : "🔍"}</span>
            <span className="hidden sm:inline">{showSearch ? "Hide" : "Show"} Search</span>
          </button>
          {showSearch && (
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full px-4 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  ✕
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
            className="px-4 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-white hover:bg-zinc-700/80 transition-colors"
          >
            {showFilters ? "Hide" : "Show"} Filters
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
          <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-300">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
                >
                  <option value="date">Date Added</option>
                  <option value="price">Price</option>
                  <option value="priority">Priority</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-300">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
                >
                  <option value="all">All Items</option>
                  <option value="available">Available</option>
                  <option value="claimed">Claimed</option>
                  <option value="purchased">Purchased</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-300">Category:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
                >
                  <option value="all">All Categories</option>
                  {Array.from(new Set(items.map(i => i.category).filter(Boolean) as string[])).map(cat => (
                    <option key={cat} value={String(cat)}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-300">Store:</label>
                <select
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  className="px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
                >
                  <option value="all">All Stores</option>
                  {Array.from(new Set(items.map(i => getStoreName(i.url)))).sort().map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-300">Prime:</label>
                <select
                  value={filterPrime === null ? "all" : filterPrime ? "prime" : "non-prime"}
                  onChange={(e) => {
                    if (e.target.value === "all") setFilterPrime(null);
                    else if (e.target.value === "prime") setFilterPrime(true);
                    else setFilterPrime(false);
                  }}
                  className="px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        
        return (
        <div
          key={item.id}
          className={`p-4 rounded-lg bg-zinc-800 border transition-colors overflow-hidden ${
            item.isPurchased
              ? "border-green-600 opacity-60"
              : item.isClaimed
              ? "border-yellow-600"
              : selectedItems.has(item.id)
              ? "border-blue-500 ring-2 ring-blue-500/50"
              : "border-zinc-700 hover:border-zinc-600"
          } ${isOwner && !bulkMode && sortBy === "order" ? "cursor-move" : ""}`}
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
            {item.category && (
              <span className="px-2 py-1 text-xs rounded bg-blue-600/20 text-blue-400">
                {item.category}
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
                className="text-xs px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 transition-colors"
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
    </div>
  );
}
