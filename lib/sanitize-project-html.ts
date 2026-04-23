import DOMPurify from "isomorphic-dompurify";

/** Devpost-sourced story HTML: keep structure, drop scripts and dangerous URLs. */
export function sanitizeProjectDescriptionHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "img",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "b",
      "i",
      "a",
      "br",
      "blockquote",
      "code",
      "pre",
      "span",
      "div",
      "sub",
      "sup",
    ],
    ALLOWED_ATTR: ["href", "title", "target", "rel", "class", "src", "alt", "width", "height", "loading"],
  });
}
