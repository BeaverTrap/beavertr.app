"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Navbar from "@/components/Navbar";
import WishlistDashboard from "@/components/WishlistDashboard";

export default function WishlistPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold text-base-content">
                  Share Your Wishlist
                </h1>
                <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                  Create wishlists, share with friends and family, and let them know what you want. 
                  Perfect for birthdays, holidays, or just keeping track of things you love.
                </p>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => signIn()}
                  className="px-8 py-4 rounded-xl bg-base-content text-base-100 font-semibold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Sign in to Get Started
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-12 text-left">
                <div className="p-6 rounded-xl bg-base-200 border border-base-300">
                  <h3 className="text-xl font-semibold mb-2 text-base-content">Create Lists</h3>
                  <p className="text-base-content/70">Organize items into multiple wishlists for different occasions or categories.</p>
                </div>
                <div className="p-6 rounded-xl bg-base-200 border border-base-300">
                  <h3 className="text-xl font-semibold mb-2 text-base-content">Share with Friends</h3>
                  <p className="text-base-content/70">Connect with friends, family, streamers, and fans to share wishlists.</p>
                </div>
                <div className="p-6 rounded-xl bg-base-200 border border-base-300">
                  <h3 className="text-xl font-semibold mb-2 text-base-content">Claim & Purchase</h3>
                  <p className="text-base-content/70">Let others know what you're buying to avoid duplicates.</p>
                </div>
              </div>
            </div>
        </main>
      </div>
    );
  }

  return <WishlistDashboard />;
}
