import { getAllSims, getAllTaskMeta, getBookChapters, type TaskMeta } from "./content";
import { getCourse, getCourses } from "./courses";

export type LearningItemKind = "chapter" | "task" | "lab";

export interface LearningItem {
  id: string;
  kind: LearningItemKind;
  courseId: string;
  title: string;
  href: string;
  prerequisites: string[];
  relatedSkills: string[];
  previousId?: string;
  nextId?: string;
  relatedTheoryId?: string;
  relatedPracticeId?: string;
  /** Labs that turn the current chapter into a controlled experiment. */
  relatedLabIds?: string[];
}

export interface LearningLink {
  id: string;
  title: string;
  href: string;
}

function taskSkills(task: TaskMeta): string[] {
  return [...new Set([...(task.tags ?? []), task.topic.split("·").pop()?.trim() ?? ""])].filter(Boolean);
}

/**
 * The canonical cross-content model. It is derived from the existing content
 * tree so authors only maintain task/chapter metadata, not a second catalogue.
 */
export function getLearningItems(courseId: string): LearningItem[] {
  const course = getCourse(courseId);
  if (!course) return [];
  const chapters = getBookChapters(course.id).sort((a, b) => a.order - b.order);
  const tasks = getAllTaskMeta(course.id);
  const labs = getAllSims(course.id);
  const items: LearningItem[] = [];

  chapters.forEach((chapter, index) => {
    const id = `${course.id}:chapter:${chapter.slug}`;
    items.push({
      id,
      kind: "chapter",
      courseId: course.id,
      title: chapter.title,
      href: `/${course.slug}/book/${chapter.slug}`,
      prerequisites: index > 0 ? [`${course.id}:chapter:${chapters[index - 1].slug}`] : [],
      relatedSkills: [course.id === "os" ? "operating-systems" : "go"],
      previousId: index > 0 ? `${course.id}:chapter:${chapters[index - 1].slug}` : undefined,
      nextId: index < chapters.length - 1 ? `${course.id}:chapter:${chapters[index + 1].slug}` : undefined,
      relatedLabIds: labs
        .filter((lab) => lab.chapterSlug === chapter.slug)
        .map((lab) => `${course.id}:lab:${lab.id}`),
    });
  });

  tasks.forEach((task, index) => {
    const id = `${course.id}:task:${task.id}`;
    const previous = tasks[index - 1];
    const next = tasks[index + 1];
    const theory = chapters.find((chapter) => chapter.order === task.num) ?? chapters[index % Math.max(1, chapters.length)];
    items.push({
      id,
      kind: "task",
      courseId: course.id,
      title: task.title,
      href: `/${course.slug}/tasks/${task.slug}`,
      prerequisites: previous ? [`${course.id}:task:${previous.id}`] : [],
      relatedSkills: taskSkills(task),
      previousId: previous ? `${course.id}:task:${previous.id}` : undefined,
      nextId: next ? `${course.id}:task:${next.id}` : undefined,
      relatedPracticeId: id,
      relatedTheoryId: theory ? `${course.id}:chapter:${theory.slug}` : undefined,
    });
  });

  labs.forEach((lab) => {
    const theory = lab.chapterSlug
      ? chapters.find((chapter) => chapter.slug === lab.chapterSlug)
      : undefined;
    const relatedTheoryId = theory
      ? `${course.id}:chapter:${theory.slug}`
      : undefined;
    items.push({
      id: `${course.id}:lab:${lab.id}`,
      kind: "lab",
      courseId: course.id,
      title: lab.title,
      href: `/${course.slug}/sim/${lab.id}`,
      prerequisites: relatedTheoryId ? [relatedTheoryId] : [],
      relatedSkills: [lab.kind],
      relatedTheoryId,
    });
  });
  return items;
}

export function getLearningItem(id: string): LearningItem | null {
  const match = id.match(/^([^:]+):(chapter|task|lab):(.+)$/);
  if (!match) return null;
  return getLearningItems(match[1]).find((item) => item.id === id) ?? null;
}

/** Serializable links for the task workspace; missing relations are omitted. */
export function getTaskLearningContext(id: string): {
  prerequisites: LearningLink[];
  theory?: LearningLink;
  next?: LearningLink;
  similar?: LearningLink;
} | null {
  const item = getLearningItem(id);
  if (!item) return null;
  const similar = item.kind === "task"
    ? getLearningItems(item.courseId)
      .filter((candidate) => candidate.kind === "task" && candidate.id !== item.id)
      .map((candidate, index) => ({
        candidate,
        index,
        score: candidate.relatedSkills.filter((skill) => item.relatedSkills.includes(skill)).length,
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.candidate
    : undefined;
  const link = (itemId?: string): LearningLink | undefined => {
    if (!itemId) return undefined;
    const related = getLearningItem(itemId);
    return related ? { id: related.id, title: related.title, href: related.href } : undefined;
  };
  return {
    prerequisites: item.prerequisites.map((itemId) => link(itemId)).filter((value): value is LearningLink => Boolean(value)),
    theory: link(item.relatedTheoryId),
    next: link(item.nextId),
    similar: similar ? { id: similar.id, title: similar.title, href: similar.href } : undefined,
  };
}

export function getCourseStartItem(courseId: string): LearningItem | null {
  const items = getLearningItems(courseId);
  return items.find((item) => item.kind === "chapter") ?? items[0] ?? null;
}

export function getCourseCatalogItems(): LearningItem[] {
  return getCourses().flatMap((course) => getLearningItems(course.id));
}
