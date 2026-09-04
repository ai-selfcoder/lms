"use client";

import Link from "next/link";
import { useState } from "react";
import type { TaskMeta } from "@/lib/content";
import { TaskCard } from "@/components/TaskCard";
import { TopicProgress } from "@/components/TopicProgress";
import { ProgressStat } from "@/components/ProgressStat";

interface TopicItem {
  num: number;
  label: string;
  tasks: TaskMeta[];
}

export function TopicsIndexView({
  topics,
  total,
}: {
  topics: TopicItem[];
  total: number;
}) {
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "56px 28px 80px" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--label-sm)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--accent-text)",
        }}
      >
        Топики · {total} задач
      </span>
      <h1
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--fw-bold)",
          fontSize: "var(--heading-xl)",
          lineHeight: "var(--heading-xl-lh)",
          letterSpacing: "var(--heading-xl-ls)",
          color: "var(--text-primary)",
          margin: "14px 0 12px",
        }}
      >
        Тренажёр
      </h1>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--body-lg)",
          lineHeight: "var(--body-lg-lh)",
          color: "var(--text-secondary)",
          maxWidth: 620,
          margin: "0 0 28px",
        }}
      >
        {topics.length} топиков, {total} задач. Решай по порядку или ныряй в
        нужную тему. читай → решай → прогоняй → разбирай.
      </p>

      <div
        style={{
          padding: "16px 18px",
          background: "var(--bg-elevated)",
          border: "var(--border-width) solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          marginBottom: 48,
        }}
      >
        <ProgressStat total={total} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
        {topics.map((t) => (
          <TopicSection key={t.num} topic={t} />
        ))}
      </div>
    </div>
  );
}

function TopicSection({ topic }: { topic: TopicItem }) {
  const [hover, setHover] = useState(false);
  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <Link
          href={`/go/topics/${topic.num}`}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--text-tertiary)",
            textDecoration: "none",
          }}
        >
          Топик {String(topic.num).padStart(2, "0")}
        </Link>
        <Link
          href={`/go/topics/${topic.num}`}
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: "var(--fw-semibold)",
            fontSize: "var(--heading-sm)",
            lineHeight: "var(--heading-sm-lh)",
            letterSpacing: "var(--heading-sm-ls)",
            color: "var(--text-primary)",
            textDecoration: "none",
          }}
        >
          {topic.label}
        </Link>
        <TopicProgress tasks={topic.tasks} />
        <Link
          href={`/go/topics/${topic.num}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--label-md)",
            fontWeight: "var(--fw-medium)",
            color: "var(--accent-text)",
            textDecoration: hover ? "underline" : "none",
            textUnderlineOffset: 2,
          }}
        >
          Подробнее →
        </Link>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 10,
        }}
      >
        {topic.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
