import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllTaskMeta,
  getTaskContent,
  getTaskNeighbours,
  getTopicGroups,
} from "@/lib/content";
import { Mdx } from "@/components/Mdx";
import { TaskWorkspace } from "@/components/task/TaskWorkspace";
import type { Difficulty, NavTask, NavTopic } from "@/components/task/types";

const COURSE = "os";

function normDifficulty(d?: string): Difficulty {
  return d === "easy" || d === "hard" ? d : "medium";
}

export function generateStaticParams() {
  return getAllTaskMeta(COURSE).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const task = getTaskContent(slug, COURSE);
  if (!task) return { title: "Задача не найдена" };
  return {
    title: `${task.title} — задача ${task.num} (ОС)`,
    description: `Задача по операционным системам: ${task.title}.`,
  };
}

export default async function OsTaskPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const task = getTaskContent(slug, COURSE);
  if (!task) notFound();

  const { prev, next } = getTaskNeighbours(slug, COURSE);

  const nav: NavTopic[] = getTopicGroups(COURSE).map((g) => ({
    num: g.num,
    label: g.label,
    tasks: g.tasks.map(
      (t): NavTask => ({
        id: t.id,
        num: t.num,
        title: t.title,
        slug: t.slug,
        type: t.type,
        difficulty: normDifficulty(t.difficulty),
      })
    ),
  }));

  const problemNode = <Mdx source={task.problem} />;
  const theoryNode = task.theory ? <Mdx source={task.theory} /> : null;
  const solutionNode = task.solution ? <Mdx source={task.solution} /> : null;

  const referenceNode =
    !solutionNode && task.reference ? (
      <div className="mdx">
        <p>Подробного разбора пока нет — вот эталонная реализация:</p>
        <Mdx source={"```go\n" + task.reference + "\n```"} />
      </div>
    ) : null;

  return (
    <TaskWorkspace
      course={COURSE}
      task={{
        id: task.id,
        num: task.num,
        title: task.title,
        slug: task.slug,
        topic: task.topic,
        type: task.type,
        starter: task.starter,
      }}
      nav={nav}
      prev={prev ? { slug: prev.slug, title: prev.title, num: prev.num } : null}
      next={next ? { slug: next.slug, title: next.title, num: next.num } : null}
      problemNode={problemNode}
      theoryNode={theoryNode}
      solutionNode={solutionNode ?? referenceNode}
      hasSolution={Boolean(solutionNode || referenceNode)}
      hints={task.hints}
    />
  );
}
