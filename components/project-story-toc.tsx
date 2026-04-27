import type { ProjectSection } from "@/lib/types";
import {
  getStoryTocItems,
  isNumberedSubsectionTitle,
} from "@/lib/project-story-section-ids";

type Props = {
  sections: ProjectSection[] | null;
};

export function ProjectStoryToc({ sections }: Props) {
  if (!sections || sections.length === 0) return null;
  const tocItems = getStoryTocItems(sections);
  if (tocItems.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="hidden lg:block sticky top-28 self-start border-l border-white/10 py-1 pl-4"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3">
        On this page
      </p>
      <div className="max-h-[min(70vh,36rem)] overflow-y-auto overscroll-y-contain [scrollbar-width:thin] pr-1">
        <ul className="space-y-1.5 text-[13px] leading-snug">
          {tocItems.map((item) => {
            const sub = item.title && isNumberedSubsectionTitle(item.title);
            return (
              <li key={item.id} className={sub ? "pl-2.5 border-l border-white/10 ml-0.5" : ""}>
                <a
                  href={`#${item.id}`}
                  title={item.title ?? undefined}
                  className={
                    sub
                      ? "block text-white/30 hover:text-white transition-colors wrap-break-word hyphens-auto"
                      : "block text-white/40 hover:text-white transition-colors wrap-break-word hyphens-auto"
                  }
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
