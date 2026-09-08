"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Badge, Callout } from "@/ds";
import { apiRequest, AuthError, useAuth } from "@/lib/auth";

type Severity = "critical" | "major" | "minor" | "info";
type Category =
  | "race"
  | "leak"
  | "deadlock"
  | "correctness"
  | "idiom"
  | "performance"
  | "style";

interface Finding {
  title: string;
  lineNumber: number;
  severity: Severity;
  category: Category;
  explanation: string;
  suggestion: string;
}

interface Review {
  verdict: "solid" | "minor-issues" | "has-bugs";
  summary: string;
  findings: Finding[];
  idiomatic: string[];
  followups: string[];
  model: string;
  usage: { input: number; output: number };
}

const VERDICT_META: Record<
  Review["verdict"],
  { label: string; tone: "pass" | "timeout" | "fail" }
> = {
  solid: { label: "Solid", tone: "pass" },
  "minor-issues": { label: "Есть замечания", tone: "timeout" },
  "has-bugs": { label: "Есть баги", tone: "fail" },
};

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  info: 3,
};

function calloutTone(sev: Severity): "danger" | "warning" | "note" {
  if (sev === "critical" || sev === "major") return "danger";
  if (sev === "minor") return "warning";
  return "note";
}

const monoTag = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--label-xs)",
  color: "var(--text-tertiary)",
  letterSpacing: "0.03em",
} as const;

function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="2.4"
        opacity="0.3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontSize: "var(--label-md)",
          fontWeight: "var(--fw-semibold)",
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              fontSize: "var(--body-sm)",
              lineHeight: "20px",
              color: "var(--text-secondary)",
            }}
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MentorPanel({
  taskId,
  code,
  title,
  type,
  testOutput,
}: {
  taskId: string;
  code: string;
  title?: string;
  type?: string;
  testOutput?: string;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let alive = true;
    apiRequest<{ configured?: boolean }>("/mentor/status")
      .then((d) => {
        if (alive) setConfigured(Boolean(d?.configured));
      })
      .catch(() => {
        if (alive) setConfigured(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Drop a stale review when the user navigates to another task.
  useEffect(() => {
    setReview(null);
    setError(null);
  }, [taskId]);

  const review_ = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setReview(null);
    try {
      const data = await apiRequest<Review>("/mentor/review", {
        method: "POST",
        body: JSON.stringify({ taskId, code, title, type, testOutput }),
      }, true);
      setReview(data);
    } catch (err) {
      setError(err instanceof AuthError && err.status === 401 ? "Войди в аккаунт, чтобы запросить review." : err instanceof Error ? err.message : "Не удалось связаться с AI-ментором. Проверь соединение.");
    } finally {
      setLoading(false);
    }
  }, [loading, taskId, code, title, type, testOutput]);

  if (configured !== true) return null;

  const hasCode = code.trim().length > 0;
  const verdict = review ? VERDICT_META[review.verdict] : null;
  const findings = review
    ? [...review.findings].sort(
        (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      )
    : [];

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border-default)",
        background: "var(--bg-surface)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
      >
        <span
          style={{
            fontSize: "var(--label-md)",
            fontWeight: "var(--fw-semibold)",
            color: "var(--text-secondary)",
          }}
        >
          AI-ментор
        </span>
        {user ? <Button
          hierarchy="secondary"
          size="sm"
          onClick={review_}
          disabled={!hasCode || loading}
          loading={loading}
        >
          {loading ? "Разбираю решение…" : "Разбери мой код"}
        </Button> : !authLoading && <Link href={`/auth?next=${encodeURIComponent(typeof window === "undefined" ? "/go/practice" : window.location.pathname)}`} style={{ color: "var(--accent-text)", fontSize: "var(--label-sm)", textDecoration: "none" }}>Войти для review</Link>}
        {loading && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              color: "var(--text-tertiary)",
              fontSize: "var(--label-sm)",
            }}
          >
            <Spinner />
            Разбираю решение…
          </span>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 12 }}>
          <Callout tone="danger" title="AI-ментор недоступен">
            {error}
          </Callout>
        </div>
      )}

      {review && verdict && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}
          >
            <Badge variant="status" tone={verdict.tone} dot size="sm">
              {verdict.label}
            </Badge>
            <span
              style={{
                fontSize: "var(--body-sm)",
                lineHeight: "20px",
                color: "var(--text-secondary)",
              }}
            >
              {review.summary}
            </span>
          </div>

          {findings.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 12,
              }}
            >
              {findings.map((f, i) => (
                <Callout key={i} tone={calloutTone(f.severity)} title={f.title}>
                  <div style={{ ...monoTag, marginBottom: 6 }}>
                    строка {f.lineNumber} · {f.category} · {f.severity}
                  </div>
                  <div style={{ marginBottom: 6 }}>{f.explanation}</div>
                  <div style={{ color: "var(--text-primary)" }}>
                    <span style={{ fontWeight: "var(--fw-semibold)" }}>
                      Как исправить:{" "}
                    </span>
                    {f.suggestion}
                  </div>
                </Callout>
              ))}
            </div>
          )}

          <BulletList title="Идиоматичность" items={review.idiomatic} />
          <BulletList title="Спросит интервьюер" items={review.followups} />

          <div style={{ ...monoTag, marginTop: 14 }}>
            {review.model} · {review.usage.input}→{review.usage.output} ток.
          </div>
        </div>
      )}
    </div>
  );
}
