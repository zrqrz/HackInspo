export const dynamic = "force-dynamic";

import { HomeHero } from "@/components/home-hero";
import { HomeTracksSection } from "@/components/home-tracks-section";
import { HomeRecentProjects } from "@/components/home-recent-projects";
import { getRecentProjects } from "@/lib/db/projects";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HackInspo — Hackathon Project Ideas & Inspiration",
  description:
    "Browse winning hackathon projects and get AI-powered inspiration for your next build.",
};

export default async function HomePage() {
  const recentProjects = await getRecentProjects(3);

  return (
    <main className="bg-black text-white min-h-screen selection:bg-white selection:text-black">
      <HomeHero />
      <HomeTracksSection />
      <HomeRecentProjects projects={recentProjects} />

      <footer className="bg-black py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">HackInspo</span>
          </div>
          <p className="text-white/20 text-xs tracking-widest uppercase flex items-center gap-2">
            Crafted by{" "}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors flex items-center gap-1 font-bold"
            >
              Sean
            </a>{" "}
            and Anne
          </p>
        </div>
      </footer>
    </main>
  );
}
