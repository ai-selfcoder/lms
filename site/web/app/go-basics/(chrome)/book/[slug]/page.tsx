import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBookChapter, getBookChapters } from "@/lib/content";
import { Mdx } from "@/components/Mdx";
import { extractToc } from "@/lib/toc";
import { BookChapterView } from "@/components/book/BookChapterView";

const COURSE = "go-basics";

export function generateStaticParams() {
  return getBookChapters(COURSE).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getBookChapter(slug, COURSE);
  if (!data) return { title: "Глава не найдена" };
  return { title: `${data.chapter.title} — Основы Go` };
}

export default async function GoBasicsChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getBookChapter(slug, COURSE);
  if (!data) notFound();
  const { chapter, prev, next } = data;
  const toc = extractToc(chapter.body).map((t) => ({
    slug: t.slug,
    text: t.text,
    depth: t.depth,
  }));
  const all = getBookChapters(COURSE).map((c, i) => ({
    slug: c.slug,
    title: c.title,
    index: i + 1,
  }));

  return (
    <BookChapterView
      slug={chapter.slug}
      title={chapter.title}
      order={chapter.order}
      minutes={chapter.minutes ?? null}
      toc={toc}
      chapters={all}
      prev={prev ? { slug: prev.slug, title: prev.title } : null}
      next={next ? { slug: next.slug, title: next.title } : null}
      basePath="/go-basics/book"
    >
      <Mdx source={chapter.body} />
    </BookChapterView>
  );
}
