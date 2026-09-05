import type { Metadata } from "next";
import { getTopicGroups, getAllTaskMeta } from "@/lib/content";
import { TopicsIndexView } from "@/components/topics/TopicsIndexView";

export const metadata: Metadata = {
  title: "Практика по конкурентности Go",
  description: "Задачи по конкурентности Go: каналы, select, sync, context и паттерны.",
  alternates: { canonical: "/go/practice" },
};

/** Canonical practice catalog. `/go/topics` remains as a compatibility alias. */
export default function PracticePage() {
  const topics = getTopicGroups().map((topic) => ({
    num: topic.num,
    label: topic.label,
    tasks: topic.tasks,
  }));

  return <TopicsIndexView topics={topics} total={getAllTaskMeta().length} />;
}
