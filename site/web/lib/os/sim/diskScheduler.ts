/**
 * Deterministic disk-scheduling simulator (client-side, pure).
 *
 * Given a starting head position and a list of cylinder requests, computes the
 * service order, the per-move distances and the total head travel under a
 * scheduling policy. Used to visualise why random access is expensive and how
 * SSTF/SCAN cut head movement vs naive FIFO. Never touches DOM or network.
 */

export type DiskPolicy = "FIFO" | "SSTF" | "SCAN";

export interface DiskParams {
  start: number;
  requests: number[];
  policy: DiskPolicy;
}

export interface DiskStep {
  from: number;
  to: number;
  distance: number;
}

export interface DiskTrace {
  start: number;
  order: number[];
  steps: DiskStep[];
  total: number;
}

export function diskScheduler(params: DiskParams): DiskTrace {
  const start = Math.trunc(params.start);
  const reqs = params.requests.filter((n) => Number.isFinite(n)).map((n) => Math.trunc(n));
  const order = orderOf(params.policy, start, reqs);

  const steps: DiskStep[] = [];
  let pos = start;
  let total = 0;
  for (const to of order) {
    const distance = Math.abs(to - pos);
    steps.push({ from: pos, to, distance });
    total += distance;
    pos = to;
  }
  return { start, order, steps, total };
}

function orderOf(policy: DiskPolicy, start: number, reqs: number[]): number[] {
  switch (policy) {
    case "FIFO":
      return [...reqs];

    case "SSTF": {
      const remaining = [...reqs];
      const order: number[] = [];
      let pos = start;
      while (remaining.length > 0) {
        let best = 0;
        for (let i = 1; i < remaining.length; i++) {
          const d = Math.abs(remaining[i] - pos);
          const bd = Math.abs(remaining[best] - pos);
          // nearest; tie → smaller cylinder
          if (d < bd || (d === bd && remaining[i] < remaining[best])) best = i;
        }
        pos = remaining[best];
        order.push(pos);
        remaining.splice(best, 1);
      }
      return order;
    }

    case "SCAN": {
      // Elevator: sweep up servicing reqs >= start (ascending), then sweep
      // down servicing reqs < start (descending). Reverses at the extreme
      // request, not the disk edge.
      const up = reqs.filter((r) => r >= start).sort((a, b) => a - b);
      const down = reqs.filter((r) => r < start).sort((a, b) => b - a);
      return [...up, ...down];
    }

    default:
      return [...reqs];
  }
}
