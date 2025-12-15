"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaBook, FaUsers, FaMap, FaShoppingCart } from "react-icons/fa";
import Navbar from "@/components/Navbar";

export default function ShadowdarkPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [isDM, setIsDM] = useState(false);

  useEffect(() => {
    // For now, we'll skip DM check - can be added later if needed
    // In the old site, this checked user_profiles.is_dm from Supabase
    setLoading(false);
  }, [session, status]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-shadowdarkHeader mb-2">ShadowDark RPG</h1>
          <p className="text-3xl font-shadowdarkCategory text-base-content/70 mb-4">...</p>
          <a
            href="https://www.thearcanelibrary.com/pages/shadowdark"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary font-shadowdarkEntry"
          >
            <FaShoppingCart className="mr-2" /> Buy Shadowdark
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card bg-base-100 hover:bg-base-200 transition-colors duration-300 shadow-lg">
            <div className="card-body">
              <h2 className="card-title font-shadowdarkCategory">
                <FaBook className="mr-2" /> Character Builder
              </h2>
              <p className="font-shadowdarkEntry">Create and manage your Shadowdark characters</p>
              <div className="card-actions justify-end">
                <button
                  onClick={() => router.push("/shadowdark/characterbuilder")}
                  className="btn btn-primary font-shadowdarkEntry"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 hover:bg-base-200 transition-colors duration-300 shadow-lg">
            <div className="card-body">
              <h2 className="card-title font-shadowdarkCategory">
                <FaUsers className="mr-2" /> Campaigns
              </h2>
              <p className="font-shadowdarkEntry">Join or create a campaign</p>
              <div className="card-actions justify-end">
                <button
                  onClick={() => router.push("/shadowdark/campaigns")}
                  className="btn btn-primary font-shadowdarkEntry"
                >
                  View Campaigns
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 hover:bg-base-200 transition-colors duration-300 shadow-lg">
            <div className="card-body">
              <h2 className="card-title font-shadowdarkCategory">
                <FaMap className="mr-2" /> DM Dashboard
              </h2>
              <p className="font-shadowdarkEntry">Manage campaigns and access DM resources</p>
              <div className="card-actions justify-end">
                <button
                  onClick={() => {
                    console.log("Navigating to DM Dashboard");
                    router.push("/shadowdark/dm");
                  }}
                  className="btn btn-primary font-shadowdarkEntry"
                >
                  Open Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
