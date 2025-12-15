"use client";

import { useRouter } from "next/navigation";
import { FaDiceD20, FaBook } from "react-icons/fa";
import Navbar from "@/components/Navbar";

export default function TabletopRPGPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-2 text-base-content">Tabletop RPG</h1>
          <p className="text-2xl text-base-content/70 mb-4">Tools and resources for your RPG adventures</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="card bg-base-200 hover:bg-base-300 transition-colors duration-300 shadow-lg cursor-pointer"
               onClick={() => router.push("/tabletop-rpg/shadowdark")}>
            <div className="card-body">
              <h2 className="card-title font-shadowdarkCategory">
                <FaDiceD20 className="mr-2" /> Shadowdark
              </h2>
              <p className="font-shadowdarkEntry text-base-content/70">
                Character builder, campaign management, and DM tools for Shadowdark RPG
              </p>
              <div className="card-actions justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/tabletop-rpg/shadowdark");
                  }}
                  className="btn btn-primary font-shadowdarkEntry"
                >
                  Enter Shadowdark
                </button>
              </div>
            </div>
          </div>

          {/* Placeholder for future RPG systems */}
          <div className="card bg-base-200 opacity-50">
            <div className="card-body">
              <h2 className="card-title">
                <FaBook className="mr-2" /> More Systems
              </h2>
              <p className="text-base-content/50">Additional RPG systems coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

