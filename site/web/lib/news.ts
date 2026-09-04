import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getCourses, courseRoot } from "@/lib/courses";

/**
 * "What's new" feed for the home page. Two sources, per the product brief:
 *   1. Curated announcements — hand-written in `content/news.json` (human voice).
 *   2. Recently added chapters — derived automatically from the content tree
 *      (file mtime). Restricted to book chapters so every link is a real route.
 * Server-only (reads the content tree via fs). Degrades to empty on any error.
 */

const CONTENT_DIR = path.resolve(process.cwd(), "..", "content");
const NEWS_FILE = path.join(CONTENT_DIR, "news.json");

export interface Announcement {
  date: string; // ISO yyyy-mm-dd
  tag: string;
  title: string;
  href: string;
  body: string;
  course?: string; // course id, for accent colouring
}

export interface RecentChapter {
  course: string; // short label (e.g. "ОС")
  accent: string;
  title: string;
  href: string;
  mtimeMs: number;
}

export function getAnnouncements(): Announcement[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(NEWS_FILE, "utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return (parsed as Announcement[])
    .filter((a) => a && a.title && a.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getRecentChapters(limit = 6): RecentChapter[] {
  const out: RecentChapter[] = [];
  for (const c of getCourses()) {
    const dir = path.join(courseRoot(c.id), "book");
    let files: string[];
    try {
      files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    } catch {
      continue;
    }
    for (const f of files) {
      const full = path.join(dir, f);
      let title = f.replace(/\.mdx$/, "");
      let slug = title;
      try {
        const g = matter(fs.readFileSync(full, "utf8"));
        if (typeof g.data.title === "string") title = g.data.title;
        if (typeof g.data.slug === "string") slug = g.data.slug;
      } catch {
        /* keep filename fallback */
      }
      let mtimeMs = 0;
      try {
        mtimeMs = fs.statSync(full).mtimeMs;
      } catch {
        /* mtime 0 */
      }
      out.push({ course: c.short, accent: c.accent, title, href: `/${c.slug}/book/${slug}`, mtimeMs });
    }
  }
  out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return out.slice(0, limit);
}
