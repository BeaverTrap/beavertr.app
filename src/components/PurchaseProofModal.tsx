"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface PurchaseProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  onSuccess: () => void;
}

export default function PurchaseProofModal({
  isOpen,
  onClose,
  itemId,
  itemTitle,
  onSuccess,
}: PurchaseProofModalProps) {
  const { data: session } = useSession();
  const [purchaseDate, setPurchaseDate] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setUploading(true);
    try {
      let receiptUrl: string | null = null;

      // Upload receipt if provided
      if (receiptFile) {
        const formData = new FormData();
        formData.append("file", receiptFile);
        formData.append("itemId", itemId);

        const uploadResponse = await fetch("/api/wishlist/upload-proof", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          receiptUrl = data.imageUrl;
        } else {
          const error = await uploadResponse.json();
          alert(error.error || "Failed to upload receipt");
          setUploading(false);
          return;
        }
      }

      // Submit purchase proof
      const response = await fetch("/api/wishlist/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          action: "markPurchased",
          purchaseDate: purchaseDate || null,
          trackingNumber: trackingNumber || null,
          purchaseNotes: purchaseNotes || null,
          purchaseAmount: purchaseAmount || null,
          purchaseProof: receiptUrl,
          isAnonymous: isAnonymous,
        }),
      });

      if (response.ok) {
        onSuccess();
        // Reset form
        setPurchaseDate("");
        setTrackingNumber("");
        setPurchaseNotes("");
        setPurchaseAmount("");
        setReceiptFile(null);
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit purchase proof");
      }
    } catch (error) {
      console.error("Error submitting purchase proof:", error);
      alert("Error submitting purchase proof");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-lg w-full mx-4 border border-zinc-700 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Mark as Purchased</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Provide proof of purchase for: <strong>{itemTitle}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Receipt/Proof (Optional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Upload a screenshot of your receipt or order confirmation
            </p>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Purchase Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>

          {/* Purchase Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount Paid (Optional)
            </label>
            <input
              type="text"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="e.g., $29.99"
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Actual price paid (may differ from listed price due to sales)
            </p>
          </div>

          {/* Tracking Number */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tracking Number (Optional)
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g., 1Z999AA10123456784"
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>

          {/* Purchase Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={purchaseNotes}
              onChange={(e) => setPurchaseNotes(e.target.value)}
              placeholder="Any additional information about the purchase..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? "Submitting..." : "Submit Purchase Proof"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

