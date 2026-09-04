import type { Metadata } from "next";
import { getTopicGroups, getAllTaskMeta } from "@/lib/content";
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

  return <AccountView topics={topics} tasks={tasks} total={tasks.length} />;
}
