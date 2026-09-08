import { describe, expect, it } from "vitest";
import { getChangelog } from "@/lib/changelog";

describe("changelog", () => {
  it("loads valid entries in reverse chronological order", () => {
    const entries = getChangelog();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].version).toBe("0.4.0");
    expect(entries[0].date >= entries[entries.length - 1].date).toBe(true);
    expect(entries.every((entry) => entry.links.every((link) => link.href.startsWith("/")))).toBe(true);
    expect(entries.every((entry) => entry.courses.length > 0)).toBe(true);
    expect(entries[0].courses).toContain("go");
  });
});
