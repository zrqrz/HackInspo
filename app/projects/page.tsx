export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { ProjectCard } from "@/components/project-card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { getProjects, getTopTags } from "@/lib/db/projects";
import type { ProjectFilters } from "@/lib/types";

// Next.js 16: searchParams is a Promise
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

  const [{ data: projects, total, page, totalPages }, topTags] =
    await Promise.all([getProjects(filters), getTopTags(20)]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Search bar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Suspense>
            <SearchInput
              placeholder="Search projects, tech stack..."
              defaultValue={filters.search ?? ""}
            />
          </Suspense>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-12">
          {/* Filter sidebar — Client Component, needs Suspense for useSearchParams */}
          <Suspense fallback={<div className="w-64 flex-shrink-0" />}>
            <FilterSidebar topTags={topTags} />
          </Suspense>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-6">
              {total} {total === 1 ? "project" : "projects"} found
            </p>

            {projects.length === 0 ? (
              <div className="py-24 text-center text-gray-500">
                <p className="text-lg font-medium mb-2">No projects found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}

            <Suspense>
              <Pagination currentPage={page} totalPages={totalPages} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
