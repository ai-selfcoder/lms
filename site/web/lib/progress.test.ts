import { beforeEach, describe, expect, it } from "vitest";
import { compareTaskAttempts, getLocalProgress, getSolvedIds, loadCode, mergeServerProgress, progressKey, saveCode, type TaskAttempt } from "@/lib/progress";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
}

const storage = new MemoryStorage();

beforeEach(() => {
  storage.clear();
  Object.assign(globalThis, {
    window: {
      localStorage: storage,
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
});

describe("course-scoped progress", () => {
  it("keeps identical task ids separate by course", () => {
    storage.setItem("goconc.solved.v1", JSON.stringify([progressKey("01", "go"), progressKey("01", "os")]));
    expect(getSolvedIds("go")).toEqual(["01"]);
    expect(getSolvedIds("os")).toEqual(["01"]);
    expect(getLocalProgress().solved).toEqual(["go:01", "os:01"]);
  });

  it("reads legacy raw ids only as Go progress", () => {
    storage.setItem("goconc.solved.v1", JSON.stringify(["01"]));
    expect(getSolvedIds("go")).toEqual(["01"]);
    expect(getSolvedIds("os")).toEqual([]);
    expect(getSolvedIds("go-basics")).toEqual([]);
    expect(getLocalProgress().solved).toEqual(["go:01"]);
  });

  it("scopes code and migrates legacy Go reads", () => {
    storage.setItem("goconc.code.v1.01", "legacy");
    expect(loadCode("01", "go")).toBe("legacy");
    expect(loadCode("01", "os")).toBeNull();
    saveCode("01", "go code", "go");
    saveCode("01", "os code", "os");
    expect(loadCode("01", "go")).toBe("go code");
    expect(loadCode("01", "os")).toBe("os code");
  });

  it("normalizes unscoped server snapshots to Go", () => {
    const merged = mergeServerProgress({ solved: ["02"], code: { "02": "server" } });
    expect(merged.solved).toContain("go:02");
    expect(loadCode("02", "go")).toBe("server");
    expect(loadCode("02", "os")).toBeNull();
  });

  it("can preserve an active local draft during background sync", () => {
    saveCode("02", "local draft", "go");
    const merged = mergeServerProgress(
      { code: { "go:02": "stale server draft", "go:03": "remote draft" } },
      { preferServerCode: false },
    );
    expect(merged.code["go:02"]).toBe("local draft");
    expect(merged.code["go:03"]).toBe("remote draft");
  });
});

describe("attempt comparison", () => {
  const attempt = (id: string, at: string, code: string, passed: boolean, durationMs = 1000): TaskAttempt => ({
    id,
    taskId: "01",
    courseId: "go",
    code,
    passed,
    at,
    durationMs,
  });

  it("compares the chronological first and first successful attempts", () => {
    const result = compareTaskAttempts([
      attempt("pass", "2026-01-03T00:00:00.000Z", "ready\nreturn", true, 1500),
      attempt("fail", "2026-01-01T00:00:00.000Z", "ready\nretry", false, 900),
      attempt("later", "2026-01-04T00:00:00.000Z", "later", true, 2200),
    ]);
    expect(result?.first.id).toBe("fail");
    expect(result?.successful.id).toBe("pass");
    expect(result?.attemptsBeforeSuccess).toBe(2);
    expect(result?.changedLines).toBe(2);
    expect(result?.durationDeltaMs).toBe(600);
    expect(result?.diff.filter((line) => line.kind === "removed").map((line) => line.text)).toEqual(["retry"]);
    expect(result?.diff.filter((line) => line.kind === "added").map((line) => line.text)).toEqual(["return"]);
  });

  it("returns null until a passing attempt exists", () => {
    expect(compareTaskAttempts([attempt("fail", "2026-01-01T00:00:00.000Z", "x", false)])).toBeNull();
    expect(compareTaskAttempts([])).toBeNull();
  });
});
