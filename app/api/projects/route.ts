import { NextRequest, NextResponse } from "next/server";
import { getProjects } from "@/lib/db/projects";
import type { ProjectFilters } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters: ProjectFilters = {
    search: searchParams.get("search") ?? undefined,
    tags: searchParams.getAll("tags").filter(Boolean),
    teamSize: searchParams.getAll("teamSize").map(Number).filter(Boolean),
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 12),
  };

  try {
    const result = await getProjects(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/projects]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
