export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, Brain, Coins, Heart, Leaf, Users, Terminal, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { getRecentProjects } from "@/lib/db/projects";
import { MOCK_TRACKS } from "@/lib/db/tracks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HackInspo — Hackathon Project Ideas & Inspiration",
  description:
    "Browse winning hackathon projects and get AI-powered inspiration for your next build.",
};

const TRACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Coins,
  Heart,
  Leaf,
  Users,
  Terminal,
};

export default async function HomePage() {
  const recentProjects = await getRecentProjects(3);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-black text-white px-6 py-28">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold tracking-tight mb-6 leading-tight">
            Win your next hackathon
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Browse thousands of winning hackathon projects and get AI-powered ideas
            tailored to any theme, tech stack, or team size.
          </p>

          {/* Native form — no JS needed, works with SSR */}
          <form action="/projects" method="GET" className="flex gap-3 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                type="text"
                name="search"
                placeholder="Search projects, tech stack, ideas…"
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-white text-black font-semibold hover:bg-gray-100 transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          <p className="mt-5 text-sm text-gray-600">
            or{" "}
            <Link href="/projects" className="text-gray-400 hover:text-white underline underline-offset-2 transition-colors">
              browse all projects
            </Link>
          </p>
        </div>
      </section>

      {/* ── Tracks ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-200 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Browse by Track</h2>
              <p className="text-gray-500 text-sm">
                Projects automatically categorised after AI classification (coming soon)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {MOCK_TRACKS.map((track) => {
              const Icon = TRACK_ICONS[track.icon];
              return (
                <Link
                  key={track.slug}
                  href={`/tracks/${track.slug}`}
                  className="group relative flex flex-col items-center gap-3 p-6 border border-gray-200 text-center opacity-60 cursor-not-allowed pointer-events-none"
                  aria-disabled="true"
                  tabIndex={-1}
                >
                  {Icon && <Icon className="w-7 h-7 text-gray-400" />}
                  <span className="font-semibold text-sm">{track.name}</span>
                  <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Recent Projects ─────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold">Recent Projects</h2>
            <Link href="/projects">
              <Button variant="outline" className="gap-2">
                View all
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="text-lg font-medium mb-2 text-gray-600">No projects yet</p>
              <p className="text-sm">Run the data pipeline to populate projects.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 px-6 py-8 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <span className="font-bold text-black">HackInspo</span>
          <span>Built for hackers, by hackers</span>
        </div>
      </footer>
    </div>
  );
}
