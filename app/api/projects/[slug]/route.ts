import { NextRequest, NextResponse } from "next/server";
import { getProjectBySlug } from "@/lib/db/projects";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const project = await getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (err) {
    console.error("[GET /api/projects/:slug]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
