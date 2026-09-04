import type { Metadata } from "next";
import { getBookChapters } from "@/lib/content";
import { BookIndexView } from "@/components/book/BookIndexView";

const COURSE = "go-basics";

export const metadata: Metadata = {
  title: "Основы Go",
  description: "Go с нуля для джунов: синтаксис, типы, структуры, интерфейсы, ошибки и горутины.",
};

export default function GoBasicsBookIndexPage() {
  const chapters = getBookChapters(COURSE).map((c) => ({
    slug: c.slug,
    title: c.title,
    minutes: c.minutes ?? null,
  }));

  return (
    <BookIndexView
      chapters={chapters}
      basePath="/go-basics/book"
      title="Основы Go"
      description="Go с нуля для джунов: синтаксис, типы, структуры, интерфейсы, ошибки и первое знакомство с горутинами. С интерактивными примерами прямо в браузере."
      emptyHref="/go-basics"
      emptyLabel="страницу курса"
    />
  );
}
