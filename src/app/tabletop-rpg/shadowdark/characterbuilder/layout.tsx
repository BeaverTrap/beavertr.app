"use client";

import { type ReactNode } from "react";
import Navbar from "@/components/Navbar";

export default function CharacterBuilderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <Navbar />
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

