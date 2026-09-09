"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side progress: solved task ids + last code per task, in localStorage.
 * Storage keys are kept stable so progress survives across sessions.
 */

const SOLVED_KEY = "goconc.solved.v1";
const SOLVED_AT_KEY = "goconc.solvedAt.v1";
const CODE_PREFIX = "goconc.code.v1.";
const DEFAULT_COURSE_ID = "go";

/** Stable storage/server identifier for a task within a course. */
export function progressKey(taskId: string, courseId: string = DEFAULT_COURSE_ID): string {
  return `${courseId}:${taskId}`;
}

function isLegacyGoKey(key: string): boolean {
  return !key.includes(":");
}

function readStoredSolved(): Set<string> {
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

/** Logical task ids for one course, including the pre-platform Go store. */
function readSolved(courseId?: string): Set<string> {
  const stored = readStoredSolved();
  if (!courseId) return stored;
  const prefix = `${courseId}:`;
  const logical = new Set<string>();
  for (const key of stored) {
    if (key.startsWith(prefix)) logical.add(key.slice(prefix.length));
    else if (courseId === DEFAULT_COURSE_ID && isLegacyGoKey(key)) logical.add(key);
  }
  return logical;
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
function readStoredSolvedAt(): Record<string, string> {
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

function readSolvedAt(courseId?: string): Record<string, string> {
  const stored = readStoredSolvedAt();
  if (!courseId) return stored;
  const prefix = `${courseId}:`;
  const logical: Record<string, string> = {};
  for (const [key, value] of Object.entries(stored)) {
    if (key.startsWith(prefix)) logical[key.slice(prefix.length)] = value;
    else if (courseId === DEFAULT_COURSE_ID && isLegacyGoKey(key)) logical[key] = value;
  }
  return logical;
}

function writeSolvedAt(map: Record<string, string>) {
  try {
    window.localStorage.setItem(SOLVED_AT_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

const SOLVED_EVENT = "goconc:solved-changed";
let progressNotifyTimer: number | null = null;
const EVENTS_KEY = "goconc.events.v1";
const EVENTS_OWNER_KEY = "goconc.events.owner.v1";
const ATTEMPTS_KEY = "goconc.attempts.v1";

/** Coalesce editor keystrokes before notifying the rest of the app. */
function notifyProgressChanged() {
  if (typeof window === "undefined") return;
  if (typeof window.setTimeout !== "function") {
    window.dispatchEvent(new Event(SOLVED_EVENT));
    return;
  }
  if (progressNotifyTimer !== null) return;
  progressNotifyTimer = window.setTimeout(() => {
    progressNotifyTimer = null;
    window.dispatchEvent(new Event(SOLVED_EVENT));
  }, 200);
}

export interface TaskAttempt {
  id: string;
  taskId: string;
  courseId: string;
  code: string;
  passed: boolean;
  at: string;
  durationMs: number;
  summary?: string;
}

export type AttemptDiffLine = {
  kind: "same" | "added" | "removed";
  text: string;
  line?: number;
};

export interface AttemptComparison {
  first: TaskAttempt;
  successful: TaskAttempt;
  attemptsBeforeSuccess: number;
  changedLines: number;
  firstLineCount: number;
  successfulLineCount: number;
  durationDeltaMs: number;
  diff: AttemptDiffLine[];
}

/**
 * Compare the chronological first attempt with the first passing attempt.
 * The diff intentionally stays line-oriented and deterministic so it can be
 * rendered offline without an editor or an AI explanation.
 */
export function compareTaskAttempts(attempts: TaskAttempt[]): AttemptComparison | null {
  if (!attempts.length) return null;
  const chronological = [...attempts].sort((a, b) => {
    const byTime = new Date(a.at).getTime() - new Date(b.at).getTime();
    return byTime || a.id.localeCompare(b.id);
  });
  const first = chronological[0];
  const successfulIndex = chronological.findIndex((attempt) => attempt.passed);
  if (successfulIndex < 0) return null;
  const successful = chronological[successfulIndex];
  const before = first.code.split("\n");
  const after = successful.code.split("\n");

  // A compact LCS diff keeps unchanged context while making additions and
  // removals explicit. The cap prevents a very large pasted source from
  // turning the history panel into an unbounded computation.
  const maxCells = 120_000;
  const rows = before.length;
  const cols = after.length;
  const table = rows * cols <= maxCells
    ? Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0))
    : null;
  if (table) {
    for (let i = rows - 1; i >= 0; i -= 1) {
      for (let j = cols - 1; j >= 0; j -= 1) {
        table[i][j] = before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }
  const diff: AttemptDiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < rows || j < cols) {
    if (i < rows && j < cols && before[i] === after[j]) {
      diff.push({ kind: "same", text: before[i], line: j + 1 });
      i += 1;
      j += 1;
    } else if (j < cols && (!table || i >= rows || table[i][j + 1] >= table[i + 1][j])) {
      diff.push({ kind: "added", text: after[j], line: j + 1 });
      j += 1;
    } else if (i < rows) {
      diff.push({ kind: "removed", text: before[i], line: i + 1 });
      i += 1;
    }
  }
  const changedLines = diff.filter((line) => line.kind !== "same").length;
  return {
    first,
    successful,
    attemptsBeforeSuccess: successfulIndex + 1,
    changedLines,
    firstLineCount: rows,
    successfulLineCount: cols,
    durationDeltaMs: successful.durationMs - first.durationMs,
    diff: diff.slice(0, 180),
  };
}

function readAttempts(): TaskAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.id === "string" && typeof a.taskId === "string") : [];
  } catch {
    return [];
  }
}

function writeAttempts(attempts: TaskAttempt[]) {
  try {
    // Keep enough history for comparison without allowing large source files
    // to grow localStorage without bounds.
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(-160)));
  } catch {
    /* ignore quota / private mode */
  }
}

export function recordTaskAttempt(input: Omit<TaskAttempt, "id" | "at">): TaskAttempt {
  const attempt: TaskAttempt = { ...input, id: `${input.taskId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString() };
  const attempts = readAttempts();
  attempts.push(attempt);
  writeAttempts(attempts);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SOLVED_EVENT));
  return attempt;
}

export function getTaskAttempts(taskId: string, courseId?: string): TaskAttempt[] {
  return readAttempts().filter((a) => a.taskId === taskId && (!courseId || a.courseId === courseId)).reverse();
}

export function useTaskAttempts(taskId: string, courseId?: string): TaskAttempt[] {
  const [attempts, setAttempts] = useState<TaskAttempt[]>([]);
  useEffect(() => {
    const sync = () => setAttempts(getTaskAttempts(taskId, courseId));
    sync();
    window.addEventListener(SOLVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SOLVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [taskId, courseId]);
  return attempts;
}

export type LearningEventType =
  | "landing_view"
  | "goal_selected"
  | "diagnostic_started"
  | "diagnostic_completed"
  | "first_task_started"
  | "started"
  | "run"
  | "feedback"
  | "first_pass"
  | "failed"
  | "passed"
  | "hint"
  | "completed"
  | "topic_completed"
  | "artifact_saved"
  | "report_created"
  | "report_shared"
  | "account_created"
  | "checkout_started"
  | "subscription_started"
  | "cancelled";

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  itemId: string;
  courseId?: string;
  at: string;
  meta?: Record<string, string | number | boolean>;
}

function readEvents(): LearningEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => e && typeof e.id === "string") : [];
  } catch {
    return [];
  }
}

function writeEvents(events: LearningEvent[]) {
  try {
    // Keep the local history useful and bounded on long-lived accounts.
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-500)));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Anonymous actions are adopted by the first account that signs in. A browser
 * shared by multiple people must never upload one learner's event history to
 * another learner's account, so a user switch starts a fresh local buffer.
 */
export function prepareLearningEventsForUser(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const owner = window.localStorage.getItem(EVENTS_OWNER_KEY);
    if (owner && owner !== userId) writeEvents([]);
    window.localStorage.setItem(EVENTS_OWNER_KEY, userId);
  } catch {
    /* private mode keeps the local-first behavior without sync ownership */
  }
}

export function learningEventsBelongTo(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EVENTS_OWNER_KEY) === userId;
  } catch {
    return false;
  }
}

/** Record one meaningful learning action. Repeated event ids are ignored. */
export function recordLearningEvent(
  type: LearningEventType,
  itemId: string,
  options: { courseId?: string; eventId?: string; meta?: LearningEvent["meta"] } = {},
): LearningEvent {
  const event: LearningEvent = {
    id: options.eventId ?? `${type}:${options.courseId ?? "go"}:${itemId}:${Date.now()}`,
    type,
    itemId,
    courseId: options.courseId,
    at: new Date().toISOString(),
    meta: options.meta,
  };
  const events = readEvents();
  if (!events.some((existing) => existing.id === event.id)) {
    events.push(event);
    writeEvents(events);
    if (typeof window !== "undefined") window.dispatchEvent(new Event(SOLVED_EVENT));
  }
  return event;
}

export function getLearningEvents(): LearningEvent[] {
  return readEvents();
}

export function useLearningEvents(): LearningEvent[] {
  const [events, setEvents] = useState<LearningEvent[]>([]);
  useEffect(() => {
    setEvents(readEvents());
    const sync = () => setEvents(readEvents());
    window.addEventListener(SOLVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SOLVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return events;
}

/** Reactive set of solved task ids. Total is provided by the caller. */
export function useProgress(total?: number, courseId?: string) {
  const scope = courseId ?? DEFAULT_COURSE_ID;
  const [solved, setSolved] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSolved(readSolved(scope));
    const sync = () => setSolved(readSolved(scope));
    window.addEventListener(SOLVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SOLVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [scope]);

  const markSolved = useCallback((id: string, taskCourseId: string = scope) => {
    const key = progressKey(id, taskCourseId);
    const stored = readStoredSolved();
    if (!stored.has(key)) {
      stored.add(key);
      writeSolved(stored);
      // Record the first-solve timestamp alongside the solved set.
      const at = readStoredSolvedAt();
      if (!at[key]) {
        at[key] = new Date().toISOString();
        writeSolvedAt(at);
      }
      setSolved(readSolved(scope));
      window.dispatchEvent(new Event(SOLVED_EVENT));
    }
  }, [scope]);

  const isSolved = useCallback((id: string, taskCourseId: string = scope) => {
    if (taskCourseId === scope) {
      return solved.has(id);
    }
    const stored = readStoredSolved();
    return stored.has(progressKey(id, taskCourseId)) || (taskCourseId === DEFAULT_COURSE_ID && stored.has(id));
  }, [scope, solved]);

  const count = solved.size;
  const percent = total && total > 0 ? Math.round((count / total) * 100) : 0;

  return { solved, isSolved, markSolved, count, percent };
}

// ---- per-task code persistence -------------------------------------------

export function loadCode(taskId: string, courseId: string = DEFAULT_COURSE_ID): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CODE_PREFIX + progressKey(taskId, courseId))
      ?? (courseId === DEFAULT_COURSE_ID ? window.localStorage.getItem(CODE_PREFIX + taskId) : null);
  } catch {
    return null;
  }
}

export function saveCode(taskId: string, code: string, courseId: string = DEFAULT_COURSE_ID) {
  try {
    window.localStorage.setItem(CODE_PREFIX + progressKey(taskId, courseId), code);
    notifyProgressChanged();
  } catch {
    /* ignore */
  }
}

export function clearCode(taskId: string, courseId: string = DEFAULT_COURSE_ID) {
  try {
    window.localStorage.removeItem(CODE_PREFIX + progressKey(taskId, courseId));
    if (courseId === DEFAULT_COURSE_ID) window.localStorage.removeItem(CODE_PREFIX + taskId);
    notifyProgressChanged();
  } catch {
    /* ignore */
  }
}

// ---- solve history (timestamps) ------------------------------------------

/** taskId → ISO date string of the first solve. Empty before any solve. */
export function getSolvedHistory(courseId?: string): Record<string, string> {
  return readSolvedAt(courseId);
}

/** Synchronous snapshot for non-React consumers and diagnostics. */
export function getSolvedIds(courseId: string = DEFAULT_COURSE_ID): string[] {
  return [...readSolved(courseId)];
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
  const solved = [...readStoredSolved()].map((id) => isLegacyGoKey(id) ? progressKey(id) : id);
  const solvedAt = Object.fromEntries(Object.entries(readStoredSolvedAt()).map(([id, at]) => [isLegacyGoKey(id) ? progressKey(id) : id, at]));
  const code: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(CODE_PREFIX)) {
          const storedTaskId = key.slice(CODE_PREFIX.length);
          const taskId = isLegacyGoKey(storedTaskId) ? progressKey(storedTaskId) : storedTaskId;
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

/** Reactive local snapshot used by the background progress synchronizer. */
export function useLocalProgress(): ProgressSnapshot {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(() => getLocalProgress());

  useEffect(() => {
    const sync = () => setSnapshot(getLocalProgress());
    sync();
    window.addEventListener(SOLVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SOLVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return snapshot;
}

/**
 * Merge a server snapshot into the local stores: union of solved ids, merged
 * solvedAt (keeping the earliest known timestamp), and code preferring the
 * server value on conflicts. Returns the merged snapshot so callers can push
 * it back to the server. Notifies subscribers so the UI updates live.
 */
export function mergeServerProgress(
  server: Partial<ProgressSnapshot>,
  options: { preferServerCode?: boolean } = {},
): ProgressSnapshot {
  const local = getLocalProgress();

  // solved: union
  const normalize = (id: string) => isLegacyGoKey(id) ? progressKey(id) : id;
  const solvedSet = new Set<string>(local.solved);
  for (const id of server.solved ?? []) solvedSet.add(normalize(id));

  // solvedAt: keep the earliest timestamp we know about
  const solvedAt: Record<string, string> = { ...local.solvedAt };
  for (const [rawId, iso] of Object.entries(server.solvedAt ?? {})) {
    const id = normalize(rawId);
    if (!solvedAt[id] || new Date(iso).getTime() < new Date(solvedAt[id]).getTime()) {
      solvedAt[id] = iso;
    }
  }
  // ensure every solved id has a timestamp
  for (const id of solvedSet) {
    if (!solvedAt[id]) solvedAt[id] = new Date().toISOString();
  }

  // Code has no per-field version in the API yet. Callers can prefer the
  // active browser draft during background sync; login keeps server priority.
  const preferServerCode = options.preferServerCode ?? true;
  const code: Record<string, string> = { ...local.code };
  for (const [rawId, value] of Object.entries(server.code ?? {})) {
    const id = normalize(rawId);
    if (preferServerCode || code[id] === undefined) code[id] = value;
  }

  // persist
  writeSolved(solvedSet);
  writeSolvedAt(solvedAt);
  for (const [taskId, value] of Object.entries(code)) {
    try { window.localStorage.setItem(CODE_PREFIX + taskId, value); } catch { /* ignore */ }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SOLVED_EVENT));
  }

  return { solved: [...solvedSet], solvedAt, code };
}

/** Reactive solve-history map. Same event pattern as useProgress. */
export function useSolvedHistory(courseId?: string): Record<string, string> {
  const [history, setHistory] = useState<Record<string, string>>({});

  useEffect(() => {
    setHistory(readSolvedAt(courseId));
    const sync = () => setHistory(readSolvedAt(courseId));
    window.addEventListener(SOLVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SOLVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [courseId]);

  return history;
}
