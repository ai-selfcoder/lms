import type { Metadata } from "next";
import { getAllTaskMeta, getTopicGroups, getBookChapters } from "@/lib/content";
import LandingView from "@/components/landing/LandingView";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Курс по конкурентности Go (Golang): горутины, каналы, sync, context",
  description:
    "Бесплатный интерактивный курс и тренажёр по конкурентности в Go (Golang): горутины, каналы, select, sync, atomic, context, паттерны, гонки и утечки. Каждая глава — с задачей и прогоном через go test -race в песочнице. Подготовка к собеседованию по Go.",
  keywords: [
    "курс по Go",
    "курс по Golang",
    "конкурентность Go",
    "горутины",
    "каналы Go",
    "sync",
    "context Go",
    "go test -race",
    "тренажёр по Go",
    "задачи по Go",
    "подготовка к собеседованию Go",
  ],
  alternates: { canonical: "/go" },
  openGraph: {
    title: "Курс по конкурентности Go (Golang) — учебник и тренажёр",
    description:
      "Горутины, каналы, sync, context и паттерны конкурентности. Теория + задачи с автопроверкой через go test -race. Бесплатно.",
    url: "/go",
    type: "website",
  },
};

export default function LandingPage() {
  const tasks = getAllTaskMeta();
  const topics = getTopicGroups();
  const chapters = getBookChapters();

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Конкурентность Go (Golang)",
    description:
      "Интерактивный курс и тренажёр по конкурентности в Go: горутины, каналы, select, sync, atomic, context, паттерны, гонки и утечки. С задачами и автопроверкой через go test -race.",
    url: absUrl("/go"),
    inLanguage: "ru-RU",
    isAccessibleForFree: true,
    teaches: ["горутины", "каналы", "select", "sync", "atomic", "context", "паттерны конкурентности"],
    provider: { "@type": "EducationalOrganization", name: "GraphLMS", url: `${SITE_URL}/` },
  };

  return (
    <>
    <JsonLd data={courseLd} />
    <LandingView
      taskCount={tasks.length}
      chapterCount={chapters.length}
      firstTaskSlug={tasks[0]?.slug ?? null}
      topics={topics.map((t) => {
        const diff = { e: 0, m: 0, h: 0 };
        for (const task of t.tasks) {
          if (task.difficulty === "easy") diff.e += 1;
          else if (task.difficulty === "hard") diff.h += 1;
          else diff.m += 1;
        }
        return {
          num: t.num,
          label: t.label,
          taskCount: t.tasks.length,
          taskIds: t.tasks.map((x) => x.id),
          diff,
          isReview: t.tasks.some((x) => x.type === "review" || x.type === "code-review"),
        };
      })}
      chapters={chapters.map((c) => ({ slug: c.slug, title: c.title, order: c.order }))}
    />
    </>
  );
}
