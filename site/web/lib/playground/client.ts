// One playground worker per page. Serializes runs and adds a watchdog: if the
// worker doesn't answer within timeoutMs, terminate() it and recreate.
export interface RunOutput {
  stdout: string;
  stderr: string;
  err: string;
  durationMs: number;
  timedOut: boolean;
}

type WorkerFactory = () => Worker;

let factory: WorkerFactory = () =>
  new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

// For tests.
export function __setWorkerFactory(f: WorkerFactory) {
  factory = f;
  worker = null;
}

let worker: Worker | null = null;
let seq = 0;
let chain: Promise<unknown> = Promise.resolve();

function getWorker(): Worker {
  if (!worker) worker = factory();
  return worker;
}

const DEFAULT_TIMEOUT = 5000;

function once(code: string, timeoutMs: number): Promise<RunOutput> {
  const w = getWorker();
  const id = ++seq;
  return new Promise<RunOutput>((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      w.onmessage = null;
      w.terminate();
      worker = null; // next run recreates the worker
      resolve({ stdout: "", stderr: "", err: "", durationMs: timeoutMs, timedOut: true });
    }, timeoutMs);

    w.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; id?: number } & Partial<RunOutput>;
      if (msg.type === "loading" || msg.type === "ready") return;
      if (msg.type !== "result" || msg.id !== id) return;
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({
        stdout: msg.stdout ?? "",
        stderr: msg.stderr ?? "",
        err: msg.err ?? "",
        durationMs: msg.durationMs ?? 0,
        timedOut: false,
      });
    };
    w.postMessage({ type: "run", id, code });
  });
}

// Public API: runs are serialized so one worker's replies don't interleave.
export function runCode(code: string, opts?: { timeoutMs?: number }): Promise<RunOutput> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT;
  const run = () => once(code, timeoutMs);
  const result = chain.then(run, run);
  chain = result.catch(() => undefined);
  return result;
}
