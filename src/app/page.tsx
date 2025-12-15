import Link from "next/link";
import Navbar from "@/components/Navbar";

const sections = [
  { label: "About", route: "/about" },
  { label: "Portfolio", route: "/portfolio" },
  { label: "Web Design", route: "/web-design" },
  { label: "Wishlist", route: "/wishlist" },
  { label: "Streaming Tools", route: "/streaming" },
  { label: "Adventure 95", route: "/adventure95" },
  { label: "Tabletop RPG", route: "/tabletop-rpg" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      
      {/* Static Navigation */}
      <main className="max-w-3xl mx-auto px-8 py-16">
        <nav className="flex flex-col gap-4 max-w-2xl">
          {sections.map((section) => (
            <Link
              key={section.route}
              href={section.route}
              className="text-4xl md:text-6xl font-bold text-base-content hover:text-base-content/70 transition-all duration-300 hover:translate-x-2 hover:scale-105 group relative cassette-nav-link"
            >
              <span className="relative">
                {section.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-base-content/50 group-hover:w-full transition-all duration-300"></span>
              </span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
