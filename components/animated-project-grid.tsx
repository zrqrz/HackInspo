"use client";

import { motion } from "motion/react";
import { ProjectCard } from "@/components/project-card";
import type { ProjectCard as ProjectCardType } from "@/lib/types";

interface Props {
  projects: ProjectCardType[];
}

export function AnimatedProjectGrid({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="py-24 text-center text-white/40">
        <p className="text-lg font-medium mb-2 text-white/60">No projects found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {projects.map((project, i) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
        >
          <ProjectCard project={project} />
        </motion.div>
      ))}
    </div>
  );
}
