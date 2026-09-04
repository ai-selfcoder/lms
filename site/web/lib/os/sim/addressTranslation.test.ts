import { describe, it, expect } from "vitest";
import { translate, toBits } from "./addressTranslation";

describe("translate · base-bound", () => {
  const p = { mode: "base-bound" as const, vaBits: 16, base: 32768, bound: 16384 };

  it("translates an in-bounds address", () => {
    const r = translate({ ...p, va: 100 });
    expect(r.ok).toBe(true);
    expect(r.pa).toBe(32868);
  });

  it("rejects va == bound (off by one)", () => {
    const r = translate({ ...p, va: 16384 });
    expect(r.ok).toBe(false);
    expect(r.pa).toBeNull();
  });

  it("rejects negative va", () => {
    expect(translate({ ...p, va: -5 }).ok).toBe(false);
  });
});

describe("translate · paging", () => {
  const p = { mode: "paging" as const, vaBits: 8, pageBits: 4, table: [2, -1, 5] };

  it("splits the address and follows the table", () => {
    const r = translate({ ...p, va: 35 });
    expect(r.vpn).toBe(2);
    expect(r.offset).toBe(3);
    expect(r.pfn).toBe(5);
    expect(r.pa).toBe(83); // 5*16 + 3
    expect(r.ok).toBe(true);
  });

  it("faults on an invalid (negative) table entry", () => {
    const r = translate({ ...p, va: 20 }); // vpn=1 → -1
    expect(r.ok).toBe(false);
    expect(r.pa).toBeNull();
  });

  it("faults when VPN is outside the table", () => {
    const r = translate({ ...p, va: 48 }); // vpn=3, table len 3
    expect(translate({ ...p, va: 48 }).ok).toBe(false);
    expect(r.vpn).toBe(3);
  });

  it("keeps frame 0 as a valid mapping", () => {
    const r = translate({ mode: "paging", vaBits: 8, pageBits: 4, table: [0], va: 5 });
    expect(r.ok).toBe(true);
    expect(r.pa).toBe(5); // 0*16 + 5
  });
});

describe("translate · paging + TLB", () => {
  const p = { mode: "paging" as const, vaBits: 8, pageBits: 4, table: [2, -1, 5] };

  it("TLB hit translates without faulting and is marked", () => {
    const r = translate({ ...p, tlb: [2], va: 35 }); // vpn 2 cached
    expect(r.ok).toBe(true);
    expect(r.tlbHit).toBe(true);
    expect(r.pa).toBe(83);
  });

  it("TLB miss falls back to the table (still resolves)", () => {
    const r = translate({ ...p, tlb: [0], va: 35 }); // vpn 2 not cached
    expect(r.ok).toBe(true);
    expect(r.tlbHit).toBe(false);
    expect(r.pa).toBe(83);
  });

  it("a cached-but-invalid VPN is not a hit", () => {
    const r = translate({ ...p, tlb: [1], va: 20 }); // vpn 1 → table -1
    expect(r.tlbHit).toBe(false);
    expect(r.ok).toBe(false);
  });
});

describe("translate · multi-level", () => {
  const multi = [[3, -1, 5, -1], null, [0, 1, -1, 2], null];
  const p = { mode: "multi-level" as const, vaBits: 8, pageBits: 4, levelBits: [2, 2], multi };

  it("walks both levels to a frame", () => {
    const r = translate({ ...p, va: 35 }); // L1=0, L2=2, off=3
    expect(r.l1).toBe(0);
    expect(r.l2).toBe(2);
    expect(r.offset).toBe(3);
    expect(r.pa).toBe(83); // frame 5 · 16 + 3
    expect(r.ok).toBe(true);
  });

  it("faults when the outer sub-table is not allocated", () => {
    const r = translate({ ...p, va: 64 }); // L1=1 → null
    expect(r.l1).toBe(1);
    expect(r.ok).toBe(false);
  });

  it("faults on an invalid inner entry", () => {
    const r = translate({ ...p, va: 16 }); // L1=0, L2=1 → -1
    expect(r.ok).toBe(false);
  });
});

describe("toBits", () => {
  it("zero-pads to width", () => {
    expect(toBits(5, 4)).toBe("0101");
    expect(toBits(0, 3)).toBe("000");
  });
});
