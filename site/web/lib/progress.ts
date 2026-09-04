"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side progress: solved task ids + last code per task, in localStorage.
 * Storage keys are kept stable so progress survives across sessions.
 */

const SOLVED_KEY = "goconc.solved.v1";
const SOLVED_AT_KEY = "goconc.solvedAt.v1";
const CODE_PREFIX = "goconc.code.v1.";

function readSolved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SOLVED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSolved(set: Set<string>) {
  try {
    window.localStorage.setItem(SOLVED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Solve timestamps: taskId → ISO date of the *first* solve. Written alongside
 * the solved set so we can render an activity heatmap and a recent-solves list
 * from purely local data. Add-only — existing solved/code stores are untouched.
 */
function readSolvedAt(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SOLVED_AT_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as Record<string, string>;
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function writeSolvedAt(map: Record<string, string>) {
  try {
    window.localStorage.setItem(SOLVED_AT_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

const SOLVED_EVENT = "goconc:solved-changed";

/** Reactive set of solved task ids. Total is provided by the caller. */
export function useProgress(total?: number) {
  const [solved, setSolved] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSolved(readSolved());
    const sync = () => setSolved(readSolved());
    window.addEventListener(SOLVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SOLVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const markSolved = useCallback((id: string) => {
    const next = readSolved();
    if (!next.has(id)) {
      next.add(id);
      writeSolved(next);
      // Record the first-solve timestamp alongside the solved set.
      const at = readSolvedAt();
      if (!at[id]) {
        at[id] = new Date().toISOString();
        writeSolvedAt(at);
      }
      setSolved(new Set(next));
      window.dispatchEvent(new Event(SOLVED_EVENT));
    }
  }, []);

  const isSolved = useCallback((id: string) => solved.has(id), [solved]);

  const count = solved.size;
  const percent = total && total > 0 ? Math.round((count / total) * 100) : 0;

  return { solved, isSolved, markSolved, count, percent };
}

// ---- per-task code persistence -------------------------------------------

export function loadCode(taskId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CODE_PREFIX + taskId);
  } catch {
    return null;
  }
}

export function saveCode(taskId: string, code: string) {
  try {
    window.localStorage.setItem(CODE_PREFIX + taskId, code);
  } catch {
    /* ignore */
  }
}

export function clearCode(taskId: string) {
  try {
    window.localStorage.removeItem(CODE_PREFIX + taskId);
  } catch {
    /* ignore */
  }
}

// ---- solve history (timestamps) ------------------------------------------

/** taskId → ISO date string of the first solve. Empty before any solve. */
export function getSolvedHistory(): Record<string, string> {
  return readSolvedAt();
}

// ---- server sync support --------------------------------------------------
// The following helpers expose the raw local stores so that lib/auth can merge
// server progress into the browser (and back). They are add-only and never
// change the local-only behaviour used when logged out.

/** Server snapshot shape, matching `GET/PUT {API}/me/progress`. */
export interface ProgressSnapshot {
  solved: string[];
  solvedAt: Record<string, string>;
  code: Record<string, string>;
}

/** Current local progress as a server-shaped snapshot (browser only). */
export function getLocalProgress(): ProgressSnapshot {
  const solved = [...readSolved()];
  const solvedAt = readSolvedAt();
  const code: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(CODE_PREFIX)) {
          const taskId = key.slice(CODE_PREFIX.length);
          const value = window.localStorage.getItem(key);
          if (value != null) code[taskId] = value;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return { solved, solvedAt, code };
}

/**
 * Merge a server snapshot into the local stores: union of solved ids, merged
 * solvedAt (keeping the earliest known timestamp), and code preferring the
 * server value on conflicts. Returns the merged snapshot so callers can push
 * it back to the server. Notifies subscribers so the UI updates live.
 */
export function mergeServerProgress(server: Partial<ProgressSnapshot>): ProgressSnapshot {
  const local = getLocalProgress();

  // solved: union
  const solvedSet = new Set<string>(local.solved);
  for (const id of server.solved ?? []) solvedSet.add(id);

  // solvedAt: keep the earliest timestamp we know about
  const solvedAt: Record<string, string> = { ...local.solvedAt };
  for (const [id, iso] of Object.entries(server.solvedAt ?? {})) {
    if (!solvedAt[id] || new Date(iso).getTime() < new Date(solvedAt[id]).getTime()) {
      solvedAt[id] = iso;
    }
  }
  // ensure every solved id has a timestamp
  for (const id of solvedSet) {
    if (!solvedAt[id]) solvedAt[id] = new Date().toISOString();
  }

  // code: server wins on conflict
  const code: Record<string, string> = { ...local.code, ...(server.code ?? {}) };

  // persist
  writeSolved(solvedSet);
  writeSolvedAt(solvedAt);
  for (const [taskId, value] of Object.entries(code)) saveCode(taskId, value);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SOLVED_EVENT));
  }

  return { solved: [...solvedSet], solvedAt, code };
}

/** Reactive solve-history map. Same event pattern as useProgress. */
export function useSolvedHistory(): Record<string, string> {
  const [history, setHistory] = useState<Record<string, string>>({});

  useEffect(() => {
    setHistory(readSolvedAt());
    const sync = () => setHistory(readSolvedAt());
    window.addEventListener(SOLVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SOLVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return history;
}
