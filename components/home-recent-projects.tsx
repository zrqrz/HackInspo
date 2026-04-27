"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Trophy, Users, ExternalLink, GitBranch } from "lucide-react";
import type { ProjectCard } from "@/lib/types";

interface Props {
  projects: ProjectCard[];
}

export function HomeRecentProjects({ projects }: Props) {
  return (
    <section className="bg-black py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <h2 className="text-3xl md:text-4xl text-white tracking-tight">Featured Projects</h2>
          <Link
            href="/projects"
            className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors"
          >
            View all
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="py-20 text-center text-white/40">
            <p className="text-lg font-medium mb-2 text-white/60">No projects yet</p>
            <p className="text-sm">Run the data pipeline to populate projects.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  href={`/projects/${project.slug}`}
                  className="liquid-glass rounded-3xl p-8 flex flex-col gap-6 group hover:bg-white/[0.04] transition-all border border-white/5 shadow-xl h-full block"
                >
                  {project.award && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold self-start">
                      <Trophy size={14} />
                      {project.award.name}
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl text-white font-bold mb-3 group-hover:text-amber-400 transition-colors">
                      {project.title}
                    </h3>
                    {project.tagline && (
                      <p className="text-white/50 text-sm leading-relaxed line-clamp-2">
                        {project.tagline}
                      </p>
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
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-white/30 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[120px]">{project.hackathon.title}</span>
                      {project.teamSize != null && (
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>{project.teamSize}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {project.demoUrl && (
                        <ExternalLink size={14} className="hover:text-white transition-colors" />
                      )}
                      {project.repoUrl && (
                        <GitBranch size={14} className="hover:text-white transition-colors" />
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
