import Link from "next/link";
import AuthButton from "@/components/AuthButton";

const sections = [
  { label: "About", route: "/about" },
  { label: "Portfolio", route: "/portfolio" },
  { label: "Web Design", route: "/web-design" },
  { label: "Wishlist", route: "/wishlist" },
  { label: "Streaming Tools", route: "/streaming" },
  { label: "Adventure 95", route: "/adventure95" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6">
        <h1 className="text-xl font-bold">beavertr.app</h1>
        <AuthButton />
      </header>
      
      {/* Static Navigation */}
      <main className="max-w-4xl mx-auto px-8 py-16">
        <nav className="flex flex-col gap-4">
          {sections.map((section) => (
            <Link
              key={section.route}
              href={section.route}
              className="text-4xl md:text-6xl font-bold text-white hover:text-white/70 transition-colors"
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
