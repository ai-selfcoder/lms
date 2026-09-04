export interface TocItem {
  depth: number;
  text: string;
  slug: string;
}

function slugifyHeading(text: string): string {
  // Mirrors rehype-slug (github-slugger-ish) closely enough for anchor links.
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

/** Extract h2/h3 headings from raw markdown/mdx for a table of contents. */
export function extractToc(source: string): TocItem[] {
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of source.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*$/);
    if (m) {
      const text = m[2].replace(/`/g, "").trim();
      items.push({ depth: m[1].length, text, slug: slugifyHeading(text) });
    }
  }
  return items;
}
