import { describe, expect, it } from "vitest";
import { getCourse, getCourses } from "@/lib/courses";

describe("course registry versions", () => {
  it("exposes a published semver snapshot for every course", () => {
    const courses = getCourses();
    expect(courses.length).toBe(3);
    for (const course of courses) {
      expect(course.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(course.versionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("resolves version metadata through id and slug aliases", () => {
    expect(getCourse("go")?.version).toBe("0.4.0");
    expect(getCourse("go-basics")?.versionDate).toBe("2026-09-06");
  });
});
