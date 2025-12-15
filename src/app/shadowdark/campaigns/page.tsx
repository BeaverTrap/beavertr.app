"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function CampaignsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-shadowdarkHeader">Campaigns</h1>
          <button
            onClick={() => router.push("/shadowdark/campaigns/new")}
            className="btn btn-primary font-shadowdarkEntry"
          >
            Create New Campaign
          </button>
        </div>

        <div className="bg-base-100 p-6 rounded-lg shadow-lg">
          <p className="font-shadowdarkEntry mb-4">
            Campaign Management - Migration in progress
          </p>
          <p className="font-shadowdarkEntry text-sm text-base-content/70">
            This will include campaign creation, joining campaigns, and managing your campaigns.
          </p>
        </div>
      </div>
    </div>
  );
}

