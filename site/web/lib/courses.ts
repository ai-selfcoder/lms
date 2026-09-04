import fs from "node:fs";
import path from "node:path";

/**
 * Course registry. The platform hosts several courses (Go concurrency, OS, …);
 * each is a self-contained content tree under `content/<contentDir>`. This
 * module is the single source of truth for "what courses exist" and where their
 * content lives. Server-only (reads the content tree via fs).
 */

const CONTENT_DIR = path.resolve(process.cwd(), "..", "content");
const REGISTRY = path.join(CONTENT_DIR, "courses.json");

export interface Course {
  id: string;
  slug: string;
  title: string;
  short: string;
  description: string;
  accent: string;
  /** Content subdir relative to content root ("" = legacy root for `go`). */
  contentDir: string;
  order: number;
  kind: "trainer" | "course";
}

/** The Go course is the historical default — used when no course is given. */
export const DEFAULT_COURSE_ID = "go";

let _cache: Course[] | null = null;

export function getCourses(): Course[] {
  if (_cache) return _cache;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  } catch {
    parsed = [];
  }
  const list = Array.isArray(parsed) ? (parsed as Course[]) : [];
  _cache = list.sort((a, b) => a.order - b.order);
  return _cache;
}

export function getCourse(id: string): Course | null {
  return getCourses().find((c) => c.id === id || c.slug === id) ?? null;
}

/** Absolute path to a course's content root. */
export function courseRoot(id: string): string {
  const course = getCourse(id);
  return path.join(CONTENT_DIR, course?.contentDir ?? id);
}
