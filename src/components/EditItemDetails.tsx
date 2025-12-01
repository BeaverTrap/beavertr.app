"use client";

import { useState } from "react";

interface EditItemDetailsProps {
  item: {
    id: string;
    notes?: string | null;
    itemType?: string | null;
    size?: string | null;
    quantity?: number | null;
  };
  onUpdate: () => void;
}

export default function EditItemDetails({ item, onUpdate }: EditItemDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [itemType, setItemType] = useState(item.itemType || "");
  const [size, setSize] = useState(item.size || "");
  const [quantity, setQuantity] = useState(item.quantity?.toString() || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/wishlist/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          notes: notes.trim() || null,
          itemType: itemType || null,
          size: size.trim() || null,
          quantity: quantity ? parseInt(quantity) : null,
        }),
      });

      if (response.ok) {
        setIsOpen(false);
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update item details");
      }
    } catch (error) {
      console.error("Error updating item details:", error);
      alert("Error updating item details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-2 py-1 rounded bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap"
        title="Edit notes, type, size, quantity"
      >
        ✏️ Edit Details
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full border border-zinc-700">
        <h3 className="text-lg font-semibold mb-4">Edit Item Details</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes, special instructions, etc."
              rows={3}
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Item Type</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white"
            >
              <option value="">Select type...</option>
              <option value="clothing">👕 Clothing</option>
              <option value="shoes">👟 Shoes</option>
              <option value="hat">🧢 Hat</option>
              <option value="accessories">💍 Accessories</option>
              <option value="other">📦 Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g., Large, XL, 10"
                className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 2"
                min="1"
                className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setNotes(item.notes || "");
                setItemType(item.itemType || "");
                setSize(item.size || "");
                setQuantity(item.quantity?.toString() || "");
              }}
              className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

