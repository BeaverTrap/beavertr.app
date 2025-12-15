"use client";

import Navbar from "@/components/Navbar";

export default function DMPage() {
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-shadowdarkHeader mb-8">DM Dashboard</h1>
        
        <div className="bg-base-100 p-6 rounded-lg shadow-lg">
          <p className="font-shadowdarkEntry mb-4">
            Dungeon Master Dashboard - Migration in progress
          </p>
          <p className="font-shadowdarkEntry text-sm text-base-content/70">
            This will include tools for managing campaigns, viewing player characters,
            and accessing DM resources.
          </p>
        </div>
      </div>
    </div>
  );
}

