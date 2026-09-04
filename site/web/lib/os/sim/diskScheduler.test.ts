import { describe, it, expect } from "vitest";
import { diskScheduler } from "./diskScheduler";

const reqs = [10, 20, 60, 70];

describe("diskScheduler", () => {
  it("FIFO serves in arrival order", () => {
    const r = diskScheduler({ start: 50, requests: reqs, policy: "FIFO" });
    expect(r.order).toEqual([10, 20, 60, 70]);
    expect(r.total).toBe(100); // 40+10+40+10
  });

  it("SSTF always takes the nearest cylinder", () => {
    const r = diskScheduler({ start: 50, requests: reqs, policy: "SSTF" });
    expect(r.order).toEqual([60, 70, 20, 10]);
    expect(r.total).toBe(80);
  });

  it("SCAN sweeps up then down", () => {
    const r = diskScheduler({ start: 50, requests: reqs, policy: "SCAN" });
    expect(r.order).toEqual([60, 70, 20, 10]);
    expect(r.total).toBe(80); // (70-50)+(70-10)
  });

  it("handles empty requests", () => {
    const r = diskScheduler({ start: 50, requests: [], policy: "SSTF" });
    expect(r.total).toBe(0);
    expect(r.order).toEqual([]);
  });

  it("SSTF breaks ties toward the smaller cylinder", () => {
    const r = diskScheduler({ start: 50, requests: [40, 60], policy: "SSTF" });
    expect(r.order).toEqual([40, 60]);
  });
});
