export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Trophy,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";
import { Header } from "@/components/header";
import { ProjectCard } from "@/components/project-card";
import { PageFadeIn } from "@/components/page-fade-in";
import { getProjectBySlug } from "@/lib/db/projects";
import { ProjectStorySections } from "@/components/project-story-sections";
import { ProjectStoryToc } from "@/components/project-story-toc";
import type { Metadata } from "next";

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
    <PageFadeIn>
    <div className="bg-black min-h-screen text-white">
      <Header />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Back */}
        <Link
          href="/projects"
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 uppercase tracking-widest text-xs font-medium"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              {project.award && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-semibold mb-6">
                  <Trophy size={16} />
                  {project.award.name}
                </div>
              )}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                {project.title}
              </h1>
              {project.tagline && (
                <p className="text-xl md:text-2xl text-white/60 font-medium leading-relaxed">
                  {project.tagline}
                </p>
              )}
            </div>

            {/* Tags / Tracks */}
            {(project.tags.length > 0 || project.tracks.length > 0) && (
              <div className="flex flex-wrap gap-3">
                {project.tracks.map((track) => (
                  <Link key={track.id} href={`/tracks/${track.slug}`}>
                    <span className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium tracking-wider hover:bg-white/15 transition-colors">
                      {track.name}
                    </span>
                  </Link>
                ))}
                {project.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm font-mono tracking-wider"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-white/5 pt-12">
              <ProjectStorySections
                sections={project.descriptionSections}
                plainDescription={project.description}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* CTA links */}
            <div className="flex flex-col gap-4">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 transition-all"
                >
                  <ExternalLink size={20} />
                  View Demo
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 liquid-glass text-white font-bold py-4 rounded-2xl hover:bg-white/5 transition-all"
                >
                  <GitBranch size={20} />
                  View Repo
                </a>
              )}
            </div>

            {/* Hackathon info */}
            <div className="liquid-glass rounded-3xl p-8 space-y-8">
              <div>
                <span className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">
                  Hackathon
                </span>
                <a
                  href={project.hackathon.devpostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-bold hover:text-white/80 transition-colors block mb-1"
                >
                  {project.hackathon.title}
                </a>
                {project.hackathon.organization && (
                  <p className="text-white/40 text-sm mb-6">{project.hackathon.organization}</p>
                )}
                <div className="space-y-4">
                  {submissionDate && (
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <Calendar size={18} className="text-white/30 shrink-0" />
                      <span>{submissionDate}</span>
                    </div>
                  )}
                  {project.hackathon.location && (
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <MapPin size={18} className="text-white/30 shrink-0" />
                      <span>{project.hackathon.location}</span>
                    </div>
                  )}
                  {project.hackathon.registrationsCount && (
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <Users size={18} className="text-white/30 shrink-0" />
                      <span>
                        {project.hackathon.registrationsCount.toLocaleString()} participants
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {project.hackathon.themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.hackathon.themes.map((theme) => (
                    <span
                      key={theme}
                      className="px-3 py-1 rounded-md bg-white/5 text-white/40 text-[10px] font-bold"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}

              {project.teamMembers.length > 0 && (
                <div className="pt-8 border-t border-white/5">
                  <span className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">
                    Team ({project.teamMembers.length})
                  </span>
                  <div className="space-y-2">
                    {project.teamMembers.map((member) => (
                      <p key={member} className="text-white text-sm font-medium">
                        {member}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TOC */}
            <ProjectStoryToc sections={project.descriptionSections} />
          </aside>
        </div>

        {/* Similar projects */}
        {project.similarProjects.length > 0 && (
          <div className="mt-20 pt-10 border-t border-white/5">
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
    </PageFadeIn>
  );
}
