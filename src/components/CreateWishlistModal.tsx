"use client";

import { useState } from "react";
import IconColorPicker from "./IconColorPicker";

interface CreateWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; icon: string | null; color: string | null }) => void;
}

export default function CreateWishlistModal({ isOpen, onClose, onCreate }: CreateWishlistModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), icon, color });
    setName("");
    setIcon(null);
    setColor(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 border border-zinc-700">
        <h3 className="text-xl font-bold mb-4">Create New Wishlist</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Wishlist Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Wishlist"
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              required
            />
          </div>

          <IconColorPicker
            selectedIcon={icon}
            selectedColor={color}
            onIconChange={setIcon}
            onColorChange={setColor}
          />

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

