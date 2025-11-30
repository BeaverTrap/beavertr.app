"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import WishlistList from "@/components/WishlistList";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  username?: string;
  bio?: string;
}

interface Wishlist {
  id: string;
  name: string;
  description?: string;
  privacy: string;
}

export default function UserWishlistPage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [activeWishlistId, setActiveWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    try {
      // Use the username directly - Next.js handles encoding in the URL
      // But we need to encode it for the fetch API call
      const apiUsername = encodeURIComponent(username);
      
      console.log("Fetching user data for:", { username, apiUsername, url: `/api/users/${apiUsername}` });
      
      const response = await fetch(`/api/users/${apiUsername}`);
      console.log("Response status:", response.status, response.statusText);
      
      if (response.ok) {
        const userData = await response.json();
        console.log("User data received:", userData);
        setUser(userData);
        
        // Fetch user's wishlists
        const wishlistsResponse = await fetch(`/api/users/${apiUsername}/wishlists`);
        if (wishlistsResponse.ok) {
          const wishlistsData = await wishlistsResponse.json();
          setWishlists(wishlistsData);
          if (wishlistsData.length > 0) {
            setActiveWishlistId(wishlistsData[0].id);
          }
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error("Error fetching user:", errorData);
        console.error("Response status:", response.status);
        console.error("Request URL:", `/api/users/${apiUsername}`);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
        <nav className="border-b border-zinc-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link
                href="/"
                className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent"
              >
                beavertr.app
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-zinc-400">User not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
      <nav className="border-b border-zinc-800/50 backdrop-blur-sm bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent"
            >
              beavertr.app
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/wishlist"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                My Wishlists
              </Link>
              <Link
                href="/wishlist/browse"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Browse
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <div className="mb-8 flex items-center gap-6">
          {user.image && (
            <img
              src={user.image}
              alt={user.name || ""}
              className="w-20 h-20 rounded-full"
            />
          )}
          <div>
            <h1 className="text-4xl font-bold">{user.name || user.email}</h1>
            {user.username && (
              <p className="text-zinc-400">@{user.username}</p>
            )}
            {user.bio && (
              <p className="text-zinc-300 mt-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Wishlist Selector */}
        {wishlists.length > 1 && (
          <div className="mb-8 flex items-center gap-4 flex-wrap">
            {wishlists.map((wishlist) => (
              <button
                key={wishlist.id}
                onClick={() => setActiveWishlistId(wishlist.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeWishlistId === wishlist.id
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {wishlist.name}
              </button>
            ))}
          </div>
        )}

        {/* Wishlist Items */}
        {activeWishlistId ? (
          <WishlistList wishlistId={activeWishlistId} isOwner={session?.user?.id === user.id} />
        ) : (
          <div className="text-center py-16 text-zinc-400">
            <p>No wishlists available</p>
          </div>
        )}
      </main>
    </div>
  );
}

