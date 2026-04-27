export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { AnimatedProjectGrid } from "@/components/animated-project-grid";
import { FilterSidebar } from "@/components/filter-sidebar";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { ChevronDown } from "lucide-react";
import { getProjects, getTopTags } from "@/lib/db/projects";
import type { ProjectFilters } from "@/lib/types";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const toArray = (v: string | string[] | undefined): string[] =>
    !v ? [] : Array.isArray(v) ? v : [v];

  const filters: ProjectFilters = {
    search: typeof params.search === "string" ? params.search : undefined,
    tags: toArray(params.tags),
    teamSize: toArray(params.teamSize).map(Number).filter(Boolean),
    page: Number(params.page ?? 1),
    pageSize: 12,
  };

  const [{ data: projects, total, page, totalPages }, topTags] = await Promise.all([
    getProjects(filters),
    getTopTags(20),
  ]);

  return (
    <div className="bg-black min-h-screen text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Sidebar filters */}
        <Suspense fallback={<div className="space-y-12 opacity-20 animate-pulse" />}>
          <FilterSidebar topTags={topTags} />
        </Suspense>

        {/* Main content */}
        <main className="md:col-span-3 space-y-8">
          <Suspense>
            <SearchInput
              placeholder="Search projects, tech stack..."
              defaultValue={filters.search ?? ""}
            />
          </Suspense>

          <div className="flex items-center justify-between text-white/30 text-sm uppercase tracking-widest font-medium">
            <span>{total} {total === 1 ? "project" : "projects"} found</span>
            <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <span>Sort by: Trending</span>
              <ChevronDown size={16} />
            </div>
          </div>

          <AnimatedProjectGrid projects={projects} />

          <Suspense>
            <Pagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
