import { describe, expect, it } from "vitest";
import { getTaskContent } from "@/lib/content";

describe("task editorial content", () => {
  it("loads an editor-authored failure-mode note for a Go task", () => {
    const task = getTaskContent("or-channel", "go");
    expect(task?.editorial).toContain("or-channel");
  });

  it("keeps editorial notes optional for tasks without one", () => {
    const task = getTaskContent("03", "os");
    expect(task).not.toBeNull();
    expect(task?.editorial).toBeNull();
  });
});
