import type { Metadata } from "next";
import { getCourses } from "@/lib/courses";
import { getAllTaskMeta, getBookChapters, getTopicGroups } from "@/lib/content";
import LandingView from "@/components/landing/LandingView";

export const metadata: Metadata = {
  title: "GraphLMS — решай задачи, за которые платят больше",
  description: "Инженерная лаборатория для роста дохода: Go, конкурентность и ОС через реальные задачи, исполняемый код и доказательства навыка.",
  keywords: ["курсы по Go", "курсы по Golang", "учебник по Go", "Go с нуля", "конкурентность Go", "тренажёр по Go", "задачи по программированию", "операционные системы курс", "бесплатные курсы программирования онлайн"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "GraphLMS — решай задачи, за которые платят больше",
    description: "Реальные инженерные задачи, исполняемый код и доказательства навыка для следующего карьерного шага.",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  const goTasks = getAllTaskMeta("go");
  const goTopics = getTopicGroups("go");
  const goChapters = getBookChapters("go");
  const courseCatalog = getCourses().map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    short: course.short,
    description: course.description,
    accent: course.accent,
    chapters: getBookChapters(course.id).length,
    tasks: getAllTaskMeta(course.id).length,
    href: course.id === "go" ? "/go/tasks/01" : course.id === "os" ? `/os/book/${getBookChapters(course.id)[0]?.slug ?? "process"}` : `/${course.slug}/book`,
  }));

  return (
    <LandingView
      taskCount={goTasks.length}
      chapterCount={goChapters.length}
      firstTaskSlug={goTasks[0]?.slug ?? null}
      courses={courseCatalog}
      topics={goTopics.map((topic) => {
        const diff = { e: 0, m: 0, h: 0 };
        for (const task of topic.tasks) {
          if (task.difficulty === "easy") diff.e += 1;
          else if (task.difficulty === "hard") diff.h += 1;
          else diff.m += 1;
        }
        return {
          num: topic.num,
          label: topic.label,
          taskCount: topic.tasks.length,
          taskIds: topic.tasks.map((task) => task.id),
          diff,
          isReview: topic.tasks.some((task) => task.type === "review" || task.type === "code-review"),
        };
      })}
      chapters={goChapters.map((chapter) => ({ slug: chapter.slug, title: chapter.title, order: chapter.order }))}
    />
  );
}
