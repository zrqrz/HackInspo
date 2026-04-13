import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          HackInspo
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/projects" className="text-gray-600 hover:text-black transition-colors">
            Projects
          </Link>
          <Link href="/tracks/ai-ml" className="text-gray-600 hover:text-black transition-colors">
            Tracks
          </Link>
        </nav>
      </div>
    </header>
  );
}
