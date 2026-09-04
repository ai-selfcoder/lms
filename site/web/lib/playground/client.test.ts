import { describe, it, expect, vi, beforeEach } from "vitest";
import { runCode, __setWorkerFactory, RunOutput } from "./client";

// Controllable fake worker.
class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  posted: unknown[] = [];
  terminated = false;
  postMessage(m: unknown) {
    this.posted.push(m);
    const msg = m as { type: string; id: number; code: string };
    if (msg.type === "run" && msg.code !== "LOOP") {
      queueMicrotask(() =>
        this.onmessage?.({
          data: { type: "result", id: msg.id, stdout: "OK", stderr: "", err: "", durationMs: 1 },
        })
      );
    }
    // code === "LOOP" -> never answers (simulates for{})
  }
  terminate() { this.terminated = true; }
}

let last: FakeWorker;
beforeEach(() => {
  __setWorkerFactory(() => {
    last = new FakeWorker();
    return last as unknown as Worker;
  });
});

describe("runCode", () => {
  it("returns stdout of a successful run", async () => {
    const out: RunOutput = await runCode("print");
    expect(out.stdout).toBe("OK");
    expect(out.timedOut).toBe(false);
  });

  it("on timeout terminates the worker and marks timedOut", async () => {
    vi.useFakeTimers();
    const p = runCode("LOOP", { timeoutMs: 1000 });
    await vi.advanceTimersByTimeAsync(1001);
    const out = await p;
    expect(out.timedOut).toBe(true);
    expect(last.terminated).toBe(true);
    vi.useRealTimers();
  });
});
