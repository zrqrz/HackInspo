import { sanitizeProjectDescriptionHtml } from "@/lib/sanitize-project-html";
import { buildStorySectionItems, isNumberedSubsectionTitle } from "@/lib/project-story-section-ids";
import type { ProjectSection } from "@/lib/types";

type Props = {
  sections: ProjectSection[] | null;
  plainDescription: string | null;
};

/** Devpost-like stack (Circular omitted — needs license). */
const storyFont =
  "font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-base text-[#233136] leading-[1.625]";

/** Shared @tailwindcss/typography overrides aligned with Devpost body/headings. */
const proseStory =
  [
    "prose prose-gray max-w-none",
    "prose-headings:scroll-mt-8",
    "prose-headings:font-medium prose-headings:text-[#192325]",
    "prose-h1:text-[1.5em] prose-h1:leading-tight prose-h1:mt-0 prose-h1:mb-[0.6em]",
    "prose-h2:text-[1.5em] prose-h2:leading-tight prose-h2:mt-0 prose-h2:mb-[0.6em]",
    "prose-h3:text-lg prose-h3:leading-tight prose-h3:mt-4 prose-h3:mb-[0.6em]",
    "prose-h4:text-base prose-h4:leading-tight prose-h4:mt-3 prose-h4:mb-[0.5em]",
    "prose-h5:text-sm prose-h5:leading-snug prose-h5:mt-2 prose-h5:mb-[0.5em]",
    "prose-h6:text-sm prose-h6:leading-snug prose-h6:mt-2 prose-h6:mb-[0.5em]",
    "prose-p:mt-0 prose-p:mb-[0.6em] prose-p:last:mb-0",
    "prose-p:text-[#233136] prose-p:leading-[1.625]",
    "prose-li:text-[#233136] prose-li:leading-[1.625]",
    "prose-strong:text-[#233136] prose-strong:font-medium",
    "prose-blockquote:text-[#233136]",
    "prose-a:text-blue-600",
    "prose-ul:my-[0.6em] prose-ol:my-[0.6em]",
  ].join(" ");

export function ProjectStorySections({ sections, plainDescription }: Props) {
  if (sections && sections.length > 0) {
    const items = buildStorySectionItems(sections);

    return (
      <div className={`space-y-7 ${storyFont}`}>
        {items.map((item) => {
          const sub = Boolean(item.title && isNumberedSubsectionTitle(item.title));
          return (
            <section key={item.id} id={item.id} className="scroll-mt-8">
              {item.title ? (
                sub ? (
                  <h3 className="mt-0 mb-[0.6em] text-lg font-medium leading-tight tracking-normal text-[#192325]">
                    {item.title}
                  </h3>
                ) : (
                  <h2 className="mt-0 mb-[0.6em] text-[1.5em] font-medium leading-tight tracking-normal text-[#192325]">
                    {item.title}
                  </h2>
                )
              ) : null}
              <div
                className={proseStory}
                dangerouslySetInnerHTML={{
                  __html: sanitizeProjectDescriptionHtml(item.html),
                }}
              />
            </section>
          );
        })}
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
        <div className={`${storyFont} ${proseStory}`}>
          {paras.map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      );
    }
    return (
      <div className={storyFont}>
        <p className="m-0 whitespace-pre-wrap text-[#233136]">{plainDescription}</p>
      </div>
    );
  }

  return <p className="text-gray-400 italic">No description available.</p>;
}
