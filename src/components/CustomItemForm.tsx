"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface CustomItemFormProps {
  wishlistId: string;
  onItemAdded?: () => void;
  onClose: () => void;
}

export default function CustomItemForm({ wishlistId, onItemAdded, onClose }: CustomItemFormProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const commonCategories = [
    "Electronics", "Clothing", "Books", "Home & Kitchen", "Toys & Games",
    "Sports & Outdoors", "Beauty & Personal Care", "Automotive", "Food & Beverages",
    "Health & Wellness", "Office Supplies", "Pet Supplies", "Travel", "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      alert("Please sign in to add items");
      return;
    }

    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/wishlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishlistId,
          url: imageUrl || "https://via.placeholder.com/400",
          title: title.trim(),
          price: price.trim() || null,
          description: description.trim() || null,
          image: imageUrl.trim() || null,
          category: category.trim() || null,
          size: size.trim() || null,
          quantity: quantity ? parseInt(quantity) : null,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        setTitle("");
        setPrice("");
        setDescription("");
        setImageUrl("");
        setCategory("");
        setSize("");
        setQuantity("");
        setNotes("");
        if (onItemAdded) {
          onItemAdded();
        }
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error adding item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-2xl w-full border border-zinc-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Custom Item</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item name"
              required
              className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$0.00"
                className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
              >
                <option value="">Select category...</option>
                {commonCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Item description..."
              rows={3}
              className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Large, XL, 10"
                className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}







