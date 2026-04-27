"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          active
            ? "text-white underline underline-offset-8"
            : "text-white/40 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-6">
      <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">HackInspo</span>
          </Link>
          <nav className="hidden md:flex gap-8">
            {navLink("/projects", "Projects")}
            {navLink("/tracks", "Tracks")}
          </nav>
        </div>
      </div>
    </header>
  );
}
