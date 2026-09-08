import type { Metadata } from "next";
import { getTopicGroups } from "@/lib/content";
import { SkillGraphView } from "@/components/skills/SkillGraphView";

export const metadata: Metadata = {
  title: "Карта навыков Go и конкурентности",
  description: "Связанные навыки конкурентности Go с прогрессом и следующими шагами.",
};

export default function SkillsPage() {
  const skills = getTopicGroups("go").map((topic) => ({
    num: topic.num,
    label: topic.label,
    taskIds: topic.tasks.map((task) => task.id),
  }));
  return <SkillGraphView skills={skills} />;
}
