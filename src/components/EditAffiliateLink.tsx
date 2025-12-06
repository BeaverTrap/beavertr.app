"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface EditAffiliateLinkProps {
  item: {
    id: string;
    url: string;
    affiliateUrl?: string | null;
    title: string;
  };
  onUpdate: () => void;
}

export default function EditAffiliateLink({ item, onUpdate }: EditAffiliateLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [affiliateUrl, setAffiliateUrl] = useState(item.affiliateUrl || "");
  const [loading, setLoading] = useState(false);
  const [userAffiliateTag, setUserAffiliateTag] = useState<string | null>(null);
  const { data: session } = useSession();

  const isAmazonLink = item.url.includes("amazon.com") || item.url.includes("amzn.to");
  
  // Only show for Amazon links
  if (!isAmazonLink) {
    return null;
  }

  useEffect(() => {
    // Fetch user's default affiliate tag
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

  const validateAffiliateUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (removes affiliate link)
    
    try {
      const urlObj = new URL(url);
      
      // For Amazon links, check if it's a product page or valid affiliate link
      if (urlObj.hostname.includes('amazon.com') || urlObj.hostname.includes('amzn.to')) {
        // Allow short links (amzn.to) - they're valid affiliate links
        if (urlObj.hostname.includes('amzn.to')) {
          return true;
        }
        
        // Check if it's a browse/category page (these are bad unless it's an affiliate link with tag)
        if (urlObj.pathname === '/b' || urlObj.pathname.startsWith('/b?')) {
          // Allow if it has an affiliate tag
          return urlObj.searchParams.has('tag');
        }
        
        // Check if it has a product identifier OR is already an affiliate link
        const hasProductId = urlObj.pathname.includes('/dp/') || 
                            urlObj.pathname.includes('/gp/product/') ||
                            urlObj.pathname.includes('/product/') ||
                            urlObj.searchParams.has('asin');
        
        const hasAffiliateTag = urlObj.searchParams.has('tag');
        
        return hasProductId || hasAffiliateTag;
      }
      
      return true; // Non-Amazon URLs are assumed valid
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmedUrl = affiliateUrl.trim();
    
    // Validate the affiliate URL
    if (trimmedUrl && !validateAffiliateUrl(trimmedUrl)) {
      alert("Invalid affiliate URL. Please use a direct product link, not a category or browse page.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/wishlist/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          affiliateUrl: trimmedUrl || null,
        }),
      });

      if (response.ok) {
        setIsOpen(false);
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update affiliate link");
      }
    } catch (error) {
      console.error("Error updating affiliate link:", error);
      alert("Error updating affiliate link");
    } finally {
      setLoading(false);
    }
  };

  const convertToAffiliate = async () => {
    // Helper to convert Amazon URL to affiliate format
    if (isAmazonLink) {
      try {
        let urlToUse = item.url;
        
        // Handle amzn.to short links - expand them via our API
        if (item.url.includes('amzn.to/')) {
          try {
            // Try to expand the short link
            const expandResponse = await fetch(`/api/scrape?url=${encodeURIComponent(item.url)}`);
            if (expandResponse.ok) {
              const data = await expandResponse.json();
              if (data.url && data.url !== item.url) {
                urlToUse = data.url;
              }
            }
          } catch (e) {
            console.warn('Could not expand short link:', e);
          }
        }
        
        let url: URL;
        try {
          url = new URL(urlToUse);
        } catch {
          // If URL parsing fails, try to extract from affiliate URL if provided
          if (affiliateUrl && (affiliateUrl.includes('amazon.com') || affiliateUrl.includes('amzn.to'))) {
            url = new URL(affiliateUrl);
          } else {
            alert("Please paste a valid Amazon URL (amazon.com/... or amzn.to/...).");
            return;
          }
        }
        
        // Preserve the product path - don't let it become a browse/category page
        // Amazon product URLs typically have /dp/ or /gp/product/ in them
        const isProductUrl = url.pathname.includes('/dp/') || 
                            url.pathname.includes('/gp/product/') ||
                            url.pathname.includes('/product/');
        
        if (!isProductUrl && !url.pathname.includes('/b')) {
          // Allow if it's already an affiliate link with proper parameters
          const hasTag = url.searchParams.has('tag');
          if (!hasTag) {
            alert("Warning: This doesn't appear to be a product URL. Please use a direct product link (e.g., amazon.com/dp/B00...).");
            return;
          }
        }
        
        // Remove existing affiliate parameters to avoid conflicts
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
        
        // Use user's default affiliate tag if available, otherwise prompt
        const tag = userAffiliateTag || prompt("Enter your Amazon affiliate tag (e.g., beavertrap-20):");
        if (tag) {
          // Add the affiliate tag - this is the key parameter for Amazon Associates
          url.searchParams.set("tag", tag);
          setAffiliateUrl(url.toString());
        }
      } catch (error) {
        console.error("Error converting to affiliate link:", error);
        alert("Error: Invalid URL format. Please use a valid Amazon URL.");
      }
    } else {
      // For non-Amazon links, just let them paste the affiliate URL
      setAffiliateUrl("");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-400"
        title="Edit affiliate link"
      >
        {item.affiliateUrl ? "✏️ Edit Affiliate" : "🔗 Add Affiliate"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full border border-zinc-700">
        <h3 className="text-lg font-semibold mb-4">Edit Affiliate Link</h3>
        <p className="text-sm text-zinc-400 mb-4">
          {isAmazonLink
            ? "Add your Amazon affiliate tag to earn commissions when someone purchases this item."
            : "Add an affiliate link for this product."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Original URL:</label>
            <input
              type="text"
              value={item.url}
              disabled
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 text-sm"
            />
          </div>

          {isAmazonLink && (
            <button
              type="button"
              onClick={convertToAffiliate}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Auto-convert to affiliate link →
            </button>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Affiliate URL:</label>
            <input
              type="url"
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder={isAmazonLink ? "https://amazon.com/...?tag=your-tag" : "Paste affiliate URL"}
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Paste any Amazon link (amzn.to short links work too). Leave empty to remove.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setAffiliateUrl(item.affiliateUrl || "");
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

