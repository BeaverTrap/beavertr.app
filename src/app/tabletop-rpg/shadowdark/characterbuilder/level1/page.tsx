"use client";

import { useRouter } from "next/navigation";

export default function Level1Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-6 bg-base-200 text-base-content">
      <h1 className="text-5xl font-shadowdarkHeader mb-4">ShadowDark RPG</h1>
      <h2 className="text-3xl font-shadowdarkCategory mb-1">Character Builder - Level 1</h2>
      
      <div className="mt-8 p-6 bg-base-100 rounded-lg shadow-lg">
        <p className="text-lg font-shadowdarkEntry mb-4">
          Level 1 Character Builder - Migration in progress
        </p>
        <p className="font-shadowdarkEntry">
          This page will allow you to level up your Level 0 characters to Level 1,
          including class selection, ability score improvements, and new features.
        </p>
      </div>

      <div className="mt-6">
        <button
          className="btn btn-secondary font-shadowdarkEntry"
          onClick={() => router.push("/tabletop-rpg/shadowdark/characterbuilder/level0")}
        >
          Back to Level 0
        </button>
      </div>
    </div>
  );
}

