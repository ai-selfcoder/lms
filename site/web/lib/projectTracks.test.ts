import { describe, expect, it } from "vitest";
import { findTaskMeta, getBookChapters, getSim } from "./content";
import { PROJECT_TRACKS } from "./projectTracks";

describe("project track links", () => {
  it("resolve every declared task, chapter, and lab", () => {
    for (const track of PROJECT_TRACKS) {
      expect(track.steps.length).toBeGreaterThanOrEqual(3);
      for (const step of track.steps) {
        if (step.kind === "task") {
          const slug = step.href.split("/").pop();
          expect(slug && findTaskMeta(slug, "go"), `${track.id}: ${step.href}`).toBeTruthy();
        } else if (step.kind === "chapter") {
          const slug = step.href.split("/").pop();
          expect(slug && getBookChapters("os").some((chapter) => chapter.slug === slug), `${track.id}: ${step.href}`).toBe(true);
        } else {
          const id = step.href.split("/").pop();
          expect(id && getSim(id, "os"), `${track.id}: ${step.href}`).toBeTruthy();
        }
      }
    }
  });
});
