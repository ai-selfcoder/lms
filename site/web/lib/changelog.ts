import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.resolve(process.cwd(), "..", "content");
const CHANGELOG_FILE = path.join(CONTENT_DIR, "changelog.json");

export type ChangelogType = "release" | "feature" | "content" | "fix";

export interface ChangelogLink {
  label: string;
  href: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  type: ChangelogType;
  title: string;
  summary: string;
  links: ChangelogLink[];
  /** Course ids whose content or learning contract is covered by this release. */
  courses: string[];
}

const TYPES = new Set<ChangelogType>(["release", "feature", "content", "fix"]);

function isEntry(value: unknown): value is ChangelogEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ChangelogEntry>;
  return (
    typeof item.version === "string" && item.version.length > 0 &&
    typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    typeof item.type === "string" && TYPES.has(item.type as ChangelogType) &&
    typeof item.title === "string" && item.title.length > 0 &&
    typeof item.summary === "string" && item.summary.length > 0 &&
    Array.isArray(item.links) && item.links.every((link) => link && typeof link.label === "string" && typeof link.href === "string")
    && Array.isArray(item.courses) && item.courses.every((course) => typeof course === "string" && course.length > 0)
  );
}

export function getChangelog(): ChangelogEntry[] {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(CHANGELOG_FILE, "utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}
