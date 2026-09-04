import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getTopicGroup,
  getTopicGroups,
  getTopicIntro,
} from "@/lib/content";
import { Mdx } from "@/components/Mdx";
import { TopicDetailView } from "@/components/topics/TopicDetailView";

export function generateStaticParams() {
  return getTopicGroups().map((t) => ({ n: String(t.num) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const group = getTopicGroup(Number(n));
  if (!group) return { title: "Топик не найден" };
  return { title: group.label };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const num = Number(n);
  const group = getTopicGroup(num);
  if (!group) notFound();
  const intro = getTopicIntro(num);

  const groups = getTopicGroups();
  const idx = groups.findIndex((g) => g.num === num);
  const prev = idx > 0 ? groups[idx - 1] : null;
  const next = idx < groups.length - 1 ? groups[idx + 1] : null;

  return (
    <TopicDetailView
      num={group.num}
      label={group.label}
      tasks={group.tasks}
      hasIntro={Boolean(intro)}
      prev={prev ? { num: prev.num, label: prev.label } : null}
      next={next ? { num: next.num, label: next.label } : null}
    >
      {intro ? <Mdx source={intro.body} /> : null}
    </TopicDetailView>
  );
}
