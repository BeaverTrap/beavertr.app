"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthButton from "@/components/AuthButton";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  username?: string;
}

export default function BrowsePage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/browse");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <Navbar />
        <div className="text-base-content/70">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-base-100">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-base-content/70">Please sign in to browse wishlists</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8 text-base-content">Browse Wishlists</h1>

        {users.length === 0 ? (
          <p className="text-base-content/70">No public wishlists available</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/wishlist/user/${user.username || user.id}`}
                className="p-6 rounded-xl bg-base-200 border border-base-300 hover:bg-base-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name || ""}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-base-content">{user.name || user.email}</h3>
                    {user.username && (
                      <p className="text-sm text-base-content/70">@{user.username}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

