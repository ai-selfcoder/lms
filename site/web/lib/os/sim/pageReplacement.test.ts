import { describe, it, expect } from "vitest";
import { pageReplacement } from "./pageReplacement";

describe("pageReplacement · FIFO", () => {
  it("evicts the oldest-loaded page", () => {
    const r = pageReplacement({ refs: [1, 2, 3, 1, 4, 5], capacity: 3, policy: "FIFO" });
    expect(r.misses).toBe(5);
    expect(r.hits).toBe(1);
    expect(r.steps[5].frames).toEqual([4, 5, 3]);
  });
});

describe("pageReplacement · LRU", () => {
  it("evicts the least-recently-used page", () => {
    const r = pageReplacement({ refs: [1, 2, 3, 1, 4, 2], capacity: 3, policy: "LRU" });
    expect(r.misses).toBe(5);
    expect(r.hits).toBe(1);
    expect(r.steps[4].victim).toBe(2); // page 2 was LRU when 4 arrives
    expect(r.steps[5].victim).toBe(3);
  });
});

describe("pageReplacement · OPT", () => {
  it("evicts the page used farthest in the future", () => {
    const r = pageReplacement({ refs: [1, 2, 3, 1, 4], capacity: 3, policy: "OPT" });
    expect(r.misses).toBe(4);
    expect(r.steps[4].victim).toBe(1); // none of 1/2/3 used again → first slot (page 1)
  });
});

describe("pageReplacement · CLOCK", () => {
  it("gives a second chance via the reference bit", () => {
    const r = pageReplacement({ refs: [1, 2, 3, 1, 4], capacity: 3, policy: "CLOCK" });
    expect(r.misses).toBe(4);
    expect(r.steps[4].victim).toBe(1);
    expect(r.steps[4].frames).toEqual([4, 2, 3]);
  });
});

describe("pageReplacement · edges", () => {
  it("treats zero capacity as all-miss", () => {
    const r = pageReplacement({ refs: [1, 2, 3], capacity: 0, policy: "LRU" });
    expect(r.misses).toBe(3);
    expect(r.hits).toBe(0);
    expect(r.hitRate).toBe(0);
  });

  it("never misses on repeated single page after load", () => {
    const r = pageReplacement({ refs: [7, 7, 7], capacity: 2, policy: "FIFO" });
    expect(r.hits).toBe(2);
    expect(r.misses).toBe(1);
  });

  it("computes hit rate", () => {
    const r = pageReplacement({ refs: [1, 1, 2, 2], capacity: 2, policy: "LRU" });
    expect(r.hitRate).toBeCloseTo(0.5, 5);
  });
});
