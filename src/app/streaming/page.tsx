import PageShell from "@/components/PageShell";

export default function StreamingPage() {
  return (
    <PageShell title="Streaming Tools">
      <div className="prose max-w-none text-base-content">
        <div className="space-y-12">
          {/* Twitch Chat Overlay */}
          <div>
            <h2 className="text-3xl font-bold text-base-content mb-2">Twitch Chat Overlay</h2>
            <p className="text-base-content/70 text-sm uppercase tracking-wider mb-4">Coming Soon</p>
            <p className="text-lg leading-relaxed text-base-content">
              A lightweight, customizable chat overlay built for clean streams and easy setup. Designed to run smoothly in OBS with simple styling, minimal resource use, and full support for Twitch emotes. It gives streamers a clear, readable chat window without all the extra noise.
            </p>
          </div>

          {/* Modular Tubers */}
          <div>
            <h2 className="text-3xl font-bold text-base-content mb-2">Modular Tubers</h2>
            <p className="text-base-content/70 text-sm uppercase tracking-wider mb-4">Coming Soon</p>
            <p className="text-lg leading-relaxed text-base-content">
              A web-based reactive PNGTuber system built with Next.js and React. It supports layered PNGs, sprite sheets, Discord and Twitch triggers, and flexible JSON configuration so creators can build and control their own avatars. Designed to run reliably as a browser source in OBS with fast response times and simple customization.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

