import Navbar from "@/components/Navbar";

interface PageShellProps {
  title: string;
  children?: React.ReactNode;
}

export default function PageShell({ title, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-5xl font-bold mb-8 text-center text-base-content">{title}</h1>
        {children || (
          <p className="text-base-content/70 text-center">Content coming soon...</p>
        )}
      </main>
    </div>
  );
}

