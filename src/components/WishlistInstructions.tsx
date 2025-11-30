"use client";

import { useState } from "react";

export default function WishlistInstructions() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        title="View instructions"
      >
        <span>?</span>
        <span className="hidden sm:inline">Help</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-700">
        <div className="sticky top-0 bg-zinc-800 border-b border-zinc-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Wishlist Instructions</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* For Wishlist Owners */}
          <section>
            <h3 className="text-xl font-semibold mb-3 text-blue-400">For Wishlist Owners</h3>
            <div className="space-y-4 text-zinc-300">
              <div>
                <h4 className="font-semibold text-white mb-1">Creating Wishlists</h4>
                <p className="text-sm">Click "Create New List" to add a new wishlist. You can have multiple wishlists for different occasions (birthdays, holidays, etc.).</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-1">Adding Items</h4>
                <p className="text-sm">Paste any product URL in the "Add Item" field. The system will automatically scrape product information (title, price, image, description). You can also add notes, size, and quantity using the "Edit Details" button.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Amazon Affiliate Links</h4>
                <p className="text-sm">For Amazon products, you can add your affiliate tag in Settings. Then use "Edit Affiliate" on any Amazon item to automatically convert the link. You'll earn commissions when items are purchased through your affiliate links.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Privacy Settings</h4>
                <p className="text-sm">Set your wishlist to Public (anyone can view), Private (only you), or Friends Only (only your friends can view). Use the privacy selector at the bottom right of your wishlist controls.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Sharing Your Wishlist</h4>
                <p className="text-sm">Each wishlist has a unique share link (e.g., beavertr.app/RedGoatPie). Copy and share this link with anyone you want to view your wishlist.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Confirming Claims</h4>
                <p className="text-sm">When someone claims an item, you'll see a yellow notification. Click "Confirm Purchase" if they actually bought it, or "Reject Claim" if they didn't. This prevents false claims.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Managing Items</h4>
                <p className="text-sm">Use "Refresh" to update product prices (especially useful for Amazon items with sales). Use "Unmark Purchased" if an item was incorrectly marked as purchased.</p>
              </div>
            </div>
          </section>

          {/* For Buyers */}
          <section>
            <h3 className="text-xl font-semibold mb-3 text-green-400">For Buyers</h3>
            <div className="space-y-4 text-zinc-300">
              <div>
                <h4 className="font-semibold text-white mb-1">Viewing Wishlists</h4>
                <p className="text-sm">You can browse public wishlists or view wishlists shared with you via a share link. Use the "Browse" page to discover public wishlists.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Claiming Items</h4>
                <p className="text-sm">Click "Claim" on an item you plan to purchase. This lets others know you're buying it to avoid duplicates. The owner will need to confirm your claim.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Purchasing Items</h4>
                <p className="text-sm">Click "Purchase" or "Purchase →" to open the product page. If the item has an affiliate link, purchasing through it supports the wishlist creator.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Unclaiming</h4>
                <p className="text-sm">If you change your mind, click "Unclaim" to remove your claim. The item will be available for others to claim.</p>
              </div>
            </div>
          </section>

          {/* Tips & Best Practices */}
          <section>
            <h3 className="text-xl font-semibold mb-3 text-amber-400">Tips & Best Practices</h3>
            <div className="space-y-4 text-zinc-300">
              <div>
                <h4 className="font-semibold text-white mb-1">For Owners</h4>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>Add detailed notes (size, color, quantity) to help buyers</li>
                  <li>Keep prices updated by refreshing items regularly</li>
                  <li>Set up your Amazon affiliate tag in Settings for automatic affiliate links</li>
                  <li>Confirm claims promptly to keep your wishlist accurate</li>
                  <li>Use multiple wishlists to organize items by occasion or category</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">For Buyers</h4>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>Claim items before purchasing to avoid duplicates</li>
                  <li>Only claim items you're actually planning to buy</li>
                  <li>Use affiliate links when available to support the wishlist creator</li>
                  <li>Check item details (size, quantity, notes) before purchasing</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Privacy & Sharing */}
          <section>
            <h3 className="text-xl font-semibold mb-3 text-purple-400">Privacy & Sharing</h3>
            <div className="space-y-4 text-zinc-300">
              <div>
                <h4 className="font-semibold text-white mb-1">Privacy Levels</h4>
                <ul className="text-sm space-y-1">
                  <li><strong className="text-white">Public:</strong> Anyone can find and view your wishlist</li>
                  <li><strong className="text-white">Private:</strong> Only you can view (share link still works if you share it directly)</li>
                  <li><strong className="text-white">Friends Only:</strong> Only your accepted friends can view</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Share Links</h4>
                <p className="text-sm">Each wishlist has a unique 3-word share link. Share this link directly with anyone, regardless of privacy settings. The link works even for private wishlists if you share it.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-zinc-800 border-t border-zinc-700 p-6">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

