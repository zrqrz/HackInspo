/**
 * Devpost HTML is already pipeline-sanitized.
 * Keep a lightweight runtime defense without DOM libraries to avoid
 * Node ESM/CJS incompatibilities in server runtime.
 */
export function sanitizeProjectDescriptionHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\s*(script|style|iframe)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
}
