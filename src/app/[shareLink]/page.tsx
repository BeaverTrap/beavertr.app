import { getWishlistByShareLink } from "@/lib/wishlists";
import { getWishlistItems } from "@/lib/wishlists";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import WishlistList from "@/components/WishlistList";
import ShareLinkPageClient from "@/components/ShareLinkPageClient";
import WishlistIcon from "@/components/WishlistIcon";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function ShareLinkPage({
  params,
}: {
  params: Promise<{ shareLink: string }>;
}) {
  const session = await auth();
  const { shareLink } = await params;
  const wishlist = await getWishlistByShareLink(shareLink);
  
  if (!wishlist) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-base-content">Wishlist Not Found</h1>
          <p className="text-base-content/70 mb-6">This wishlist doesn't exist or has been deleted.</p>
          <Link
            href="/wishlist"
            className="px-4 py-2 rounded-lg bg-base-content text-base-100 hover:opacity-90 transition-colors"
          >
            Go to My Wishlists
          </Link>
        </div>
      </div>
    );
  }
  
  // Check privacy rules
  const isOwner = session?.user?.id === wishlist.userId;
  
  // Personal: only creator can see, even with share link
  if (wishlist.privacy === "personal" && !isOwner) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-base-content">Personal Wishlist</h1>
          <p className="text-base-content/70 mb-6">
            This wishlist is personal and can only be viewed by its creator. 
            Share links do not grant access to personal wishlists.
          </p>
          {session ? (
            <Link
              href="/wishlist"
              className="px-4 py-2 rounded-lg bg-base-content text-base-100 hover:opacity-90 transition-colors"
            >
              Go to My Wishlists
            </Link>
          ) : (
            <Link
              href="/api/auth/signin"
              className="px-4 py-2 rounded-lg bg-primary text-primary-content hover:opacity-90 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  // Private: only logged-in users can access via share link
  if (wishlist.privacy === "private" && !isOwner && !session) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-base-content">Private Wishlist</h1>
          <p className="text-base-content/70 mb-6">
            This wishlist is private. You must be signed in to view it, even with a share link.
          </p>
          <Link
            href="/api/auth/signin"
            className="px-4 py-2 rounded-lg bg-primary text-primary-content hover:opacity-90 transition-colors"
          >
            Sign In to View
          </Link>
        </div>
      </div>
    );
  }
  
  // Public: anyone can access via share link (no restrictions)
  
  const items = await getWishlistItems(wishlist.id);
  
  // Fetch creator info and shipping address
  const [creator] = await db
    .select({ 
      username: users.username, 
      name: users.name,
      shippingAddress: users.shippingAddress 
    })
    .from(users)
    .where(eq(users.id, wishlist.userId))
    .limit(1);
  
  const shippingAddress = wishlist.privacy === "public" ? creator?.shippingAddress || null : null;
  
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <WishlistIcon icon={wishlist.icon} color={wishlist.color} size={32} />
            <h1 className="text-3xl font-bold text-base-content">{wishlist.name}</h1>
            {wishlist.privacy === "public" && (
              <span className="px-2 py-1 text-xs rounded bg-green-600/20 text-green-400 border border-green-600/30">
                Public
              </span>
            )}
          </div>
          {wishlist.description && (
            <p className="text-base-content/70">{wishlist.description}</p>
          )}
          {creator && (
            <p className="text-sm text-base-content/50 mt-2">
              Wishlist created by {creator.username ? `@${creator.username}` : creator.name || "Unknown"}
            </p>
          )}
          {wishlist.privacy === "public" && shippingAddress && (
            <div className="mt-4 p-4 rounded-lg bg-base-200 border border-base-300">
              <h3 className="text-sm font-semibold text-base-content mb-2">📦 Shipping Address</h3>
              <p className="text-sm text-base-content/70 whitespace-pre-line">{shippingAddress}</p>
            </div>
          )}
        </div>
        
        <WishlistList wishlistId={wishlist.id} isOwner={isOwner} />
        <ShareLinkPageClient />
      </main>
    </div>
  );
}

