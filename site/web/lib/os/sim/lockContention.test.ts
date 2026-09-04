import { describe, it, expect } from "vitest";
import { lockContention } from "./lockContention";

describe("lockContention", () => {
  it("serialises overlapping threads and counts waiting", () => {
    const r = lockContention([
      { name: "A", arrival: 0, work: 3 },
      { name: "B", arrival: 1, work: 2 },
      { name: "C", arrival: 2, work: 2 },
    ]);
    expect(r.finish).toBe(7);
    expect(r.totalWait).toBe(5); // B waits 2, C waits 3
    const hold = r.segments.filter((s) => s.kind === "hold");
    expect(hold).toEqual([
      { name: "A", kind: "hold", start: 0, end: 3 },
      { name: "B", kind: "hold", start: 3, end: 5 },
      { name: "C", kind: "hold", start: 5, end: 7 },
    ]);
  });

  it("no waiting when arrivals do not overlap", () => {
    const r = lockContention([
      { name: "A", arrival: 0, work: 2 },
      { name: "B", arrival: 5, work: 2 },
    ]);
    expect(r.totalWait).toBe(0);
    expect(r.finish).toBe(7);
    expect(r.segments.every((s) => s.kind === "hold")).toBe(true);
  });

  it("ignores zero-work threads", () => {
    const r = lockContention([{ name: "A", arrival: 0, work: 0 }]);
    expect(r.segments).toEqual([]);
    expect(r.finish).toBe(0);
  });
});
