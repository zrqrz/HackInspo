import { sanitizeProjectDescriptionHtml } from "@/lib/sanitize-project-html";
import type { ProjectSection } from "@/lib/types";

type Props = {
  sections: ProjectSection[] | null;
  plainDescription: string | null;
};

function slugify(s: string): string {
  const base = s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return base || "section";
}

/** Devpost 里常见的小节标题：如 Challenges 下的「1. xxx」——目录里缩进，正文用 h3 */
function isNumberedSubsectionTitle(title: string): boolean {
  return /^\d+\.\s/.test(title.trim());
}

function buildSectionItems(sections: ProjectSection[]) {
  const used = new Set<string>();
  return sections.map((s, i) => {
    const base = s.title ? slugify(s.title) : `section-${i}`;
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

export function ProjectStorySections({ sections, plainDescription }: Props) {
  if (sections && sections.length > 0) {
    const items = buildSectionItems(sections);
    const tocItems = items.filter((item) => item.title);

    return (
      <div className="md:flex md:gap-8 md:items-start">
        {tocItems.length > 0 ? (
          <nav
            aria-label="On this page"
            className="hidden md:block md:w-52 md:shrink-0 md:sticky md:top-24 md:self-start border-l border-gray-200 pl-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              On this page
            </p>
            <div className="max-h-[min(70vh,36rem)] overflow-y-auto overscroll-y-contain pr-1 [scrollbar-width:thin]">
              <ul className="space-y-1.5 text-[13px] leading-snug">
                {tocItems.map((item) => {
                  const sub = item.title && isNumberedSubsectionTitle(item.title);
                  return (
                    <li key={item.id} className={sub ? "pl-2.5 border-l border-gray-200 ml-0.5" : ""}>
                      <a
                        href={`#${item.id}`}
                        title={item.title ?? undefined}
                        className={
                          sub
                            ? "block text-gray-500 hover:text-gray-900 wrap-break-word hyphens-auto"
                            : "block font-medium text-gray-700 hover:text-gray-900 wrap-break-word hyphens-auto"
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
        ) : null}

        {/* prose 只包在正文 HTML 上，避免把章节 h2 压扁 */}
        <div className="min-w-0 flex-1 space-y-10">
          {items.map((item) => {
            const sub = Boolean(item.title && isNumberedSubsectionTitle(item.title));
            return (
              <section
                key={item.id}
                id={item.id}
                className="scroll-mt-24"
              >
                {item.title ? (
                  sub ? (
                    <h3 className="text-xl font-semibold tracking-tight text-gray-900 mb-3">
                      {item.title}
                    </h3>
                  ) : (
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">
                      {item.title}
                    </h2>
                  )
                ) : null}
                {/* Section 标题在 prose 外已是 h2；正文里的 h3/h4 需明显小于章节 h2，避免与 Devpost 层级观感不一致 */}
                <div
                  className="prose prose-gray prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:text-gray-900 prose-h4:mt-6 prose-h4:mb-2 prose-h4:text-base prose-h4:font-semibold prose-h4:text-gray-800 prose-h5:text-sm prose-h5:font-semibold prose-h5:text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeProjectDescriptionHtml(item.html),
                  }}
                />
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  if (plainDescription) {
    const paras = plainDescription
      .replace(/\r\n/g, "\n")
      .trim()
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paras.length > 1) {
      return (
        <div className="prose prose-gray max-w-none">
          {paras.map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      );
    }
    return (
      <div className="prose prose-gray max-w-none">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700 not-prose m-0">
          {plainDescription}
        </p>
      </div>
    );
  }

  return <p className="text-gray-400 italic">No description available.</p>;
}
