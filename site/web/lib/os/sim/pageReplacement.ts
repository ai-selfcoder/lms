/**
 * Deterministic page-replacement simulator (client-side, pure).
 *
 * Runs a reference string against a fixed number of frames under a replacement
 * policy and returns, for every access, whether it hit or missed, the frame
 * snapshot afterwards, and which page (if any) was evicted. Slots are
 * positional: a slot keeps its index across the run so the UI grid is stable.
 */

export type ReplPolicy = "FIFO" | "LRU" | "CLOCK" | "OPT";

export interface ReplParams {
  refs: number[];
  capacity: number;
  policy: ReplPolicy;
}

export interface ReplStep {
  ref: number;
  hit: boolean;
  /** Frame contents after handling this access (null = empty slot). */
  frames: (number | null)[];
  /** Page evicted to make room, or null. */
  victim: number | null;
  /** Slot index touched (filled/replaced), or -1 on a pure hit/edge. */
  slot: number;
}

export interface ReplTrace {
  steps: ReplStep[];
  hits: number;
  misses: number;
  hitRate: number;
}

export function pageReplacement(params: ReplParams): ReplTrace {
  const { refs, policy } = params;
  const capacity = Math.trunc(params.capacity);
  const steps: ReplStep[] = [];
  let hits = 0;
  let misses = 0;

  // Degenerate: no frames at all → every access is a compulsory miss.
  if (capacity < 1) {
    for (const ref of refs) {
      misses++;
      steps.push({ ref, hit: false, frames: [], victim: null, slot: -1 });
    }
    return { steps, hits, misses, hitRate: 0 };
  }

  const slots: (number | null)[] = Array(capacity).fill(null);
  const fifoOrder: number[] = []; // slot indices, oldest first
  const lastUsed = new Map<number, number>(); // page → last access time (LRU)
  const refbit: number[] = Array(capacity).fill(0); // CLOCK
  let hand = 0; // CLOCK hand

  for (let t = 0; t < refs.length; t++) {
    const page = refs[t];
    const here = slots.indexOf(page);

    if (here >= 0) {
      hits++;
      if (policy === "LRU") lastUsed.set(page, t);
      if (policy === "CLOCK") refbit[here] = 1;
      steps.push({ ref: page, hit: true, frames: [...slots], victim: null, slot: -1 });
      continue;
    }

    misses++;
    let slot = slots.indexOf(null); // first free slot
    let victim: number | null = null;

    if (slot < 0) {
      slot = chooseVictim(policy, { slots, fifoOrder, lastUsed, refbit, refs, t, capacity, handRef: () => hand, setHand: (h) => (hand = h) });
      victim = slots[slot];
      if (policy === "LRU") lastUsed.delete(victim as number);
    }

    slots[slot] = page;
    // bookkeeping per policy
    const k = fifoOrder.indexOf(slot);
    if (k >= 0) fifoOrder.splice(k, 1);
    fifoOrder.push(slot);
    if (policy === "LRU") lastUsed.set(page, t);
    if (policy === "CLOCK") refbit[slot] = 1;

    steps.push({ ref: page, hit: false, frames: [...slots], victim, slot });
  }

  return { steps, hits, misses, hitRate: refs.length ? hits / refs.length : 0 };
}

interface VictimCtx {
  slots: (number | null)[];
  fifoOrder: number[];
  lastUsed: Map<number, number>;
  refbit: number[];
  refs: number[];
  t: number;
  capacity: number;
  handRef: () => number;
  setHand: (h: number) => void;
}

function chooseVictim(policy: ReplPolicy, c: VictimCtx): number {
  switch (policy) {
    case "FIFO":
      return c.fifoOrder.length ? c.fifoOrder[0] : 0;

    case "LRU": {
      let slot = 0;
      let oldest = Infinity;
      for (let i = 0; i < c.slots.length; i++) {
        const used = c.lastUsed.get(c.slots[i] as number) ?? -1;
        if (used < oldest) {
          oldest = used;
          slot = i;
        }
      }
      return slot;
    }

    case "CLOCK": {
      let hand = c.handRef();
      // Advance giving second chances: clear reference bits until one is 0.
      for (let guard = 0; guard < c.capacity * 2 + 1; guard++) {
        if (c.refbit[hand] === 0) break;
        c.refbit[hand] = 0;
        hand = (hand + 1) % c.capacity;
      }
      const victim = hand;
      c.setHand((hand + 1) % c.capacity);
      return victim;
    }

    case "OPT": {
      // Evict the page whose next use is farthest in the future (or never).
      let slot = 0;
      let farthest = -1;
      for (let i = 0; i < c.slots.length; i++) {
        const page = c.slots[i] as number;
        let next = Infinity;
        for (let k = c.t + 1; k < c.refs.length; k++) {
          if (c.refs[k] === page) {
            next = k;
            break;
          }
        }
        if (next > farthest) {
          farthest = next;
          slot = i;
        }
      }
      return slot;
    }

    default:
      return 0;
  }
}
