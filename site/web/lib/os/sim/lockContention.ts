/**
 * Deterministic lock-contention simulator (client-side, pure).
 *
 * Models several threads competing for ONE lock. Each thread wants the lock at
 * its `arrival` time and holds it for `work` time units inside its critical
 * section. Threads acquire in arrival order (FIFO); a thread that arrives while
 * the lock is busy waits. Produces per-thread wait/hold segments so the UI can
 * draw a timeline showing serialisation and wasted waiting. Pure.
 */

export interface LockThread {
  name: string;
  arrival: number;
  work: number;
}

export interface LockSeg {
  name: string;
  kind: "wait" | "hold";
  start: number;
  end: number;
}

export interface LockTrace {
  segments: LockSeg[];
  totalWait: number;
  finish: number;
}

export function lockContention(threads: LockThread[]): LockTrace {
  const order = threads
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t.work > 0)
    .sort((a, b) => a.t.arrival - b.t.arrival || a.i - b.i);

  const segments: LockSeg[] = [];
  let lockFreeAt = 0;
  let totalWait = 0;
  let finish = 0;

  for (const { t } of order) {
    const arrival = Math.max(0, t.arrival);
    const acquire = Math.max(arrival, lockFreeAt);
    if (acquire > arrival) {
      segments.push({ name: t.name, kind: "wait", start: arrival, end: acquire });
      totalWait += acquire - arrival;
    }
    const release = acquire + t.work;
    segments.push({ name: t.name, kind: "hold", start: acquire, end: release });
    lockFreeAt = release;
    finish = Math.max(finish, release);
  }

  return { segments, totalWait, finish };
}
