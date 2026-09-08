import type { Metadata } from "next";
import { getTopicGroups, getAllTaskMeta, getBookChapters, getAllSims } from "@/lib/content";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description:
    "Твой прогресс по конкурентности Go: решённые задачи, активность и прогресс по топикам. Всё хранится локально в браузере.",
};

export default function AccountPage() {
  const topics = getTopicGroups().map((t) => ({
    num: t.num,
    label: t.label,
    taskIds: t.tasks.map((task) => task.id),
  }));

  const tasks = getAllTaskMeta().map((t) => ({
    id: t.id,
    num: t.num,
    title: t.title,
    slug: t.slug,
    difficulty: t.difficulty,
  }));

  const goChapters = getBookChapters("go");
  const firstChapter = goChapters[0];
  const firstTask = getAllTaskMeta("go")[0];
  const lab = getAllSims("os").find((sim) => sim.id === "rr") ?? getAllSims("os")[0];
  const sprintItems = [
    firstChapter && {
      id: `go:chapter:${firstChapter.slug}`,
      kind: "chapter" as const,
      title: firstChapter.title,
      href: `/go/book/${firstChapter.slug}`,
      statusId: `go:chapter:${firstChapter.slug}`,
      label: "Глава Go",
      alternatives: goChapters.slice(1).map((chapter) => ({
        id: `go:chapter:${chapter.slug}`,
        kind: "chapter" as const,
        title: chapter.title,
        href: `/go/book/${chapter.slug}`,
        statusId: `go:chapter:${chapter.slug}`,
        label: "Глава Go",
      })),
    },
    lab && {
      id: `os:lab:${lab.id}`,
      kind: "lab" as const,
      title: lab.title,
      href: `/os/sim/${lab.id}`,
      statusId: `os:lab:${lab.id}`,
      label: "Эксперимент ОС",
    },
    firstTask && {
      id: `go:task:${firstTask.id}`,
      kind: "task" as const,
      title: firstTask.title,
      href: `/go/tasks/${firstTask.slug}`,
      statusId: firstTask.id,
      label: "Задача",
    },
  ].filter(Boolean);

  return <AccountView topics={topics} tasks={tasks} total={tasks.length} sprintItems={sprintItems} />;
}
