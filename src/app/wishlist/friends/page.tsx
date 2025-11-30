"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";

interface Friend {
  friendship: {
    id: string;
    relationshipType: string;
    status: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    username?: string;
  };
}

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [session]);

  const fetchFriends = async () => {
    try {
      const response = await fetch("/api/friends");
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch("/api/friends/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const response = await fetch(`/api/friends/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      if (response.ok) {
        fetchFriends();
        fetchPendingRequests();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
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
          <p className="text-zinc-400">Please sign in to view friends</p>
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
        <h1 className="text-4xl font-bold mb-8">Friends</h1>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Pending Requests</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.friendship.id}
                  className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700/50"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {request.user.image && (
                      <img
                        src={request.user.image}
                        alt={request.user.name || ""}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{request.user.name || request.user.email}</h3>
                      <p className="text-sm text-zinc-400 capitalize">
                        {request.friendship.relationshipType}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(request.friendship.id)}
                    className="w-full px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-zinc-100 transition-colors"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Friends</h2>
          {friends.length === 0 ? (
            <p className="text-zinc-400">No friends yet. Start connecting!</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <Link
                  key={friend.friendship.id}
                  href={`/wishlist/user/${friend.user.username || friend.user.id}`}
                  className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {friend.user.image && (
                      <img
                        src={friend.user.image}
                        alt={friend.user.name || ""}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{friend.user.name || friend.user.email}</h3>
                      <p className="text-sm text-zinc-400 capitalize">
                        {friend.friendship.relationshipType}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

