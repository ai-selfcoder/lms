/**
 * Deterministic CPU-scheduling simulator (client-side, pure).
 *
 * Given a set of jobs and a policy, produce a Trace: the timeline of CPU
 * segments plus per-job and aggregate metrics. This is the single source of
 * truth for the scheduler visualiser; it never touches the DOM or the network.
 */

export type Policy = "FIFO" | "SJF" | "STCF" | "RR" | "MLFQ";

export interface Job {
  name: string;
  arrival: number;
  burst: number;
}

export interface SchedulerParams {
  policy: Policy;
  jobs: Job[];
  /** Time slice / per-level allotment for RR and MLFQ. Defaults to 1. */
  quantum?: number;
  /** MLFQ: number of priority levels (default 3). */
  levels?: number;
  /** MLFQ: period after which every job is boosted to the top level (0 = off). */
  boostInterval?: number;
}

/** A contiguous slice of CPU time given to one job. */
export interface Segment {
  job: string;
  start: number;
  end: number;
  queueLevel: number;
}

export interface JobMetrics {
  name: string;
  completion: number;
  turnaround: number;
  response: number;
  wait: number;
}

/** Segments + per-job metrics, before aggregate averages are attached. */
type TraceCore = { segments: Segment[]; metrics: JobMetrics[] };

export interface Trace extends TraceCore {
  averages: { turnaround: number; response: number; wait: number };
}

export function cpuScheduler(params: SchedulerParams): Trace {
  const core = run(params);
  return { ...core, averages: averagesOf(core.metrics) };
}

function run(params: SchedulerParams): TraceCore {
  switch (params.policy) {
    case "FIFO":
      return fifo(params.jobs);
    case "SJF":
      return sjf(params.jobs);
    case "STCF":
      return stcf(params.jobs);
    case "RR":
      return rr(params.jobs, params.quantum);
    case "MLFQ":
      return mlfq(params);
    default:
      return fifo(params.jobs);
  }
}

function averagesOf(metrics: JobMetrics[]): Trace["averages"] {
  if (metrics.length === 0) return { turnaround: 0, response: 0, wait: 0 };
  const sum = (pick: (m: JobMetrics) => number) =>
    metrics.reduce((acc, m) => acc + pick(m), 0) / metrics.length;
  return {
    turnaround: sum((m) => m.turnaround),
    response: sum((m) => m.response),
    wait: sum((m) => m.wait),
  };
}

/**
 * Multi-level feedback queue. New jobs enter the top level; a job that uses up
 * its per-level allotment is demoted; the highest non-empty level runs (RR
 * within a level). An optional periodic boost lifts everyone back to the top.
 */
function mlfq(params: SchedulerParams): TraceCore {
  const { jobs } = params;
  const quantum = Math.max(1, params.quantum ?? 1);
  const levels = Math.max(1, params.levels ?? 3);
  const boost = params.boostInterval ?? 0;

  const remaining = jobs.map((j) => j.burst);
  const level = jobs.map(() => 0);
  const used = jobs.map(() => 0); // allotment consumed at the current level
  const released = jobs.map(() => false);
  const queues: number[][] = Array.from({ length: levels }, () => []);
  const ticks: Tick[] = [];
  let done = 0;
  let time = 0;

  const release = (t: number) => {
    jobs
      .map((job, i) => ({ job, i }))
      .filter((x) => !released[x.i] && x.job.arrival <= t)
      .sort((a, b) => a.job.arrival - b.job.arrival || a.i - b.i)
      .forEach((x) => {
        released[x.i] = true;
        queues[0].push(x.i);
      });
  };

  const topLevel = () => queues.findIndex((q) => q.length > 0);

  release(0);

  while (done < jobs.length) {
    // Periodic priority boost: move every live job back to the top level.
    if (boost > 0 && time > 0 && time % boost === 0) {
      for (let lv = 1; lv < levels; lv++) {
        while (queues[lv].length > 0) {
          const i = queues[lv].shift() as number;
          level[i] = 0;
          used[i] = 0;
          queues[0].push(i);
        }
      }
    }

    const lv = topLevel();
    if (lv === -1) {
      const next = Math.min(
        ...jobs.filter((_, i) => !released[i]).map((j) => j.arrival)
      );
      while (time < next) {
        ticks.push(null);
        time += 1;
      }
      release(time);
      continue;
    }

    const i = queues[lv][0]; // front of the highest non-empty level
    ticks.push({ name: jobs[i].name, level: lv });
    remaining[i] -= 1;
    used[i] += 1;
    time += 1;
    release(time); // arrivals during this tick land at the top level

    if (remaining[i] === 0) {
      queues[lv].shift();
      done += 1;
      used[i] = 0;
    } else if (used[i] >= quantum) {
      // Allotment exhausted → demote a level (or stay at the bottom).
      queues[lv].shift();
      used[i] = 0;
      const nextLevel = Math.min(lv + 1, levels - 1);
      level[i] = nextLevel;
      queues[nextLevel].push(i);
    }
    // Otherwise the job keeps the CPU next tick unless a higher level filled.
  }

  return finalize(jobs, ticks);
}

/**
 * Round robin. Each ready job gets at most `quantum` units before rotating to
 * the back of the queue. Jobs that arrive mid-slice are enqueued ahead of the
 * job being preempted (the usual OSTEP convention).
 */
function rr(jobs: Job[], quantumParam?: number): TraceCore {
  const quantum = Math.max(1, quantumParam ?? 1);
  const remaining = jobs.map((j) => j.burst);
  const released = jobs.map(() => false);
  const queue: number[] = [];
  const ticks: Tick[] = [];
  let done = 0;
  let time = 0;

  const release = (t: number) => {
    jobs
      .map((job, i) => ({ job, i }))
      .filter((x) => !released[x.i] && x.job.arrival <= t)
      .sort((a, b) => a.job.arrival - b.job.arrival || a.i - b.i)
      .forEach((x) => {
        released[x.i] = true;
        queue.push(x.i);
      });
  };

  release(0);

  while (done < jobs.length) {
    if (queue.length === 0) {
      const next = Math.min(
        ...jobs.filter((_, i) => !released[i]).map((j) => j.arrival)
      );
      while (time < next) {
        ticks.push(null);
        time += 1;
      }
      release(time);
      continue;
    }

    const i = queue.shift() as number;
    const slice = Math.min(quantum, remaining[i]);
    for (let k = 0; k < slice; k++) {
      ticks.push({ name: jobs[i].name, level: 0 });
      time += 1;
      release(time); // newly-arrived jobs join the queue ahead of the preempted one
    }
    remaining[i] -= slice;
    if (remaining[i] > 0) queue.push(i);
    else done += 1;
  }

  return finalize(jobs, ticks);
}

/** What ran during a single unit time slice, or null when the CPU was idle. */
type Tick = { name: string; level: number } | null;

/**
 * Turn a per-unit timeline into a Trace: merge contiguous slices of the same
 * job into segments and derive per-job metrics. Metrics are returned in input
 * (job array) order so the UI table is stable regardless of run order.
 */
function finalize(jobs: Job[], ticks: Tick[]): TraceCore {
  // Merge contiguous ticks belonging to the same job at the same queue level.
  const segments: Segment[] = [];
  for (let t = 0; t < ticks.length; t++) {
    const tick = ticks[t];
    if (!tick) continue;
    const last = segments[segments.length - 1];
    if (last && last.job === tick.name && last.end === t && last.queueLevel === tick.level) {
      last.end = t + 1;
    } else {
      segments.push({ job: tick.name, start: t, end: t + 1, queueLevel: tick.level });
    }
  }

  const metrics: JobMetrics[] = jobs.map((job) => {
    let firstStart = -1;
    let completion = -1;
    for (let t = 0; t < ticks.length; t++) {
      if (ticks[t]?.name === job.name) {
        if (firstStart === -1) firstStart = t;
        completion = t + 1;
      }
    }
    return {
      name: job.name,
      completion,
      turnaround: completion - job.arrival,
      response: firstStart - job.arrival,
      wait: completion - job.arrival - job.burst,
    };
  });

  return { segments, metrics };
}

/**
 * Preemptive shortest-time-to-completion-first. Re-decides every unit of time
 * and always runs the ready job with the least remaining work.
 */
function stcf(jobs: Job[]): TraceCore {
  const remaining = jobs.map((j) => j.burst);
  const ticks: Tick[] = [];
  let done = 0;
  let time = 0;

  while (done < jobs.length) {
    let pick = -1;
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].arrival <= time && remaining[i] > 0) {
        if (pick === -1 || remaining[i] < remaining[pick]) pick = i;
      }
    }
    if (pick === -1) {
      ticks.push(null); // idle until the next arrival
      time += 1;
      continue;
    }
    ticks.push({ name: jobs[pick].name, level: 0 });
    remaining[pick] -= 1;
    if (remaining[pick] === 0) done += 1;
    time += 1;
  }

  return finalize(jobs, ticks);
}

/**
 * Non-preemptive shortest-job-first. At each scheduling point pick the
 * available job with the smallest burst (ties broken by input order), run it
 * to completion, then re-decide.
 */
function sjf(jobs: Job[]): TraceCore {
  const pending = jobs.map((job, index) => ({ job, index }));
  const segments: Segment[] = [];
  const metrics: JobMetrics[] = [];
  let time = 0;

  while (pending.length > 0) {
    const available = pending.filter((p) => p.job.arrival <= time);
    if (available.length === 0) {
      // CPU idle until the next arrival.
      time = Math.min(...pending.map((p) => p.job.arrival));
      continue;
    }
    available.sort((a, b) => a.job.burst - b.job.burst || a.index - b.index);
    const chosen = available[0];
    pending.splice(pending.indexOf(chosen), 1);

    const start = time;
    const end = start + chosen.job.burst;
    segments.push({ job: chosen.job.name, start, end, queueLevel: 0 });
    metrics.push({
      name: chosen.job.name,
      completion: end,
      turnaround: end - chosen.job.arrival,
      response: start - chosen.job.arrival,
      wait: end - chosen.job.arrival - chosen.job.burst,
    });
    time = end;
  }

  return { segments, metrics };
}

/** Non-preemptive, runs jobs to completion in arrival (then input) order. */
function fifo(jobs: Job[]): TraceCore {
  const order = jobs
    .map((job, index) => ({ job, index }))
    .sort((a, b) => a.job.arrival - b.job.arrival || a.index - b.index);

  const segments: Segment[] = [];
  const metrics: JobMetrics[] = [];
  let time = 0;

  for (const { job } of order) {
    const start = Math.max(time, job.arrival);
    const end = start + job.burst;
    segments.push({ job: job.name, start, end, queueLevel: 0 });
    metrics.push({
      name: job.name,
      completion: end,
      turnaround: end - job.arrival,
      response: start - job.arrival,
      wait: end - job.arrival - job.burst,
    });
    time = end;
  }

  return { segments, metrics };
}
