"use client";

/**
 * Local reading progress for the book (textbook) chapters.
 * Stores, per course basePath, the last opened chapter and the set of opened
 * chapters in localStorage — purely client-side, no server involvement, so the
 * server/client boundary and routes stay untouched.
 *
 * Shape: goconc.reading.v1.<basePath> → { last: slug, visited: slug[] }
 */

const KEY_PREFIX = "goconc.reading.v1.";

export interface ReadingState {
  last: string | null;
  visited: string[];
}

function storageKey(basePath: string): string {
  return KEY_PREFIX + basePath;
}

/** Read reading state for a course. Browser only; empty state on server/SSR. */
export function readReadingState(basePath: string): ReadingState {
  if (typeof window === "undefined") return { last: null, visited: [] };
  try {
    const raw = window.localStorage.getItem(storageKey(basePath));
    if (!raw) return { last: null, visited: [] };
    const obj = JSON.parse(raw) as Partial<ReadingState>;
    return {
      last: typeof obj.last === "string" ? obj.last : null,
      visited: Array.isArray(obj.visited)
        ? obj.visited.filter((s): s is string => typeof s === "string")
        : [],
    };
  } catch {
    return { last: null, visited: [] };
  }
}

/** Record a chapter visit (updates `last` and appends to `visited`). */
export function markChapterVisited(basePath: string, slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const state = readReadingState(basePath);
    const visited = state.visited.includes(slug)
      ? state.visited
      : [...state.visited, slug];
    window.localStorage.setItem(
      storageKey(basePath),
      JSON.stringify({ last: slug, visited } satisfies ReadingState),
    );
  } catch {
    /* ignore quota / private mode */
  }
}
