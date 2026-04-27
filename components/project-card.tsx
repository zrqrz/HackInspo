import Link from "next/link";
import { ExternalLink, GitBranch, Users, Trophy } from "lucide-react";
import type { ProjectCard } from "@/lib/types";

interface Props {
  project: ProjectCard;
}

export function ProjectCard({ project }: Props) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="liquid-glass rounded-3xl p-8 flex flex-col gap-6 group hover:bg-white/[0.04] transition-colors border border-white/5 shadow-xl h-full block"
    >
      {project.award && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider self-start">
          <Trophy size={12} />
          {project.award.name}
        </div>
      )}

      <div>
        <h3 className="text-2xl text-white font-bold mb-3 group-hover:text-amber-400 transition-colors tracking-tight line-clamp-2">
          {project.title}
        </h3>
        {project.tagline && (
          <p className="text-white/50 text-sm leading-relaxed line-clamp-2">{project.tagline}</p>
        )}
      </div>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.tags.slice(0, 5).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 rounded-md bg-white/5 text-white/40 text-[10px] font-mono tracking-wider"
            >
              {tag.name}
            </span>
          ))}
          {project.tags.length > 5 && (
            <span className="text-[10px] text-white/20 self-center">
              +{project.tags.length - 5}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-white/5 text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
        <div className="flex items-center gap-4">
          <span className="truncate max-w-[120px]">{project.hackathon.title}</span>
          {project.teamSize != null && (
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{project.teamSize}</span>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          {project.demoUrl && (
            <ExternalLink size={14} className="hover:text-white transition-colors" />
          )}
          {project.repoUrl && (
            <GitBranch size={14} className="hover:text-white transition-colors" />
          )}
        </div>
      </div>
    </Link>
  );
}
