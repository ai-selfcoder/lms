import type { Metadata } from "next";
import { getBookChapters } from "@/lib/content";
import { BookIndexView } from "@/components/book/BookIndexView";

export const metadata: Metadata = {
  title: "Учебник",
  description: "Сквозные главы-основы по конкурентности Go.",
};

export default function BookIndexPage() {
  const chapters = getBookChapters().map((c) => ({
    slug: c.slug,
    title: c.title,
    minutes: c.minutes ?? null,
  }));

  return <BookIndexView chapters={chapters} />;
}
