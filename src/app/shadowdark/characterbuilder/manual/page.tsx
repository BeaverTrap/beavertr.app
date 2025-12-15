"use client";

import { useRouter } from "next/navigation";

export default function ManualPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-6 bg-base-200 text-base-content">
      <h1 className="text-5xl font-shadowdarkHeader mb-4">ShadowDark RPG</h1>
      <h2 className="text-3xl font-shadowdarkCategory mb-1">Character Manual</h2>
      
      <div className="mt-8 p-6 bg-base-100 rounded-lg shadow-lg">
        <p className="text-lg font-shadowdarkEntry mb-4">
          Shadowdark Character Manual - Migration in progress
        </p>
        <p className="font-shadowdarkEntry">
          This page will contain the complete Shadowdark character creation rules,
          tables, and reference materials.
        </p>
      </div>

      <div className="mt-6">
        <button
          className="btn btn-secondary font-shadowdarkEntry"
          onClick={() => router.push("/shadowdark")}
        >
          Back to Shadowdark
        </button>
      </div>
    </div>
  );
}

