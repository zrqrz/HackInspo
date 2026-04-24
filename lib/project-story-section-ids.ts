import type { ProjectSection } from "@/lib/types";

export type StorySectionItem = ProjectSection & { id: string };

export function slugifyStoryHeading(s: string): string {
  const base = s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return base || "section";
}

/** Devpost 里常见的小节标题：如 Challenges 下的「1. xxx」——目录里缩进 */
export function isNumberedSubsectionTitle(title: string): boolean {
  return /^\d+\.\s/.test(title.trim());
}

export function buildStorySectionItems(sections: ProjectSection[]): StorySectionItem[] {
  const used = new Set<string>();
  return sections.map((s, i) => {
    const base = s.title ? slugifyStoryHeading(s.title) : `section-${i}`;
    let id = base;
    let n = 0;
    while (used.has(id)) {
      n += 1;
      id = `${base}-${n}`;
    }
    used.add(id);
    return { ...s, id };
  });
}

export function getStoryTocItems(sections: ProjectSection[]): StorySectionItem[] {
  return buildStorySectionItems(sections).filter((item) => item.title);
}
