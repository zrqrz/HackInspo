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
      className="group flex flex-col bg-white border border-gray-200 hover:border-black hover:shadow-md transition-all duration-200"
    >
      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Award badge */}
        {project.award && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 w-fit">
            <Trophy className="w-3 h-3" />
            {project.award.name}
          </div>
        )}

        {/* Title + tagline */}
        <div>
          <h3 className="text-xl font-bold mb-1.5 group-hover:underline underline-offset-2 line-clamp-2">
            {project.title}
          </h3>
          {project.tagline && (
            <p className="text-gray-600 text-sm line-clamp-2">{project.tagline}</p>
          )}
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 5).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 font-mono"
              >
                {tag.name}
              </span>
            ))}
            {project.tags.length > 5 && (
              <span className="text-xs px-2.5 py-1 text-gray-400">
                +{project.tags.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span className="truncate max-w-[160px]">{project.hackathon.title}</span>
            {project.teamSize != null && (
              <span className="flex items-center gap-1 shrink-0">
                <Users className="w-3.5 h-3.5" />
                {project.teamSize}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {project.demoUrl && (
              <span title="Demo" className="text-gray-400 hover:text-black transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            )}
            {project.repoUrl && (
              <span title="Repo" className="text-gray-400 hover:text-black transition-colors">
                <GitBranch className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
