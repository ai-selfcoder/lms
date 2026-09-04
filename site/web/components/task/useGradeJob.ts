"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunResult } from "./types";

export type GradePhase = "idle" | "queued" | "running" | "done" | "error";

export interface GradeState {
  phase: GradePhase;
  position: number;
  queueLength: number;
  result: RunResult | null;
}

interface StatusResponse {
  status?: GradePhase;
  position?: number;
  queueLength?: number;
  result?: RunResult;
  message?: string;
}

const POLL_MS = 1000;
const MAX_POLL_MS = 4 * 60 * 1000; // give up after ~4 minutes

const IDLE: GradeState = { phase: "idle", position: 0, queueLength: 0, result: null };

/** Submit a grade and poll its queue position + verdict. */
export function useGradeJob() {
  const [state, setState] = useState<GradeState>(IDLE);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const alive = useRef(true);

  const stop = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    // Reset on (re)mount so the hook survives React Strict Mode's dev
    // mount→unmount→mount cycle; tear down polling on real unmount.
    alive.current = true;
    return () => {
      alive.current = false;
      stop();
    };
  }, [stop]);

  const finishError = useCallback((message: string) => {
    setState({
      phase: "error",
      position: 0,
      queueLength: 0,
      result: {
        pass: false,
        output: message,
        durationMs: 0,
        timedOut: false,
        compileError: false,
        error: true,
      },
    });
  }, []);

  const poll = useCallback(
    async (jobId: string) => {
      if (!alive.current) return;
      if (Date.now() - startedAt.current > MAX_POLL_MS) {
        finishError("Проверка идёт слишком долго. Попробуй запустить ещё раз.");
        return;
      }
      let data: StatusResponse;
      try {
        const res = await fetch(`/api/run?id=${encodeURIComponent(jobId)}`, {
          cache: "no-store",
        });
        data = (await res.json()) as StatusResponse;
      } catch {
        // Transient network blip — retry on the next tick.
        timer.current = setTimeout(() => poll(jobId), POLL_MS);
        return;
      }
      if (!alive.current) return;

      const phase = data.status ?? "error";
      if (phase === "done") {
        if (data.result) {
          setState({ phase: "done", position: 0, queueLength: 0, result: data.result });
        } else {
          finishError("Грейдер не вернул результат. Попробуй ещё раз.");
        }
        return;
      }
      if (phase === "error") {
        finishError(data.message ?? "Ошибка проверки.");
        return;
      }
      setState({
        phase,
        position: data.position ?? 0,
        queueLength: data.queueLength ?? 0,
        result: null,
      });
      timer.current = setTimeout(() => poll(jobId), POLL_MS);
    },
    [finishError]
  );

  const start = useCallback(
    async (taskId: string, course: string, code: string) => {
      stop();
      startedAt.current = Date.now();
      setState({ phase: "queued", position: 0, queueLength: 0, result: null });
      let data: { jobId?: string; message?: string };
      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, course, code }),
        });
        data = (await res.json()) as { jobId?: string; message?: string };
        if (!res.ok || !data.jobId) {
          finishError(data?.message ?? "Не удалось поставить задачу в очередь.");
          return;
        }
      } catch {
        finishError("Не удалось отправить запрос. Проверь соединение и попробуй снова.");
        return;
      }
      poll(data.jobId);
    },
    [stop, poll, finishError]
  );

  const reset = useCallback(() => {
    stop();
    setState(IDLE);
  }, [stop]);

  return { ...state, start, reset };
}
