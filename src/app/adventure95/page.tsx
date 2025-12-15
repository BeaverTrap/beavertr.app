import PageShell from "@/components/PageShell";
import Image from "next/image";

export default function Adventure95Page() {
  return (
    <PageShell title="Adventure 95">
      <div className="prose max-w-none text-base-content">
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/beholder.png"
            alt="Adventure95 game interface"
            width={500}
            height={500}
            className="w-auto h-auto"
          />
        </div>
        
        <div className="mb-6 text-center">
          <p className="text-base-content/70 text-sm uppercase tracking-wider">Coming Soon</p>
        </div>
        
        <p className="text-lg leading-relaxed text-base-content">
          <strong className="text-base-content font-bold">Adventure95</strong> is a custom retro-style RPG system and game engine built inside a Windows-95 inspired interface. It blends classic OSR principles with modern, streamlined design: procedural maps, tile-based exploration, turn-based battles, and a desktop-style UI where every window is part of the gameplay. The entire system is data-driven, using small JSON files for monsters, items, quests, and dungeons, making it highly moddable and easy to expand. It's built for fast play, simple mechanics, and that old-school computer vibe.
        </p>
      </div>
    </PageShell>
  );
}

