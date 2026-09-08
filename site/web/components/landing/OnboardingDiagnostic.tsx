"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { recordLearningEvent } from "@/lib/progress";
import {
  DIAGNOSTIC_QUESTIONS,
  diagnosticIsComplete,
  getDiagnosticRecommendation,
  type DiagnosticAnswers,
  type DiagnosticQuestionId,
} from "@/lib/diagnostic";

const STORAGE_KEY = "graphlms.diagnostic.v1";

interface StoredDiagnostic {
  answers: DiagnosticAnswers;
  completedAt: string;
}

export default function OnboardingDiagnostic({ nextTask }: { nextTask: string }) {
  const [answers, setAnswers] = useState<DiagnosticAnswers>({});
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [stored, setStored] = useState<StoredDiagnostic | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const value = JSON.parse(raw) as StoredDiagnostic;
      if (value && typeof value === "object" && diagnosticIsComplete(value.answers ?? {})) {
        setStored(value);
        setAnswers(value.answers);
      }
    } catch {
      // A broken local entry must never hide the onboarding CTA.
    }
  }, []);

  const question = DIAGNOSTIC_QUESTIONS[step];
  const recommendation = useMemo(() => getDiagnosticRecommendation(answers), [answers]);
  const resultHref = recommendation
    ? recommendation.route === "go-basics"
      ? "/go-basics/book/hello"
      : recommendation.route === "os"
        ? "/os/book/process"
        : recommendation.route === "interview"
          ? "/go/interview"
          : `/go/tasks/${nextTask}`
    : null;

  const begin = () => {
    setActive(true);
    setStep(0);
    setAnswers({});
    recordLearningEvent("started", "onboarding:diagnostic", { eventId: "started:onboarding:diagnostic" });
  };

  const choose = (id: DiagnosticQuestionId, value: string) => {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    if (step < DIAGNOSTIC_QUESTIONS.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    const finishedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: next, completedAt: finishedAt } satisfies StoredDiagnostic));
    } catch {
      // The recommendation still works for this session when storage is unavailable.
    }
    setStored({ answers: next, completedAt: finishedAt });
    setActive(false);
    recordLearningEvent("completed", "onboarding:diagnostic", {
      eventId: "completed:onboarding:diagnostic",
      meta: { route: getDiagnosticRecommendation(next)?.route ?? "go" },
    });
  };

  if (active && question) {
    return (
      <section className="diagnostic-panel" aria-labelledby="diagnostic-title">
        <div className="diagnostic-head">
          <div>
            <div className="eyebrow">DIAGNOSTIC / {String(step + 1).padStart(2, "0")} OF 03</div>
            <h2 id="diagnostic-title">{question.title}</h2>
            <p>Выбери самый близкий вариант. Это займёт около минуты.</p>
          </div>
          <button type="button" className="diagnostic-close" onClick={() => setActive(false)} aria-label="Закрыть диагностику">Закрыть</button>
        </div>
        <div className="diagnostic-options">
          {question.options.map((option) => (
            <button type="button" key={option.value} className="diagnostic-option" onClick={() => choose(question.id, option.value)}>
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
              <span aria-hidden="true" className="dash-arrow">↗</span>
            </button>
          ))}
        </div>
        <div className="diagnostic-progress" aria-label={`Шаг ${step + 1} из 3`}>
          {DIAGNOSTIC_QUESTIONS.map((item, index) => <i key={item.id} className={index <= step ? "done" : ""} />)}
        </div>
      </section>
    );
  }

  if (stored && recommendation && resultHref) {
    return (
      <section className="diagnostic-panel diagnostic-result" aria-labelledby="diagnostic-result-title">
        <div>
          <div className="eyebrow">02 / YOUR ROUTE</div>
          <h2 id="diagnostic-result-title">{recommendation.title}</h2>
          <p>{recommendation.reason}</p>
          <span className="diagnostic-detail">{recommendation.description}</span>
        </div>
        <div className="diagnostic-result-actions">
          <Link className="primary-action" href={resultHref}>{recommendation.label} <span className="dash-arrow">↗</span></Link>
          <button type="button" className="quiet-action diagnostic-restart" onClick={begin}>Пройти заново</button>
        </div>
      </section>
    );
  }

  return (
    <section className="diagnostic-panel diagnostic-intro" aria-labelledby="diagnostic-intro-title">
      <div>
        <div className="eyebrow">02 / FIND YOUR ENTRY POINT</div>
        <h2 id="diagnostic-intro-title">Не уверен, с чего начать?</h2>
        <p>Ответь на три вопроса. Мы подберём первый шаг между основами Go, практикой, ОС и режимом интервью.</p>
      </div>
      <button type="button" className="primary-action diagnostic-start" onClick={begin}>Пройти диагностику <span className="dash-arrow">↗</span></button>
    </section>
  );
}

