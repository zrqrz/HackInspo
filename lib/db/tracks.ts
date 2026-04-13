/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import type { TrackDTO, TrackWithProjects, ProjectCard } from "@/lib/types";

// ── Mock data ─────────────────────────────────────────────────────────────────
// Track table is empty until Phase 1 AI classification runs.
// These mock tracks are used for UI display only; they are clearly labelled
// "Coming Soon" in the UI.

export const MOCK_TRACKS: (TrackDTO & { icon: string; comingSoon: true })[] = [
  { id: -1, name: "AI / ML",        slug: "ai-ml",        description: "Machine learning, LLMs, computer vision", icon: "Brain",       comingSoon: true },
  { id: -2, name: "FinTech",        slug: "fintech",       description: "Finance, payments, trading tools",        icon: "Coins",       comingSoon: true },
  { id: -3, name: "HealthTech",     slug: "healthtech",    description: "Health, wellness, medical tools",         icon: "Heart",       comingSoon: true },
  { id: -4, name: "Sustainability", slug: "sustainability",description: "Climate, environment, green tech",        icon: "Leaf",        comingSoon: true },
  { id: -5, name: "Social Good",    slug: "social-good",   description: "Civic tech, education, accessibility",    icon: "Users",       comingSoon: true },
  { id: -6, name: "Dev Tools",      slug: "dev-tools",     description: "Developer productivity, infra, APIs",     icon: "Terminal",    comingSoon: true },
];

// ── Live queries ──────────────────────────────────────────────────────────────

export async function getTracks(): Promise<TrackDTO[]> {
  const tracks = await prisma.track.findMany({
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });
  return tracks;
}

export async function getTrackWithProjects(
  slug: string
): Promise<TrackWithProjects | null> {
  const track = await prisma.track.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      projects: {
        select: {
          project: {
            select: {
              id: true,
              slug: true,
              title: true,
              tagline: true,
              teamSize: true,
              demoUrl: true,
              repoUrl: true,
              tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
              tracks: { select: { track: { select: { id: true, name: true, slug: true, description: true } } } },
              awards: { select: { id: true, name: true, tier: true, prizeValue: true }, take: 1 },
              hackathon: { select: { id: true, title: true, submissionEnd: true } },
            },
          },
        },
      },
    },
  });

  if (!track) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: ProjectCard[] = track.projects.map(({ project: p }: any) => ({
    id: p.id,
    slug: p.slug ?? `project-${p.id}`,
    title: p.title,
    tagline: p.tagline,
    teamSize: p.teamSize,
    demoUrl: p.demoUrl,
    repoUrl: p.repoUrl,
    tags: p.tags.map((t: any) => t.tag),
    tracks: p.tracks.map((t: any) => t.track),
    award: p.awards[0] ?? null,
    hackathon: {
      ...p.hackathon,
      submissionEnd: p.hackathon.submissionEnd?.toISOString() ?? null,
    },
  }));

  return {
    id: track.id,
    name: track.name,
    slug: track.slug,
    description: track.description,
    projects,
    projectCount: projects.length,
  };
}
