/// <reference lib="webworker" />
// Playground worker: lazily loads play.wasm (yaegi) and runs code.
// Protocol:
//   main -> worker: { type: "run", id, code }
//   worker -> main: { type: "loading" } | { type: "ready" }
//                 | { type: "result", id, stdout, stderr, err, durationMs }
// The global tsconfig ships the DOM lib, which already declares `self` as a
// Window. We can't redeclare it, so we cast it to the worker shape we need via
// a typed local alias instead.
interface WorkerSelf {
  postMessage(message: unknown): void;
  onmessage: ((e: MessageEvent) => void) | null;
  importScripts(...urls: string[]): void;
  runGo?: (code: string) => RunGoResult;
  __goReady?: () => void;
  Go?: new () => GoInstance;
}
const ctx = self as unknown as WorkerSelf;

interface RunGoResult {
  stdout: string;
  stderr: string;
  err: string;
  durationMs: number;
}
interface GoInstance {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
}

let readyPromise: Promise<void> | null = null;

async function instantiate(
  res: Response,
  imports: WebAssembly.Imports,
): Promise<WebAssembly.Instance> {
  // Prefer streaming; fall back to ArrayBuffer if streaming is unavailable or
  // the response mime type isn't application/wasm.
  if (typeof WebAssembly.instantiateStreaming === "function") {
    try {
      // Stream from a clone so a streaming failure (e.g. wrong mime type) leaves
      // the original `res` body intact for the ArrayBuffer fallback below.
      const { instance } = await WebAssembly.instantiateStreaming(res.clone(), imports);
      return instance;
    } catch {
      // fall through to the ArrayBuffer path using the still-unread `res` body
    }
  }
  const bytes = await res.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, imports);
  return instance;
}

function ensureReady(): Promise<void> {
  if (readyPromise) return readyPromise;
  ctx.postMessage({ type: "loading" });
  readyPromise = (async () => {
    // wasm_exec.js defines self.Go
    ctx.importScripts("/play/wasm_exec.js");
    const go = new ctx.Go!();
    const res = await fetch("/play/play.wasm");
    const instance = await instantiate(res, go.importObject);
    const ready = new Promise<void>((resolve) => {
      ctx.__goReady = () => resolve();
    });
    void go.run(instance); // blocks on select{} — do NOT await
    await ready; // wait until Go registered runGo
    ctx.postMessage({ type: "ready" });
  })();
  return readyPromise;
}

ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data as { type: string; id?: number; code?: string };
  if (msg.type !== "run" || typeof msg.id !== "number") return;
  try {
    await ensureReady();
    const r = ctx.runGo!(msg.code ?? "");
    ctx.postMessage({
      type: "result",
      id: msg.id,
      stdout: r.stdout,
      stderr: r.stderr,
      err: r.err,
      durationMs: r.durationMs,
    });
  } catch (err) {
    ctx.postMessage({
      type: "result",
      id: msg.id,
      stdout: "",
      stderr: "",
      err: err instanceof Error ? err.message : String(err),
      durationMs: 0,
    });
  }
};
