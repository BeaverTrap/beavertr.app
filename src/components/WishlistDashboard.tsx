"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WishlistForm from "@/components/WishlistForm";
import WishlistList from "@/components/WishlistList";
import AuthButton from "@/components/AuthButton";
import WishlistInstructions from "@/components/WishlistInstructions";
import CreateWishlistModal from "@/components/CreateWishlistModal";
import IconColorPicker from "@/components/IconColorPicker";
import WishlistIcon from "@/components/WishlistIcon";

interface Wishlist {
  id: string;
  name: string;
  description?: string;
  privacy: string;
  shareLink: string | null;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
}

export default function WishlistDashboard() {
  const { data: session } = useSession();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [activeWishlistId, setActiveWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIconWishlistId, setEditingIconWishlistId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    try {
      const response = await fetch("/api/wishlists");
      if (response.ok) {
        const data = await response.json();
        setWishlists(data);
        // Only set default if no active wishlist is selected
        if (data.length > 0 && !activeWishlistId) {
          const defaultWishlist = data.find((w: Wishlist) => w.isDefault === true || w.isDefault === (1 as any)) || data[0];
          setActiveWishlistId(defaultWishlist.id);
        }
      }
    } catch (error) {
      console.error("Error fetching wishlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWishlist = async (data: { name: string; icon: string | null; color: string | null }) => {
    try {
      const response = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newWishlist = await response.json();
        // Add the new wishlist to the state immediately
        setWishlists(prev => [...prev, newWishlist]);
        // Automatically select the newly created wishlist
        setActiveWishlistId(newWishlist.id);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create wishlist");
      }
    } catch (error) {
      console.error("Error creating wishlist:", error);
      alert("Error creating wishlist. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <Navbar />
        <div className="text-base-content/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wishlist Selector */}
        <div className="mb-8 flex items-center gap-4 flex-wrap">
          <h2 className="text-2xl font-bold">My Wishlists</h2>
          {wishlists.map((wishlist) => (
            <button
              key={wishlist.id}
              onClick={() => setActiveWishlistId(wishlist.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeWishlistId === wishlist.id
                  ? "bg-base-content text-base-100"
                  : "bg-base-200 text-base-content hover:bg-base-300"
              }`}
            >
              <WishlistIcon icon={wishlist.icon} color={wishlist.color} size={20} />
              {wishlist.name}
            </button>
          ))}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-base-200 text-base-content hover:bg-base-300 transition-colors"
          >
            + New List
          </button>
        </div>

        {/* Active Wishlist Content */}
        {activeWishlistId ? (
          <WishlistContent wishlistId={activeWishlistId} wishlists={wishlists} />
        ) : (
          <div className="text-center py-16 text-base-content/70">
            <p>Select or create a wishlist to get started</p>
          </div>
        )}
      </main>

      <CreateWishlistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateWishlist}
      />
    </div>
  );
}

function WishlistContent({ wishlistId, wishlists }: { wishlistId: string; wishlists: Wishlist[] }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const { data: session } = useSession();
  
  const wishlist = wishlists.find(w => w.id === wishlistId);
  const shareUrl = wishlist?.shareLink 
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://beavertr.app'}/${wishlist.shareLink}`
    : null;
  
  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };
  
  const handleRename = async () => {
    if (!wishlist) return;
    
    const newName = prompt("Enter new wishlist name:", wishlist.name);
    if (!newName || !newName.trim() || newName.trim() === wishlist.name) return;
    
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      
      if (response.ok) {
        // Refresh the page to update the wishlist name in the tabs
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to rename wishlist");
      }
    } catch (error) {
      console.error("Error renaming wishlist:", error);
      alert("Error renaming wishlist");
    }
  };

  const handleIconColorUpdate = async (icon: string | null, color: string | null) => {
    if (!wishlist) return;
    
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icon, color }),
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update icon/color");
      }
    } catch (error) {
      console.error("Error updating icon/color:", error);
      alert("Error updating icon/color");
    }
  };
  
  const handlePrivacyChange = async (privacy: string) => {
    if (!wishlist || wishlist.privacy === privacy) return;
    
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy }),
      });
      
      if (response.ok) {
        const updated = await response.json();
        // Update the wishlist in the parent component's state
        // We need to trigger a refresh of the wishlists
        window.location.reload();
      } else {
        const error = await response.json();
        console.error("Privacy update error:", error);
        alert(error.error || "Failed to update privacy");
      }
    } catch (error) {
      console.error("Error updating privacy:", error);
      alert("Error updating privacy. Please try again.");
    }
  };
  
  const handleDelete = async () => {
    if (!session) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        window.location.href = "/wishlist";
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete wishlist");
      }
    } catch (error) {
      console.error("Error deleting wishlist:", error);
      alert("Error deleting wishlist");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div>
      {/* Wishlist Header with Icon */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => setShowIconPicker(true)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          title="Click to change icon"
        >
          <WishlistIcon icon={wishlist?.icon || null} color={wishlist?.color || null} size={40} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{wishlist?.name}</h2>
          {wishlist?.description && (
            <p className="text-base-content/70 text-sm mt-1">{wishlist.description}</p>
          )}
        </div>
      </div>

      {/* Icon/Color Picker Modal */}
      {showIconPicker && wishlist && (
        <IconColorPicker
          selectedIcon={wishlist.icon}
          selectedColor={wishlist.color}
          showTrigger={false}
          onIconChange={(icon) => {
            handleIconColorUpdate(icon, wishlist.color);
          }}
          onColorChange={(color) => {
            handleIconColorUpdate(wishlist.icon, color);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {/* Share Link Section - Hidden for personal wishlists */}
      {shareUrl && wishlist?.privacy !== "personal" && (
        <div className="mb-6 p-6 rounded-2xl bg-base-200 border border-base-300">
          <div className="space-y-5">
            {/* Share Link */}
            <div>
              <label className="block text-sm font-semibold text-base-content mb-2">
                Share Link
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="w-full px-4 py-3 pr-24 rounded-xl bg-base-100 border border-base-300 text-base-content text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-content text-sm font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              {wishlist?.privacy === "private" && (
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                  <span>🔒</span>
                  <span>This list is private. The share link works, but viewers must be signed in to access it.</span>
                </div>
              )}
              {wishlist?.privacy === "public" && (
                <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                  <span>✓</span>
                  <span>This list is public. Anyone with this link can view it.</span>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-base-300">
              <div className="flex gap-3">
                <button
                  onClick={handleRename}
                  className="px-4 py-2 rounded-xl bg-base-300 hover:opacity-90 text-base-content font-medium transition-all border border-base-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  ✏️ Rename
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  🗑️ Delete List
                </button>
              </div>
              
              {/* Privacy Setting */}
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer group relative">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={wishlist?.privacy === "public"}
                    onChange={(e) => handlePrivacyChange(e.target.value)}
                    className="w-4 h-4 text-primary bg-base-100 border-base-300 focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-base-content">Public</span>
                  <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-base-200 border border-base-300 rounded-lg text-xs text-base-content opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-xl">
                    Open to everyone - anyone can view
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group relative">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={wishlist?.privacy === "private"}
                    onChange={(e) => handlePrivacyChange(e.target.value)}
                    className="w-4 h-4 text-primary bg-base-100 border-base-300 focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-base-content">Private</span>
                  <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-base-200 border border-base-300 rounded-lg text-xs text-base-content opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-xl">
                    Only logged-in users with share link can view
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group relative">
                  <input
                    type="radio"
                    name="privacy"
                    value="personal"
                    checked={wishlist?.privacy === "personal"}
                    onChange={(e) => handlePrivacyChange(e.target.value)}
                    className="w-4 h-4 text-primary bg-base-100 border-base-300 focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-base-content">Personal</span>
                  <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-base-200 border border-base-300 rounded-lg text-xs text-base-content opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-xl">
                    Only you (the creator) can view this list
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 border border-base-300">
            <h3 className="text-xl font-bold mb-4 text-base-content">Delete Wishlist</h3>
            <p className="text-base-content/70 mb-6">
              Are you sure you want to delete this wishlist? This action cannot be undone. 
              All items in this wishlist will be permanently deleted.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-base-200 hover:bg-base-300 text-base-content transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <WishlistForm wishlistId={wishlistId} onItemAdded={() => setRefreshKey(k => k + 1)} />
      <div className="mt-8">
        <WishlistList key={refreshKey} wishlistId={wishlistId} isOwner={true} />
      </div>
      
      <WishlistInstructions />
    </div>
  );
}

