import { describe, it, expect } from "vitest";
import { cpuScheduler } from "./cpuScheduler";

describe("cpuScheduler · FIFO", () => {
  it("runs jobs to completion in arrival order (non-preemptive)", () => {
    const trace = cpuScheduler({
      policy: "FIFO",
      jobs: [
        { name: "A", arrival: 0, burst: 5 },
        { name: "B", arrival: 0, burst: 3 },
        { name: "C", arrival: 0, burst: 1 },
      ],
    });

    // One contiguous segment per job, in arrival/index order.
    expect(trace.segments).toEqual([
      { job: "A", start: 0, end: 5, queueLevel: 0 },
      { job: "B", start: 5, end: 8, queueLevel: 0 },
      { job: "C", start: 8, end: 9, queueLevel: 0 },
    ]);

    // completion / turnaround / response / wait per job.
    expect(trace.metrics).toEqual([
      { name: "A", completion: 5, turnaround: 5, response: 0, wait: 0 },
      { name: "B", completion: 8, turnaround: 8, response: 5, wait: 5 },
      { name: "C", completion: 9, turnaround: 9, response: 8, wait: 8 },
    ]);
  });

  it("idles the CPU until the first job arrives", () => {
    const trace = cpuScheduler({
      policy: "FIFO",
      jobs: [{ name: "A", arrival: 3, burst: 2 }],
    });

    expect(trace.segments).toEqual([
      { job: "A", start: 3, end: 5, queueLevel: 0 },
    ]);
    expect(trace.metrics).toEqual([
      { name: "A", completion: 5, turnaround: 2, response: 0, wait: 0 },
    ]);
  });
});

describe("cpuScheduler · averages", () => {
  it("reports mean turnaround / response / wait across jobs", () => {
    const trace = cpuScheduler({
      policy: "FIFO",
      jobs: [
        { name: "A", arrival: 0, burst: 5 },
        { name: "B", arrival: 0, burst: 3 },
        { name: "C", arrival: 0, burst: 1 },
      ],
    });

    expect(trace.averages.turnaround).toBeCloseTo((5 + 8 + 9) / 3);
    expect(trace.averages.response).toBeCloseTo((0 + 5 + 8) / 3);
    expect(trace.averages.wait).toBeCloseTo((0 + 5 + 8) / 3);
  });

  it("is all-zero for an empty job list", () => {
    const trace = cpuScheduler({ policy: "FIFO", jobs: [] });
    expect(trace.segments).toEqual([]);
    expect(trace.averages).toEqual({ turnaround: 0, response: 0, wait: 0 });
  });
});

describe("cpuScheduler · SJF", () => {
  it("picks the shortest available job (non-preemptive)", () => {
    const trace = cpuScheduler({
      policy: "SJF",
      jobs: [
        { name: "A", arrival: 0, burst: 5 },
        { name: "B", arrival: 0, burst: 3 },
        { name: "C", arrival: 0, burst: 1 },
      ],
    });

    expect(trace.segments).toEqual([
      { job: "C", start: 0, end: 1, queueLevel: 0 },
      { job: "B", start: 1, end: 4, queueLevel: 0 },
      { job: "A", start: 4, end: 9, queueLevel: 0 },
    ]);
  });

  it("does not preempt a running job when a shorter one arrives", () => {
    const trace = cpuScheduler({
      policy: "SJF",
      jobs: [
        { name: "A", arrival: 0, burst: 3 },
        { name: "B", arrival: 2, burst: 1 },
        { name: "C", arrival: 2, burst: 2 },
      ],
    });

    // A is already running at t=2; SJF lets it finish, then chooses B over C.
    expect(trace.segments).toEqual([
      { job: "A", start: 0, end: 3, queueLevel: 0 },
      { job: "B", start: 3, end: 4, queueLevel: 0 },
      { job: "C", start: 4, end: 6, queueLevel: 0 },
    ]);
  });
});

describe("cpuScheduler · STCF", () => {
  it("preempts a running job when a shorter-remaining one arrives", () => {
    const trace = cpuScheduler({
      policy: "STCF",
      jobs: [
        { name: "A", arrival: 0, burst: 3 },
        { name: "B", arrival: 1, burst: 1 },
      ],
    });

    // A starts; B arrives at t=1 with less remaining work and preempts it.
    expect(trace.segments).toEqual([
      { job: "A", start: 0, end: 1, queueLevel: 0 },
      { job: "B", start: 1, end: 2, queueLevel: 0 },
      { job: "A", start: 2, end: 4, queueLevel: 0 },
    ]);

    const a = trace.metrics.find((m) => m.name === "A");
    const b = trace.metrics.find((m) => m.name === "B");
    expect(a).toEqual({ name: "A", completion: 4, turnaround: 4, response: 0, wait: 1 });
    expect(b).toEqual({ name: "B", completion: 2, turnaround: 1, response: 0, wait: 0 });
  });
});

describe("cpuScheduler · RR", () => {
  it("alternates jobs every quantum (quantum = 1)", () => {
    const trace = cpuScheduler({
      policy: "RR",
      quantum: 1,
      jobs: [
        { name: "A", arrival: 0, burst: 3 },
        { name: "B", arrival: 0, burst: 3 },
      ],
    });

    expect(trace.segments).toEqual([
      { job: "A", start: 0, end: 1, queueLevel: 0 },
      { job: "B", start: 1, end: 2, queueLevel: 0 },
      { job: "A", start: 2, end: 3, queueLevel: 0 },
      { job: "B", start: 3, end: 4, queueLevel: 0 },
      { job: "A", start: 4, end: 5, queueLevel: 0 },
      { job: "B", start: 5, end: 6, queueLevel: 0 },
    ]);
    const a = trace.metrics.find((m) => m.name === "A");
    expect(a).toEqual({ name: "A", completion: 5, turnaround: 5, response: 0, wait: 2 });
  });

  it("gives a full quantum then rotates (quantum = 2)", () => {
    const trace = cpuScheduler({
      policy: "RR",
      quantum: 2,
      jobs: [
        { name: "A", arrival: 0, burst: 5 },
        { name: "B", arrival: 0, burst: 3 },
      ],
    });

    expect(trace.segments).toEqual([
      { job: "A", start: 0, end: 2, queueLevel: 0 },
      { job: "B", start: 2, end: 4, queueLevel: 0 },
      { job: "A", start: 4, end: 6, queueLevel: 0 },
      { job: "B", start: 6, end: 7, queueLevel: 0 },
      { job: "A", start: 7, end: 8, queueLevel: 0 },
    ]);
    expect(trace.metrics).toEqual([
      { name: "A", completion: 8, turnaround: 8, response: 0, wait: 3 },
      { name: "B", completion: 7, turnaround: 7, response: 2, wait: 4 },
    ]);
  });
});

describe("cpuScheduler · MLFQ", () => {
  it("demotes a job one level each time it uses up its allotment", () => {
    const trace = cpuScheduler({
      policy: "MLFQ",
      quantum: 1,
      jobs: [
        { name: "A", arrival: 0, burst: 3 },
        { name: "B", arrival: 0, burst: 3 },
      ],
    });

    // Both start at level 0; each tick uses the allotment, demoting a level.
    expect(trace.segments).toEqual([
      { job: "A", start: 0, end: 1, queueLevel: 0 },
      { job: "B", start: 1, end: 2, queueLevel: 0 },
      { job: "A", start: 2, end: 3, queueLevel: 1 },
      { job: "B", start: 3, end: 4, queueLevel: 1 },
      { job: "A", start: 4, end: 5, queueLevel: 2 },
      { job: "B", start: 5, end: 6, queueLevel: 2 },
    ]);
  });

  it("puts a newly-arrived job at the top, preempting a demoted job", () => {
    const trace = cpuScheduler({
      policy: "MLFQ",
      quantum: 2,
      jobs: [
        { name: "A", arrival: 0, burst: 4 },
        { name: "B", arrival: 3, burst: 2 },
      ],
    });

    expect(trace.segments).toEqual([
      { job: "A", start: 0, end: 2, queueLevel: 0 },
      { job: "A", start: 2, end: 3, queueLevel: 1 },
      { job: "B", start: 3, end: 5, queueLevel: 0 },
      { job: "A", start: 5, end: 6, queueLevel: 1 },
    ]);
    expect(trace.metrics).toEqual([
      { name: "A", completion: 6, turnaround: 6, response: 0, wait: 2 },
      { name: "B", completion: 5, turnaround: 2, response: 0, wait: 0 },
    ]);
  });
});
