import { describe, expect, it } from "vitest";
import { diagnosticIsComplete, getDiagnosticRecommendation } from "./diagnostic";

describe("onboarding diagnostic", () => {
  it("does not recommend a route before all three answers", () => {
    expect(diagnosticIsComplete({ experience: "working", blocker: "concurrency" })).toBe(false);
    expect(getDiagnosticRecommendation({ experience: "working", blocker: "concurrency" })).toBeNull();
  });

  it("prioritizes interview intent", () => {
    expect(getDiagnosticRecommendation({ experience: "new", blocker: "syntax", intent: "interview" })?.route).toBe("interview");
  });

  it("routes systems questions to OS labs", () => {
    expect(getDiagnosticRecommendation({ experience: "working", blocker: "systems", intent: "practice" })?.route).toBe("os");
  });

  it("starts beginners with Go basics", () => {
    expect(getDiagnosticRecommendation({ experience: "new", blocker: "concurrency", intent: "path" })?.route).toBe("go-basics");
    expect(getDiagnosticRecommendation({ experience: "working", blocker: "syntax", intent: "practice" })?.route).toBe("go-basics");
  });

  it("sends experienced concurrency learners to practice", () => {
    expect(getDiagnosticRecommendation({ experience: "advanced", blocker: "concurrency", intent: "practice" })?.route).toBe("go");
  });
});

