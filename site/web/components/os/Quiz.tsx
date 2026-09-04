"use client";

import { useMemo, useState } from "react";
import { isCorrect, type QuizResponse } from "@/lib/os/quiz";
import type { Quiz as QuizData, QuizQuestion } from "@/lib/content";

/**
 * Self-check quiz. Pure client: answers and explanations ship in the JSON, and
 * correctness is decided locally by `isCorrect` (no backend). Supports single
 * choice, multiple choice and numeric answers.
 */
export function Quiz({ quiz }: { quiz: QuizData }) {
  const [responses, setResponses] = useState<Record<number, QuizResponse>>({});
  const [checked, setChecked] = useState(false);

  const score = useMemo(
    () =>
      quiz.questions.reduce(
        (n, q, i) => n + (isCorrect(q, responses[i] ?? null) ? 1 : 0),
        0
      ),
    [quiz.questions, responses]
  );

  const set = (qi: number, r: QuizResponse) => {
    if (checked) return; // lock once submitted
    setResponses((prev) => ({ ...prev, [qi]: r }));
  };

  return (
    <section
      style={{
        border: "var(--border-width) solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-elevated)",
        padding: 22,
        margin: "26px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)" }}>
          Проверь себя
        </span>
        {quiz.title && (
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>· {quiz.title}</span>
        )}
        {checked && (
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 13, color: score === quiz.questions.length ? "var(--success)" : "var(--text-secondary)" }}>
            {score}/{quiz.questions.length}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {quiz.questions.map((q, qi) => (
          <Question
            key={qi}
            q={q}
            response={responses[qi] ?? null}
            checked={checked}
            onChange={(r) => set(qi, r)}
          />
        ))}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        {!checked ? (
          <button type="button" onClick={() => setChecked(true)} style={primaryBtn}>
            Проверить
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setChecked(false);
              setResponses({});
            }}
            style={ghostBtn}
          >
            Ещё раз
          </button>
        )}
      </div>
    </section>
  );
}

function Question({
  q,
  response,
  checked,
  onChange,
}: {
  q: QuizQuestion;
  response: QuizResponse;
  checked: boolean;
  onChange: (r: QuizResponse) => void;
}) {
  const correct = checked && isCorrect(q, response);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5, color: "var(--text-primary)", fontWeight: 500 }}>
          {q.q}
        </p>
        {checked && (
          <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: 13, fontFamily: "var(--font-mono)", color: correct ? "var(--success)" : "var(--error)" }}>
            {correct ? "✓ верно" : "✗ неверно"}
          </span>
        )}
      </div>

      {q.type === "number" ? (
        <input
          type="number"
          disabled={checked}
          value={typeof response === "number" ? response : ""}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange(Number.isFinite(v) ? v : null);
          }}
          style={{
            width: 120,
            height: 34,
            padding: "0 10px",
            background: "var(--bg-canvas)",
            border: "var(--border-width) solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {(q.options ?? []).map((opt, oi) => {
            const selected = optionSelected(q.type, response, oi);
            const isAnswer = Array.isArray(q.answer) ? q.answer.includes(oi) : q.answer === oi;
            const border =
              checked && isAnswer
                ? "var(--success)"
                : checked && selected && !isAnswer
                ? "var(--error)"
                : selected
                ? "var(--accent)"
                : "var(--border-default)";
            return (
              <button
                key={oi}
                type="button"
                disabled={checked}
                onClick={() => onChange(toggle(q.type, response, oi))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  padding: "9px 12px",
                  background: selected ? "var(--bg-hover)" : "var(--bg-canvas)",
                  border: `var(--border-width) solid ${border}`,
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  cursor: checked ? "default" : "pointer",
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    borderRadius: q.type === "multi" ? 4 : "50%",
                    border: `2px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
                    background: selected ? "var(--accent)" : "transparent",
                  }}
                />
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {checked && q.explain && (
        <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--text-tertiary)" }}>
          {q.explain}
        </p>
      )}
    </div>
  );
}

function optionSelected(type: QuizQuestion["type"], response: QuizResponse, oi: number): boolean {
  if (type === "multi") return Array.isArray(response) && response.includes(oi);
  return response === oi;
}

function toggle(type: QuizQuestion["type"], response: QuizResponse, oi: number): QuizResponse {
  if (type === "multi") {
    const cur = Array.isArray(response) ? response : [];
    return cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi];
  }
  return oi;
}

const primaryBtn: React.CSSProperties = {
  height: 36,
  padding: "0 18px",
  background: "var(--accent)",
  border: "none",
  borderRadius: "var(--radius-md)",
  color: "var(--accent-fg)",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  height: 36,
  padding: "0 18px",
  background: "transparent",
  border: "var(--border-width) solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  cursor: "pointer",
};

export default Quiz;
