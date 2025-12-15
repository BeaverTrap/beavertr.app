"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Level0Page() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="min-h-screen p-6 bg-base-200 text-base-content">
      <h1 className="text-5xl font-shadowdarkHeader mb-4">ShadowDark RPG</h1>
      <h2 className="text-3xl font-shadowdarkCategory mb-1">Character Builder - Level 0</h2>
      
      <div className="mt-8 p-6 bg-base-100 rounded-lg shadow-lg">
        <p className="text-lg font-shadowdarkEntry mb-4">
          The full Character Builder is being migrated. This will include:
        </p>
        <ul className="list-disc list-inside space-y-2 font-shadowdarkEntry">
          <li>Quick Build Wizard</li>
          <li>Character Pool Management</li>
          <li>Level 0 Character Creation</li>
          <li>Dice Roller</li>
          <li>Roll Console</li>
          <li>Character Stats & Equipment</li>
        </ul>
        <div className="mt-6">
          <button
            className="btn btn-primary font-shadowdarkEntry"
            onClick={() => setShowWizard(!showWizard)}
          >
            {showWizard ? "Hide" : "Show"} Quick Build (Coming Soon)
          </button>
        </div>
        {showWizard && (
          <div className="mt-4 p-4 bg-base-200 rounded">
            <p className="font-shadowdarkEntry">Quick Build Wizard - Migration in progress</p>
          </div>
        )}
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

