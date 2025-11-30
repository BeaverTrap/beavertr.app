import PageShell from "@/components/PageShell";
import Link from "next/link";

export default function PortfolioPage() {
  return (
    <PageShell title="Portfolio">
      <div className="prose prose-invert max-w-none text-zinc-300">
        <div className="mb-6 text-center">
          <p className="text-zinc-400 text-sm uppercase tracking-wider mb-4">New Portfolio Coming Soon</p>
          <p className="text-lg leading-relaxed mb-6">
            We're building a new portfolio. For now, you can view my work on my Adobe portfolio site.
          </p>
          <Link
            href="https://jonwayne.myportfolio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            View Adobe Portfolio →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

