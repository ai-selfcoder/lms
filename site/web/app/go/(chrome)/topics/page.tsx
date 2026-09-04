import type { Metadata } from "next";
import { getTopicGroups, getAllTaskMeta } from "@/lib/content";
import { TopicsIndexView } from "@/components/topics/TopicsIndexView";

export const metadata: Metadata = {
  title: "Топики",
  description: "7 топиков по конкурентности Go с задачами и статусом решения.",
};

export default function TopicsPage() {
  const topics = getTopicGroups().map((t) => ({
    num: t.num,
    label: t.label,
    tasks: t.tasks,
  }));
  const total = getAllTaskMeta().length;

  return <TopicsIndexView topics={topics} total={total} />;
}
