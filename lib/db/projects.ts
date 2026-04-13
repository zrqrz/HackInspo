import { prisma } from "@/lib/prisma";
import type { ProjectCard, ProjectDetail, ProjectFilters, Paginated } from "@/lib/types";

// ── Shared select shapes ──────────────────────────────────────────────────────

const projectCardSelect = {
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
  hackathon: {
    select: { id: true, title: true, submissionEnd: true },
  },
} as const;

// ── Mappers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProjectCard(p: any): ProjectCard {
  return {
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
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getProjects(
  filters: ProjectFilters = {}
): Promise<Paginated<ProjectCard>> {
  const { search, tags, teamSize, page = 1, pageSize = 12 } = filters;

  const where = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { tagline: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(tags?.length && {
      tags: { some: { tag: { slug: { in: tags } } } },
    }),
    ...(teamSize?.length && {
      teamSize: { in: teamSize },
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      select: projectCardSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: rows.map(mapProjectCard),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getRecentProjects(limit = 3): Promise<ProjectCard[]> {
  const rows = await prisma.project.findMany({
    select: projectCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapProjectCard);
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  const p = await prisma.project.findUnique({
    where: { slug },
    select: {
      ...projectCardSelect,
      description: true,
      teamMembers: true,
      hackathon: {
        select: {
          id: true,
          title: true,
          devpostUrl: true,
          organization: true,
          location: true,
          submissionEnd: true,
          registrationsCount: true,
          themes: true,
        },
      },
    },
  });

  if (!p) return null;

  // Similar projects: share at least one tag, exclude self
  const tagIds = p.tags.map((t: any) => t.tag.id);
  const similar = tagIds.length
    ? await prisma.project.findMany({
        where: {
          id: { not: p.id },
          tags: { some: { tagId: { in: tagIds } } },
        },
        select: projectCardSelect,
        take: 3,
      })
    : [];

  return {
    id: p.id,
    slug: p.slug ?? `project-${p.id}`,
    title: p.title,
    tagline: p.tagline,
    description: p.description,
    teamSize: p.teamSize,
    teamMembers: p.teamMembers,
    demoUrl: p.demoUrl,
    repoUrl: p.repoUrl,
    tags: p.tags.map((t: any) => t.tag),
    tracks: p.tracks.map((t: any) => t.track),
    award: p.awards[0] ?? null,
    hackathon: {
      ...p.hackathon,
      submissionEnd: p.hackathon.submissionEnd?.toISOString() ?? null,
    },
    similarProjects: similar.map(mapProjectCard),
  };
}

export async function getTopTags(limit = 30): Promise<{ id: number; name: string; slug: string; count: number }[]> {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { projects: true } },
    },
    orderBy: { projects: { _count: "desc" } },
    take: limit,
  });
  return tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t._count.projects }));
}
