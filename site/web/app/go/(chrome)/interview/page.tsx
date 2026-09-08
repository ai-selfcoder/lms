import type { Metadata } from "next";
import { getAllTaskMeta } from "@/lib/content";
import { InterviewView } from "@/components/interview/InterviewView";

export const metadata: Metadata = {
  title: "Режим интервью — GraphLMS",
  description: "Ограниченная по времени практика по конкурентности Go с разбором результата.",
};

export default function InterviewPage() {
  const tasks = getAllTaskMeta("go").map((task) => ({ id: task.id, num: task.num, title: task.title, slug: task.slug, difficulty: task.difficulty, tags: task.tags }));
  return <InterviewView tasks={tasks} />;
}
