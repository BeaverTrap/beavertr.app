import PageShell from "@/components/PageShell";

export default function AboutPage() {
  return (
    <PageShell title="About">
      <div className="prose prose-invert max-w-none text-base-content">
        <p className="text-lg leading-relaxed mb-8">
          BeaverTrap is the creative identity of illustrator, streamer, and designer <strong className="text-white">Jon Wayne</strong>, also known as <strong className="text-white">JonnyCoolJeans</strong>. His work centers on character-focused illustration, clean visuals, and mixing his art with the things he's into — gaming, Shadowdark OSR, classic D&D, tech, camping, and time outdoors with his dog, <strong className="text-white">Audrey</strong>.
        </p>
        
        <p className="text-lg leading-relaxed mb-8">
          Jon builds his own stream setups, designs and develops websites, and creates production assets for other creators, including graphics, avatars, overlays, and full visual packages. He also works heavily in the tabletop space, developing <strong className="text-white">Shadowdark OSR</strong> content, tools, and visuals, blending that old-school RPG influence into his artwork and design approach.
        </p>
        
        <p className="text-lg leading-relaxed mb-8">
          With a background in professional production and creative project management, Jon brings a steady, practical approach to collaborations like <a href="https://corywoodall.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">CoryWoodall.com</a> and other ongoing work, ensuring projects are well-organized and executed with attention to detail.
        </p>
        
        <p className="text-lg leading-relaxed text-base-content/70 italic border-l-4 border-base-300 pl-6">
          beavertr.app is the site that organizes all of this — the art, the streaming, the web design, the Shadowdark OSR work, and the projects built around the BeaverTrap identity.
        </p>
      </div>
    </PageShell>
  );
}

