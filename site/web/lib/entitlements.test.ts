import { describe, expect, it } from "vitest";
import { canUseFeature, effectivePlans } from "./entitlements";

describe("product entitlements", () => {
  it("always preserves the free foundation and ignores unknown grants", () => {
    expect(effectivePlans(["PRO", "UNKNOWN"])).toEqual(["FREE", "PRO"]);
  });

  it("keeps the first verified result open while gating professional features", () => {
    const free = effectivePlans();
    expect(canUseFeature("first_pass", free)).toBe(true);
    expect(canUseFeature("projects", free)).toBe(false);
    expect(canUseFeature("projects", effectivePlans(["PRO"]))).toBe(true);
  });
});
