import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { courseRoot, DEFAULT_COURSE_ID } from "@/lib/courses";

/**
 * Content loader. Reads a course's source-of-truth content tree via fs at
 * server/build time. Everything here runs only on the server.
 *
 * Every loader is course-scoped: it takes a `courseId` (defaulting to the
 * historical `go` course, so pre-platform callers keep working). A course's
 * content lives under `content/<contentDir>/{tasks,book,topics,sims,quizzes}`
 * (see lib/courses.ts).
 *
 * The content directory may be partially generated: theory.mdx / solution.mdx /
 * topic intros / book chapters / sims / quizzes can be missing. All loaders
 * degrade gracefully and never throw on missing optional files.
 */

function tasksDir(courseId: string): string {
  return path.join(courseRoot(courseId), "tasks");
}
function bookDir(courseId: string): string {
  return path.join(courseRoot(courseId), "book");
}
function topicsDir(courseId: string): string {
  return path.join(courseRoot(courseId), "topics");
}
function simsDir(courseId: string): string {
  return path.join(courseRoot(courseId), "sims");
}
function quizzesDir(courseId: string): string {
  return path.join(courseRoot(courseId), "quizzes");
}

function safeRead(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function exists(file: string): boolean {
  try {
    fs.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskMeta {
  id: string;
  num: number;
  topic: string;
  title: string;
  slug: string;
  type?: string;
  difficulty?: string;
  tags?: string[];
}

export interface TaskContent extends TaskMeta {
  problem: string; // raw markdown/mdx body
  starter: string; // starter.go source
  theory: string | null; // theory.mdx raw (frontmatter stripped)
  theoryMeta: Record<string, unknown> | null;
  solution: string | null; // solution.mdx raw (frontmatter stripped)
  solutionMeta: Record<string, unknown> | null;
  reference: string | null; // reference.go (QA only — also shown after solve)
  hints: string[]; // up to 3 progressive hints (empty when none)
}

export interface TopicGroup {
  topic: string; // raw topic string, e.g. "Топик 1 · Каналы и select"
  num: number; // parsed topic number
  label: string; // human label after the "·"
  tasks: TaskMeta[];
}

export interface BookChapter {
  slug: string;
  title: string;
  order: number;
  minutes?: number;
  body: string; // mdx body (frontmatter stripped)
}

export interface TopicIntro {
  num: number;
  title: string;
  body: string;
  meta: Record<string, unknown>;
}

/** Simulator manifest (OS course): the engine `kind` + default parameters. */
export interface SimManifest {
  id: string;
  kind: string;
  title: string;
  explain?: string;
  defaults?: Record<string, unknown>;
}

/** Quiz definition (OS course): static questions with answers checked client-side. */
export interface Quiz {
  id: string;
  title?: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  q: string;
  type: "single" | "multi" | "number";
  options?: string[];
  answer: number | number[];
  explain?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTopicNum(topic: string): number {
  const m = topic.match(/Топик\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function topicLabel(topic: string): string {
  const parts = topic.split("·");
  return (parts[1] ?? parts[0] ?? topic).trim();
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

function listTaskDirs(courseId: string): string[] {
  const dir = tasksDir(courseId);
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => fs.statSync(path.join(dir, d)).isDirectory())
    .sort();
}

function readMeta(id: string, courseId: string): TaskMeta | null {
  const raw = safeRead(path.join(tasksDir(courseId), id, "meta.json"));
  if (!raw) return null;
  let parsed: Partial<TaskMeta>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const num = parsed.num ?? parseInt(id, 10);
  const title = parsed.title ?? `Задача ${num}`;
  const slug = parsed.slug && parsed.slug.length > 0 ? parsed.slug : slugify(title) || id;
  return {
    id: parsed.id ?? id,
    num,
    topic: parsed.topic ?? "Без топика",
    title,
    slug,
    type: parsed.type,
    difficulty: parsed.difficulty,
    tags: parsed.tags,
  };
}

/**
 * Read hints.json (a JSON array of strings) from a task dir. Robust to a
 * missing or malformed file: always returns an array, capped at 3 non-empty
 * trimmed strings.
 */
function readHints(dir: string): string[] {
  const raw = safeRead(path.join(dir, "hints.json"));
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((h): h is string => typeof h === "string")
    .map((h) => h.trim())
    .filter((h) => h.length > 0)
    .slice(0, 3);
}

const _metaCache = new Map<string, TaskMeta[]>();

export function getAllTaskMeta(courseId: string = DEFAULT_COURSE_ID): TaskMeta[] {
  const cached = _metaCache.get(courseId);
  if (cached) return cached;
  const metas = listTaskDirs(courseId)
    .map((id) => readMeta(id, courseId))
    .filter((m): m is TaskMeta => m !== null)
    .sort((a, b) => a.num - b.num);
  _metaCache.set(courseId, metas);
  return metas;
}

/** Resolve a task by slug, falling back to id/num. */
export function findTaskMeta(
  slugOrId: string,
  courseId: string = DEFAULT_COURSE_ID
): TaskMeta | null {
  const all = getAllTaskMeta(courseId);
  return (
    all.find((t) => t.slug === slugOrId) ??
    all.find((t) => t.id === slugOrId) ??
    all.find((t) => String(t.num) === slugOrId) ??
    null
  );
}

export function getTaskContent(
  slugOrId: string,
  courseId: string = DEFAULT_COURSE_ID
): TaskContent | null {
  const meta = findTaskMeta(slugOrId, courseId);
  if (!meta) return null;
  const dir = path.join(tasksDir(courseId), meta.id);

  const problemRaw =
    safeRead(path.join(dir, "problem.mdx")) ??
    safeRead(path.join(dir, "problem.md")) ??
    "";
  const problem = matter(problemRaw).content || problemRaw;

  const starter = safeRead(path.join(dir, "starter.go")) ?? "package solution\n";

  const theoryRaw = safeRead(path.join(dir, "theory.mdx"));
  const theoryParsed = theoryRaw ? matter(theoryRaw) : null;

  const solutionRaw = safeRead(path.join(dir, "solution.mdx"));
  const solutionParsed = solutionRaw ? matter(solutionRaw) : null;

  const reference = safeRead(path.join(dir, "reference.go"));

  const hints = readHints(dir);

  return {
    ...meta,
    problem,
    starter,
    theory: theoryParsed ? theoryParsed.content : null,
    theoryMeta: theoryParsed ? (theoryParsed.data as Record<string, unknown>) : null,
    solution: solutionParsed ? solutionParsed.content : null,
    solutionMeta: solutionParsed
      ? (solutionParsed.data as Record<string, unknown>)
      : null,
    reference,
    hints,
  };
}

/** Ordered neighbours for prev/next navigation. */
export function getTaskNeighbours(
  slugOrId: string,
  courseId: string = DEFAULT_COURSE_ID
): {
  prev: TaskMeta | null;
  next: TaskMeta | null;
} {
  const all = getAllTaskMeta(courseId);
  const idx = all.findIndex(
    (t) => t.slug === slugOrId || t.id === slugOrId || String(t.num) === slugOrId
  );
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export function getTopicGroups(courseId: string = DEFAULT_COURSE_ID): TopicGroup[] {
  const all = getAllTaskMeta(courseId);
  const map = new Map<string, TopicGroup>();
  for (const t of all) {
    let g = map.get(t.topic);
    if (!g) {
      g = {
        topic: t.topic,
        num: parseTopicNum(t.topic),
        label: topicLabel(t.topic),
        tasks: [],
      };
      map.set(t.topic, g);
    }
    g.tasks.push(t);
  }
  return [...map.values()].sort((a, b) => a.num - b.num);
}

export function getTopicGroup(
  num: number,
  courseId: string = DEFAULT_COURSE_ID
): TopicGroup | null {
  return getTopicGroups(courseId).find((g) => g.num === num) ?? null;
}

export function getTopicIntro(
  num: number,
  courseId: string = DEFAULT_COURSE_ID
): TopicIntro | null {
  // topics/NN.mdx (zero-padded) or topics/N.mdx
  const padded = String(num).padStart(2, "0");
  const raw =
    safeRead(path.join(topicsDir(courseId), `${padded}.mdx`)) ??
    safeRead(path.join(topicsDir(courseId), `${num}.mdx`));
  if (!raw) return null;
  const parsed = matter(raw);
  return {
    num,
    title: (parsed.data.title as string) ?? "",
    body: parsed.content,
    meta: parsed.data as Record<string, unknown>,
  };
}

// ---------------------------------------------------------------------------
// Book chapters
// ---------------------------------------------------------------------------

export function getBookChapters(courseId: string = DEFAULT_COURSE_ID): BookChapter[] {
  const dir = bookDir(courseId);
  if (!exists(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  const chapters: BookChapter[] = [];
  for (const file of files) {
    const raw = safeRead(path.join(dir, file));
    if (!raw) continue;
    const parsed = matter(raw);
    const slug = (parsed.data.slug as string) ?? file.replace(/\.mdx$/, "");
    chapters.push({
      slug,
      title: (parsed.data.title as string) ?? slug,
      order: (parsed.data.order as number) ?? 999,
      minutes: parsed.data.minutes as number | undefined,
      body: parsed.content,
    });
  }
  return chapters.sort((a, b) => a.order - b.order);
}

export function getBookChapter(
  slug: string,
  courseId: string = DEFAULT_COURSE_ID
): {
  chapter: BookChapter;
  prev: BookChapter | null;
  next: BookChapter | null;
} | null {
  const chapters = getBookChapters(courseId);
  const idx = chapters.findIndex((c) => c.slug === slug);
  if (idx === -1) return null;
  return {
    chapter: chapters[idx],
    prev: idx > 0 ? chapters[idx - 1] : null,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : null,
  };
}

// ---------------------------------------------------------------------------
// Sims & quizzes (OS course interactive blocks)
// ---------------------------------------------------------------------------

function readJson<T>(file: string): T | null {
  const raw = safeRead(file);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getSim(
  id: string,
  courseId: string = DEFAULT_COURSE_ID
): SimManifest | null {
  const sim = readJson<SimManifest>(path.join(simsDir(courseId), `${id}.json`));
  if (!sim) return null;
  return { ...sim, id: sim.id ?? id };
}

export function getAllSims(courseId: string = DEFAULT_COURSE_ID): SimManifest[] {
  const dir = simsDir(courseId);
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => getSim(f.replace(/\.json$/, ""), courseId))
    .filter((s): s is SimManifest => s !== null);
}

export function getQuiz(id: string, courseId: string = DEFAULT_COURSE_ID): Quiz | null {
  const quiz = readJson<Quiz>(path.join(quizzesDir(courseId), `${id}.json`));
  if (!quiz || !Array.isArray(quiz.questions)) return null;
  return { ...quiz, id: quiz.id ?? id };
}
