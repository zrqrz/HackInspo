/**
 * Application-level types derived from Prisma generated types.
 *
 * These are the shapes that API routes return and pages consume.
 * Keeping them separate from Prisma internals means pages don't
 * need to import from the generated client directly.
 */

// ── Enums (re-exported for convenience) ──────────────────────────────────────
export type { DifficultyLevel, AwardTier, ClassificationStatus } from "@/app/generated/prisma";

// ── Base shapes ───────────────────────────────────────────────────────────────

export interface TagDTO {
  id: number;
  name: string;
  slug: string;
}

export interface AwardDTO {
  id: number;
  name: string;
  tier: string;
  prizeValue: number | null;
}

export interface HackathonDTO {
  id: number;
  title: string;
  devpostUrl: string;
  organization: string | null;
  location: string | null;
  submissionEnd: string | null; // ISO string
  registrationsCount: number | null;
  themes: string[];
}

// ── Project shapes ────────────────────────────────────────────────────────────

/** Compact shape used in card grids and lists */
export interface ProjectCard {
  id: number;
  slug: string;
  title: string;
  tagline: string | null;
  teamSize: number | null;
  demoUrl: string | null;
  repoUrl: string | null;
  tags: TagDTO[];
  tracks: TrackDTO[];
  award: AwardDTO | null;
  hackathon: Pick<HackathonDTO, "id" | "title" | "submissionEnd">;
}

/** Full shape used on the detail page */
export interface ProjectDetail extends ProjectCard {
  description: string | null;
  teamMembers: string[];
  hackathon: HackathonDTO;
  similarProjects: ProjectCard[];
}

// ── Track shapes ──────────────────────────────────────────────────────────────

export interface TrackDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface TrackWithProjects extends TrackDTO {
  projects: ProjectCard[];
  projectCount: number;
}

// ── Paginated response ────────────────────────────────────────────────────────

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Filter params (used by /projects page and API route) ─────────────────────

export interface ProjectFilters {
  search?: string;
  tags?: string[];       // tag slugs
  teamSize?: number[];   // e.g. [1, 2, 3]
  page?: number;
  pageSize?: number;
}
