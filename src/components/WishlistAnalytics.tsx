"use client";

import { useEffect, useState } from "react";

interface WishlistItem {
  id: string;
  title: string;
  price?: string | null;
  category?: string | null;
  isPurchased?: boolean;
  isClaimed?: boolean;
  priority?: number | null;
  createdAt: string;
}

interface WishlistAnalyticsProps {
  wishlistId: string;
}

export default function WishlistAnalytics({ wishlistId }: WishlistAnalyticsProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wishlist/items?wishlistId=${wishlistId}`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [wishlistId]);

  if (loading) {
    return <div className="text-zinc-400">Loading analytics...</div>;
  }

  // Calculate statistics
  const totalItems = items.length;
  const purchasedItems = items.filter(i => i.isPurchased).length;
  const claimedItems = items.filter(i => i.isClaimed && !i.isPurchased).length;
  const availableItems = totalItems - purchasedItems - claimedItems;
  
  // Calculate total value
  const totalValue = items
    .filter(i => !i.isPurchased && i.price)
    .reduce((sum, item) => {
      const price = parseFloat(item.price?.replace(/[^0-9.]/g, "") || "0");
      return sum + price;
    }, 0);

  // Category breakdown
  const categoryCounts: { [key: string]: number } = {};
  items.forEach(item => {
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }
  });

  // Priority breakdown
  const highPriority = items.filter(i => i.priority === 1).length;
  const normalPriority = items.filter(i => (i.priority || 0) === 0).length;
  const lowPriority = items.filter(i => i.priority === -1).length;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Analytics</h3>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="text-2xl font-bold text-white">{totalItems}</div>
          <div className="text-sm text-zinc-400">Total Items</div>
        </div>
        <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/50">
          <div className="text-2xl font-bold text-green-400">{purchasedItems}</div>
          <div className="text-sm text-zinc-400">Purchased</div>
        </div>
        <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-700/50">
          <div className="text-2xl font-bold text-yellow-400">{claimedItems}</div>
          <div className="text-sm text-zinc-400">Claimed</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-700/50">
          <div className="text-2xl font-bold text-blue-400">{availableItems}</div>
          <div className="text-sm text-zinc-400">Available</div>
        </div>
      </div>

      {/* Total Value */}
      {totalValue > 0 && (
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-1">Total Wishlist Value</div>
          <div className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</div>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="text-sm font-semibold text-zinc-300 mb-3">By Category</div>
          <div className="space-y-2">
            {Object.entries(categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-zinc-400">{category}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Priority Breakdown */}
      <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
        <div className="text-sm font-semibold text-zinc-300 mb-3">By Priority</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-red-400">High Priority</span>
            <span className="text-white font-medium">{highPriority}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Normal</span>
            <span className="text-white font-medium">{normalPriority}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Low Priority</span>
            <span className="text-white font-medium">{lowPriority}</span>
          </div>
        </div>
      </div>
    </div>
  );
}






