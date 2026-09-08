import type { Metadata } from "next";
import { getAllTaskMeta, getTopicGroups } from "@/lib/content";
import { getCourses } from "@/lib/courses";
import { ReportView } from "@/components/account/ReportView";

export const metadata: Metadata = {
  title: "Skill report — GraphLMS",
  description: "Публичный отчёт о практике GraphLMS без исходного кода решений.",
};

export default function AccountReportPage() {
  const courses = getCourses().map((course) => ({
    id: course.id,
    title: course.title,
    short: course.short,
    tasks: getAllTaskMeta(course.id).map((task) => ({
      id: task.id,
      courseId: course.id,
      num: task.num,
      title: task.title,
      slug: task.slug,
      difficulty: task.difficulty,
    })),
    topics: getTopicGroups(course.id).map((topic) => ({
      courseId: course.id,
      num: topic.num,
      label: topic.label,
      taskIds: topic.tasks.map((task) => task.id),
    })),
  }));
  return <ReportView courses={courses} />;
}
