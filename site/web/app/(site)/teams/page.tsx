import type { Metadata } from "next";
import { getAllTaskMeta } from "@/lib/content";
import { TeamsView } from "@/components/teams/TeamsView";

export const metadata: Metadata = { title: "Команды — GraphLMS", description: "Приватные треки и агрегированный отчёт о навыках команды." };

export default function TeamsPage() {
  const taskOptions = ["go-basics", "go", "os"].flatMap((courseId) => getAllTaskMeta(courseId).map((task) => ({ id: `${courseId}:${task.id}`, title: `${courseId} · ${task.title}` })));
  return <TeamsView taskOptions={taskOptions} />;
}
