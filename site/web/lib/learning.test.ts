import { describe, expect, it } from "vitest";
import { getCourseStartItem, getLearningItem, getLearningItems, getTaskLearningContext } from "./learning";

describe("learning item registry", () => {
  it("derives chapter and task items for every course", () => {
    for (const course of ["go-basics", "go", "os"]) {
      const items = getLearningItems(course);
      expect(items.length).toBeGreaterThan(0);
      expect(getCourseStartItem(course)?.kind).toBe("chapter");
      expect(items.every((item) => item.href.startsWith("/"))).toBe(true);
    }
  });

  it("includes every OS lab as a linked learning item", () => {
    const items = getLearningItems("os");
    const labs = items.filter((item) => item.kind === "lab");
    expect(labs).toHaveLength(10);
    expect(labs.every((lab) => lab.href.startsWith("/os/sim/"))).toBe(true);
    expect(labs.every((lab) => lab.relatedTheoryId && lab.prerequisites.includes(lab.relatedTheoryId))).toBe(true);
    for (const lab of labs) expect(getLearningItem(lab.id)?.id).toBe(lab.id);
  });

  it("links a chapter to the labs that make its theory observable", () => {
    const scheduling = getLearningItems("os").find((item) => item.id === "os:chapter:scheduling");
    expect(scheduling?.relatedLabIds).toEqual(["os:lab:convoy", "os:lab:rr"]);
  });

  it("resolves relationships without dangling prerequisite ids", () => {
    const items = getLearningItems("go");
    const ids = new Set(items.map((item) => item.id));
    for (const item of items) for (const prerequisite of item.prerequisites) expect(ids.has(prerequisite)).toBe(true);
    expect(getLearningItem(items[0].id)?.id).toBe(items[0].id);
  });

  it("builds a serializable context for the task workspace", () => {
    const context = getTaskLearningContext("go:task:10");
    expect(context?.prerequisites[0]?.href).toBe("/go/tasks/fan-in-merge");
    expect(context?.theory?.href.startsWith("/go/book/")).toBe(true);
    expect(context?.next?.href).toBe("/go/tasks/stage-pipeline");
    expect(context?.similar).toMatchObject({ href: expect.stringMatching(/^\/go\/tasks\//) });
    expect(context?.similar?.href).not.toBe("/go/tasks/stage-pipeline");
  });
});
