import type { Metadata } from "next";
import { CpuScheduler } from "@/components/os/sim/CpuScheduler";

export const metadata: Metadata = {
  title: "Симулятор планировщика CPU",
  description:
    "Интерактивная диаграмма Ганта: FIFO, SJF, STCF, RR, MLFQ. Меняй процессы и политику — смотри, как меняются оборот, отклик и ожидание.",
};

export default function SchedulerSandboxPage() {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 28px" }}>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-tertiary)",
          marginBottom: 8,
        }}
      >
        ОС · Виртуализация CPU · песочница
      </p>
      <h1
        style={{
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          margin: "0 0 12px",
        }}
      >
        Симулятор планировщика
      </h1>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          margin: "0 0 28px",
          maxWidth: 640,
        }}
      >
        Добавляй процессы, задавай время прихода и длительность (burst), переключай
        политику. Диаграмма Ганта и метрики пересчитываются мгновенно. Нажми
        «Играть», чтобы прокрутить время.
      </p>

      <CpuScheduler />
    </div>
  );
}
