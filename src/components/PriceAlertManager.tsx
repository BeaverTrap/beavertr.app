"use client";

import { useState, useEffect } from "react";

interface PriceAlert {
  id: string;
  itemId: string;
  userId: string;
  targetPrice: string | null;
  percentDrop: number | null;
  isActive: boolean;
  lastNotifiedAt: number | null;
  createdAt: number;
}

interface PriceAlertManagerProps {
  itemId: string;
  currentPrice: string | null;
  priceHistory?: string | null;
}

export default function PriceAlertManager({ itemId, currentPrice, priceHistory }: PriceAlertManagerProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [percentDrop, setPercentDrop] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [itemId]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/wishlist/price-alerts?itemId=${itemId}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice && !percentDrop) return;

    setLoading(true);
    try {
      const response = await fetch("/api/wishlist/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          targetPrice: targetPrice || null,
          percentDrop: percentDrop ? parseInt(percentDrop) : null,
        }),
      });

      if (response.ok) {
        setTargetPrice("");
        setPercentDrop("");
        setShowForm(false);
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error creating alert:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/wishlist/price-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          isActive: !isActive,
        }),
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm("Delete this price alert?")) return;

    try {
      const response = await fetch(`/api/wishlist/price-alerts?alertId=${alertId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const parsePrice = (priceStr: string | null | undefined): number | null => {
    if (!priceStr) return null;
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const formatPrice = (price: string | null) => {
    if (!price) return "N/A";
    return price;
  };

  const history = priceHistory ? JSON.parse(priceHistory) : [];
  const priceChange = history.length > 1 
    ? (() => {
        const latest = parsePrice(history[history.length - 1]?.price);
        const previous = parsePrice(history[history.length - 2]?.price);
        if (latest !== null && previous !== null) {
          const change = latest - previous;
          const percent = ((change / previous) * 100).toFixed(1);
          return { change, percent, isIncrease: change > 0 };
        }
        return null;
      })()
    : null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-300">Price Tracking</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs px-3 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Alert"}
        </button>
      </div>

      {/* Price History */}
      {history.length > 0 && (
        <div className="mb-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Current: {formatPrice(currentPrice)}</span>
            {priceChange && (
              <span className={priceChange.isIncrease ? "text-green-400" : "text-red-400"}>
                {priceChange.isIncrease ? "↑" : "↓"} {Math.abs(parseFloat(priceChange.percent))}%
              </span>
            )}
          </div>
          <div className="text-zinc-500 mt-1">
            {history.length} price point{history.length !== 1 ? "s" : ""} tracked
          </div>
        </div>
      )}

      {/* Create Alert Form */}
      {showForm && (
        <form onSubmit={handleCreateAlert} className="mb-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Target Price (optional)</label>
              <input
                type="text"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g., $29.99"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Percent Drop (optional)</label>
              <input
                type="number"
                value={percentDrop}
                onChange={(e) => setPercentDrop(e.target.value)}
                placeholder="e.g., 20 for 20%"
                min="1"
                max="100"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || (!targetPrice && !percentDrop)}
              className="w-full px-3 py-2 rounded-lg bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Alert"}
            </button>
          </div>
        </form>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-zinc-700/50"
            >
              <div className="flex-1 text-xs">
                {alert.targetPrice && (
                  <div className="text-zinc-300">
                    Alert at {formatPrice(alert.targetPrice)}
                  </div>
                )}
                {alert.percentDrop && (
                  <div className="text-zinc-300">
                    Alert on {alert.percentDrop}% drop
                  </div>
                )}
                {alert.lastNotifiedAt && (
                  <div className="text-zinc-500 text-xs mt-1">
                    Last notified: {new Date(alert.lastNotifiedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleAlert(alert.id, alert.isActive)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    alert.isActive
                      ? "bg-green-600/80 hover:bg-green-600 text-white"
                      : "bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300"
                  }`}
                >
                  {alert.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && !showForm && (
        <div className="text-xs text-zinc-500 text-center py-2">
          No price alerts set
        </div>
      )}
    </div>
  );
}


