import { getAllSims, getAllTaskMeta, getBookChapters, getTaskContent } from "@/lib/content";
import { getCourses } from "@/lib/courses";

export interface ContentHealthTask {
  kind?: "task" | "chapter" | "lab";
  courseId: string;
  taskId: string;
  title: string;
  href: string;
  missing: string[];
}

export interface ContentHealthReport {
  tasks: number;
  withTheory: number;
  withSolution: number;
  withHints: number;
  withEditorial: number;
  withNextStep: number;
  nextStepMissing: number;
  linksChecked: number;
  brokenLinks: number;
  needsAttention: number;
  attention: ContentHealthTask[];
  linkIssues: Array<ContentHealthTask & { broken: string[] }>;
  /** Lightweight task lookup for joining anonymous API quality signals to content. */
  catalog: ContentHealthTask[];
}

/** Build a small editorial report from the same content source as the pages. */
export function getContentHealth(): ContentHealthReport {
  const report: ContentHealthReport = {
    tasks: 0,
    withTheory: 0,
    withSolution: 0,
    withHints: 0,
    withEditorial: 0,
    withNextStep: 0,
    nextStepMissing: 0,
    linksChecked: 0,
    brokenLinks: 0,
    needsAttention: 0,
    attention: [],
    linkIssues: [],
    catalog: [],
  };

  const routes = new Set<string>([
    "/", "/account", "/account/report", "/auth", "/projects", "/teams", "/changelog",
    "/go", "/go/book", "/go/practice", "/go/skills", "/go/interview", "/go/topics",
    "/os", "/os/book", "/os/labs",
  ]);
  const routeAliases = (href: string) => {
    const clean = href.replace(/[?#].*$/, "").replace(/\/$/, "") || "/";
    if (clean === "/book") return "/go/book";
    if (clean.startsWith("/book/")) return `/go${clean}`;
    if (clean === "/topics") return "/go/topics";
    if (clean.startsWith("/topics/")) return `/go${clean}`;
    if (clean.startsWith("/tasks/")) return `/go${clean}`;
    return clean;
  };
  const add = (href: string) => routes.add(routeAliases(href));
  const addCourseRoutes = (course: ReturnType<typeof getCourses>[number]) => {
    const chapters = getBookChapters(course.id);
    add(`/${course.slug}`);
    add(`/${course.slug}/book`);
    for (const chapter of chapters) add(`/${course.slug}/book/${chapter.slug}`);
    for (const task of getAllTaskMeta(course.id)) {
      add(`/${course.slug}/tasks/${task.slug}`);
      add(`/${course.slug}/tasks/${task.id}`);
      add(`/${course.slug}/tasks/${task.num}`);
    }
    for (const sim of getAllSims(course.id)) add(`/${course.slug}/sim/${sim.id}`);
    if (course.id === "go") {
      for (const chapter of chapters) add(`/book/${chapter.slug}`);
      for (const task of getAllTaskMeta(course.id)) add(`/tasks/${task.slug}`);
      for (const n of new Set(getAllTaskMeta(course.id).map((task) => task.topic.match(/Топик\s+(\d+)/i)?.[1]).filter(Boolean))) add(`/topics/${n}`);
    }
    if (course.id === "os") {
      for (const sim of getAllSims(course.id)) add(`/os/sim/${sim.id}`);
    }
  };
  for (const course of getCourses()) addCourseRoutes(course);

  const internalLinks = (source: string): string[] => {
    const links: string[] = [];
    for (const match of source.matchAll(/\]\(\s*(\/[^)#?\s]+)(?:[?#][^)]*)?\s*\)/g)) links.push(match[1]);
    return links;
  };
  const inspectLinks = (entry: ContentHealthTask, sources: string[]) => {
    const broken: string[] = [];
    for (const source of sources) {
      for (const href of internalLinks(source)) {
        report.linksChecked += 1;
        if (!routes.has(routeAliases(href))) broken.push(href);
      }
    }
    if (broken.length > 0) {
      report.brokenLinks += broken.length;
      const issue = { ...entry, missing: [...entry.missing, "битые ссылки"], broken };
      report.linkIssues.push(issue);
      if (report.attention.length < 12) report.attention.push(issue);
      report.needsAttention += 1;
    }
  };

  for (const course of getCourses()) {
    const chapters = getBookChapters(course.id);
    const tasks = getAllTaskMeta(course.id);
    const sims = getAllSims(course.id);
    for (const [index, chapter] of chapters.entries()) {
      const hasNextStep = Boolean(
        chapters[index + 1] ||
        sims.some((sim) => sim.chapterSlug === chapter.slug) ||
        (course.id === "go" && tasks.some((task) => task.num === chapter.order)),
      );
      const entry: ContentHealthTask = {
        kind: "chapter",
        courseId: course.id,
        taskId: `chapter:${chapter.slug}`,
        title: chapter.title,
        href: `/${course.slug}/book/${chapter.slug}`,
        missing: hasNextStep ? [] : ["следующий шаг"],
      };
      if (hasNextStep) report.withNextStep += 1;
      else {
        report.nextStepMissing += 1;
        report.needsAttention += 1;
        if (report.attention.length < 12) report.attention.push(entry);
      }
      inspectLinks(entry, [chapter.body]);
    }

    for (const meta of tasks) {
      const task = getTaskContent(meta.id, course.id);
      if (!task) continue;
      report.tasks += 1;
      if (task.theory) report.withTheory += 1;
      if (task.solution || task.reference) report.withSolution += 1;
      if (task.hints.length > 0) report.withHints += 1;
      if (task.editorial) report.withEditorial += 1;

      const missing: string[] = [];
      if (!task.theory) missing.push("теория");
      if (!task.solution && !task.reference) missing.push("решение");
      if (task.hints.length === 0) missing.push("подсказки");
      if (!task.editorial) missing.push("editorial");
      const entry: ContentHealthTask = {
        kind: "task",
        courseId: course.id,
        taskId: task.id,
        title: task.title,
        href: `/${course.slug}/tasks/${task.slug}`,
        missing,
      };
      report.catalog.push(entry);
      if (missing.length > 0) {
        report.needsAttention += 1;
        if (report.attention.length < 12) report.attention.push(entry);
      }
      const hasNextStep = Boolean(tasks.find((candidate) => candidate.num > task.num) || task.theory);
      if (hasNextStep) report.withNextStep += 1;
      else {
        report.nextStepMissing += 1;
        report.needsAttention += 1;
        entry.missing.push("следующий шаг");
        if (report.attention.length < 12) report.attention.push(entry);
      }
      inspectLinks(entry, [task.problem, task.theory ?? "", task.solution ?? "", task.editorial ?? ""]);
    }

    for (const sim of sims) {
      const entry: ContentHealthTask = {
        kind: "lab",
        courseId: course.id,
        taskId: `lab:${sim.id}`,
        title: sim.title,
        href: `/${course.slug}/sim/${sim.id}`,
        missing: sim.chapterSlug && chapters.some((chapter) => chapter.slug === sim.chapterSlug) ? [] : ["глава-связка"],
      };
      const hasNextStep = Boolean(entry.missing.length === 0);
      if (hasNextStep) report.withNextStep += 1;
      else {
        report.nextStepMissing += 1;
        report.needsAttention += 1;
        if (report.attention.length < 12) report.attention.push(entry);
      }
    }
  }

  return report;
}
