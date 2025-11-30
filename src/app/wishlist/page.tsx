"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import WishlistDashboard from "@/components/WishlistDashboard";

export default function WishlistPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Share Your Wishlist
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                Create wishlists, share with friends and family, and let them know what you want. 
                Perfect for birthdays, holidays, or just keeping track of things you love.
              </p>
            </div>

            <div className="pt-8">
              <button
                onClick={() => signIn()}
                className="px-8 py-4 rounded-xl bg-white text-black font-semibold text-lg hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Sign in to Get Started
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 pt-12 text-left">
              <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <h3 className="text-xl font-semibold mb-2">Create Lists</h3>
                <p className="text-zinc-400">Organize items into multiple wishlists for different occasions or categories.</p>
              </div>
              <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <h3 className="text-xl font-semibold mb-2">Share with Friends</h3>
                <p className="text-zinc-400">Connect with friends, family, streamers, and fans to share wishlists.</p>
              </div>
              <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <h3 className="text-xl font-semibold mb-2">Claim & Purchase</h3>
                <p className="text-zinc-400">Let others know what you're buying to avoid duplicates.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <WishlistDashboard />;
}
