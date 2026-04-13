import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { getTrackWithProjects, MOCK_TRACKS } from "@/lib/db/tracks";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mock = MOCK_TRACKS.find((t) => t.slug === slug);
  const name = mock?.name ?? slug;
  return { title: `${name} — HackInspo` };
}

export default async function TrackPage({ params }: Props) {
  const { slug } = await params;

  // Try live data first
  const track = await getTrackWithProjects(slug);

  // If no live track, check if it's a known mock track (coming soon)
  const mockTrack = MOCK_TRACKS.find((t) => t.slug === slug);

  if (!track && !mockTrack) notFound();

  // Use live data or fall back to mock shape
  const displayTrack = track ?? {
    id: mockTrack!.id,
    name: mockTrack!.name,
    slug: mockTrack!.slug,
    description: mockTrack!.description,
    projects: [],
    projectCount: 0,
  };

  const isComingSoon = !track;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Back nav */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Track header */}
      <div className="border-b border-gray-200 py-14 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-3">{displayTrack.name}</h1>
              {displayTrack.description && (
                <p className="text-xl text-gray-300">{displayTrack.description}</p>
              )}
            </div>
            {isComingSoon && (
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-amber-400 text-black rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          {!isComingSoon && (
            <p className="mt-6 text-gray-400 text-sm">
              {displayTrack.projectCount} project{displayTrack.projectCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        {isComingSoon ? (
          <div className="py-24 text-center text-gray-400">
            <p className="text-2xl font-semibold mb-3 text-gray-700">
              Track classification in progress
            </p>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Projects will be automatically categorised into tracks after AI
              classification runs (Phase 1). Check back soon.
            </p>
            <Link href="/projects">
              <Button size="lg">Browse all projects</Button>
            </Link>
          </div>
        ) : displayTrack.projects.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg text-gray-500">No projects in this track yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTrack.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
