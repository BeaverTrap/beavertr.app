import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-10 border-b border-zinc-800/50 backdrop-blur-sm bg-zinc-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent"
          >
            beavertr.app
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/wishlist"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              My Wishlists
            </Link>
            <Link
              href="/wishlist/friends"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Friends
            </Link>
            <Link
              href="/wishlist/browse"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Browse
            </Link>
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

