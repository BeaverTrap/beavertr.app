"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CustomItemForm from "./CustomItemForm";

interface WishlistFormProps {
  wishlistId: string;
  onItemAdded?: () => void;
}

export default function WishlistForm({ wishlistId, onItemAdded }: WishlistFormProps) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [userAffiliateTag, setUserAffiliateTag] = useState<string | null>(null);
  const [size, setSize] = useState<string>("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const { data: session } = useSession();

  // Fetch user's affiliate tag on mount
  useEffect(() => {
    if (session) {
      fetch("/api/user/settings")
        .then(res => res.json())
        .then(data => {
          if (data.amazonAffiliateTag) {
            setUserAffiliateTag(data.amazonAffiliateTag);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLink(text);
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      alert("Unable to access clipboard. Please paste manually.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      alert("Please sign in to add items");
      return;
    }

    if (!link.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      // Check if it's an Amazon link and user has affiliate tag
      const isAmazonLink = link.includes("amazon.com") || link.includes("amzn.to");
      let finalUrl = link;
      let affiliateUrl: string | null = null;
      
      if (isAmazonLink && userAffiliateTag) {
        // Ask user if they want to convert to affiliate link
        const convertToAffiliate = confirm(
          "This is an Amazon product. Would you like to convert it to an affiliate link using your tag?\n\n" +
          "Click OK to add as affiliate link, or Cancel to add as regular link."
        );
        
        if (convertToAffiliate) {
          try {
            // Convert to affiliate link
            const url = new URL(link);
            
            // Check if it's a product URL
            const isProductUrl = url.pathname.includes('/dp/') || 
                                url.pathname.includes('/gp/product/') ||
                                url.pathname.includes('/product/');
            
            if (!isProductUrl) {
              alert("Warning: This doesn't appear to be a product URL. Adding as regular link.");
            } else {
              // Remove existing affiliate parameters
              url.searchParams.delete("tag");
              url.searchParams.delete("linkCode");
              url.searchParams.delete("linkId");
              url.searchParams.delete("ref_");
              url.searchParams.delete("language");
              url.searchParams.delete("pd_rd_w");
              url.searchParams.delete("content-id");
              url.searchParams.delete("pf_rd_p");
              url.searchParams.delete("pf_rd_r");
              url.searchParams.delete("pd_rd_wg");
              url.searchParams.delete("pd_rd_r");
              
              // Add affiliate tag
              url.searchParams.set("tag", userAffiliateTag);
              affiliateUrl = url.toString();
            }
          } catch (error) {
            console.error("Error converting to affiliate link:", error);
            // Continue with regular link if conversion fails
          }
        }
      }
      
      // First, scrape the URL (use original URL for scraping)
      const scrapeResponse = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl }),
      });

      let scrapedData: any = {};
      if (scrapeResponse.ok) {
        scrapedData = await scrapeResponse.json();
        console.log("Scraped data received:", scrapedData);
        
        // Auto-fill size if scraped data has it
        if (scrapedData.size) {
          setSize(scrapedData.size);
        }
      } else {
        const errorData = await scrapeResponse.json().catch(() => ({}));
        console.error("Scrape failed:", errorData);
        alert(`Failed to scrape product data: ${errorData.error || "Unknown error"}`);
        setLoading(false);
        return;
      }
      
      // Check for duplicates before adding
      const checkDuplicateResponse = await fetch(`/api/wishlist/items?wishlistId=${wishlistId}`);
      if (checkDuplicateResponse.ok) {
        const existingItems = await checkDuplicateResponse.json();
        const normalizedUrl = finalUrl.split('?')[0].split('#')[0].toLowerCase().trim();
        const duplicate = existingItems.find((item: any) => {
          const existingUrl = (item.url || '').split('?')[0].split('#')[0].toLowerCase().trim();
          return existingUrl === normalizedUrl;
        });
        
        if (duplicate) {
          if (!confirm(`This item already exists in your wishlist:\n"${duplicate.title}"\n\nAdd it anyway?`)) {
            setLoading(false);
            return;
          }
        }
      }

      // Add to wishlist with scraped data and affiliate URL if applicable
      // Only include expected fields from scrapedData (exclude url, hasSizeOptions, etc.)
      const response = await fetch("/api/wishlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishlistId,
          url: finalUrl,
          affiliateUrl: affiliateUrl,
          title: scrapedData.title || undefined,
          image: scrapedData.image || undefined,
          price: scrapedData.price || undefined,
          description: scrapedData.description || undefined,
          // Use scraped size if available, otherwise use manual input
          size: scrapedData.size || (size.trim() || null),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Item added successfully:", data);
        setLink("");
        setSize("");
        if (onItemAdded) {
          onItemAdded();
        } else {
          window.location.reload();
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to add item:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || "Failed to add item" };
        }
        alert(error.error || `Failed to add item (${response.status})`);
      }
    } catch (error: any) {
      console.error("Error adding item:", error);
      alert(`Error adding item: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 backdrop-blur-sm">
        <p className="text-zinc-300 text-center">Sign in to add items to your wishlist</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {showCustomForm && (
        <CustomItemForm
          wishlistId={wishlistId}
          onItemAdded={onItemAdded}
          onClose={() => setShowCustomForm(false)}
        />
      )}
      
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setShowCustomForm(true)}
          className="px-4 py-2 rounded-xl bg-zinc-700/80 hover:bg-zinc-600/80 text-white transition-colors"
        >
          + Add Custom Item
        </button>
        <div className="flex-1 border-t border-zinc-700/50 my-auto"></div>
        <span className="text-sm text-zinc-400 my-auto">or</span>
        <div className="flex-1 border-t border-zinc-700/50 my-auto"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Add Product Link
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste product URL here..."
                className="w-full px-4 py-3 pr-32 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-700/80 hover:bg-zinc-600/80 text-zinc-200 border border-zinc-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Paste from clipboard"
              >
                📋 Paste
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !link.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Adding...
                </span>
              ) : (
                "Add Item"
              )}
            </button>
          </div>
        </div>

        {/* Size Field - Only show if size was auto-detected or user wants to add */}
        {size && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Size (auto-detected)
            </label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g., Large, XL, 10, 42"
              className="w-full px-4 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              disabled={loading}
            />
          </div>
        )}
      </form>
    </div>
  );
}
