import { describe, expect, it } from "vitest";
import { getContentHealth } from "./contentHealth";

describe("content health report", () => {
  it("counts the task layers from the source content", () => {
    const report = getContentHealth();
    expect(report.tasks).toBeGreaterThan(0);
    expect(report.withTheory).toBeGreaterThan(0);
    expect(report.withSolution).toBeGreaterThan(0);
    expect(report.withTheory).toBeLessThanOrEqual(report.tasks);
    expect(report.withSolution).toBeLessThanOrEqual(report.tasks);
    expect(report.withHints).toBeLessThanOrEqual(report.tasks);
    expect(report.withEditorial).toBeLessThanOrEqual(report.tasks);
    expect(report.needsAttention).toBeGreaterThanOrEqual(report.attention.length);
    expect(report.attention.length).toBeLessThanOrEqual(12);
    expect(report.catalog).toHaveLength(report.tasks);
    expect(report.catalog.every((task) => task.href.startsWith("/"))).toBe(true);
  });
});
