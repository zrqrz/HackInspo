export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, GitBranch, Trophy, Users, Calendar, MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProjectBySlug } from "@/lib/db/projects";
import type { Metadata } from "next";

// Next.js 16: params is a Promise
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: `${project.title} — HackInspo`,
    description: project.tagline ?? project.description?.slice(0, 160) ?? "",
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  const submissionDate = project.hackathon.submissionEnd
    ? new Date(project.hackathon.submissionEnd).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Back nav */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid lg:grid-cols-3 gap-14">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Award */}
            {project.award && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold mb-6">
                <Trophy className="w-4 h-4" />
                {project.award.name}
              </div>
            )}

            <h1 className="text-5xl font-bold mb-5 leading-tight">{project.title}</h1>

            {project.tagline && (
              <p className="text-2xl text-gray-600 mb-10 leading-relaxed">
                {project.tagline}
              </p>
            )}

            {/* Tags / Tracks */}
            {(project.tags.length > 0 || project.tracks.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-10">
                {project.tracks.map((track) => (
                  <Link key={track.id} href={`/tracks/${track.slug}`}>
                    <Badge variant="default" className="text-xs">
                      {track.name}
                    </Badge>
                  </Link>
                ))}
                {project.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs font-mono">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="mb-10" />

            {/* Full description */}
            {project.description ? (
              <div className="prose prose-gray max-w-none">
                {project.description.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-5 text-gray-700 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No description available.</p>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Links */}
            <div className="space-y-3">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full"
                >
                  <Button className="w-full gap-2" size="lg">
                    <ExternalLink className="w-4 h-4" />
                    View Demo
                  </Button>
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full"
                >
                  <Button variant="outline" className="w-full gap-2" size="lg">
                    <GitBranch className="w-4 h-4" />
                    View Repo
                  </Button>
                </a>
              )}
            </div>

            {/* Hackathon info */}
            <div className="border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                Hackathon
              </h3>
              <a
                href={project.hackathon.devpostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline block"
              >
                {project.hackathon.title}
              </a>
              {project.hackathon.organization && (
                <p className="text-sm text-gray-600">{project.hackathon.organization}</p>
              )}
              <div className="text-sm text-gray-500 space-y-1.5 pt-1">
                {submissionDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {submissionDate}
                  </div>
                )}
                {project.hackathon.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {project.hackathon.location}
                  </div>
                )}
                {project.hackathon.registrationsCount && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    {project.hackathon.registrationsCount.toLocaleString()} participants
                  </div>
                )}
              </div>
              {project.hackathon.themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.hackathon.themes.map((theme) => (
                    <span key={theme} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Team */}
            {project.teamMembers.length > 0 && (
              <div className="border border-gray-200 p-5 space-y-3">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                  Team ({project.teamMembers.length})
                </h3>
                <div className="space-y-1">
                  {project.teamMembers.map((member) => (
                    <div key={member} className="text-sm text-gray-700">
                      {member}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Similar projects */}
        {project.similarProjects.length > 0 && (
          <div className="mt-20 pt-10 border-t border-gray-200">
            <h2 className="text-2xl font-bold mb-8">Similar Projects</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {project.similarProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
