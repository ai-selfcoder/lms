export type Difficulty = "easy" | "medium" | "hard";

export interface NavTask {
  id: string;
  num: number;
  title: string;
  slug: string;
  type?: string;
  difficulty?: Difficulty;
}

export interface NavTopic {
  num: number;
  label: string;
  tasks: NavTask[];
}

export interface TaskCore {
  id: string;
  num: number;
  title: string;
  slug: string;
  topic: string;
  type?: string;
  starter: string;
}

export interface TaskNeighbour {
  slug: string;
  title: string;
  num: number;
}

export type TestStatus = "pass" | "fail" | "skip";

export interface TestCaseResult {
  name: string;
  status: TestStatus;
  elapsedMs: number;
}

export interface TestSummary {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}

export interface RunResult {
  pass: boolean;
  output: string;
  durationMs: number;
  timedOut: boolean;
  compileError: boolean;
  error?: boolean;
  // Structured grader output (additive — may be absent on older responses).
  race?: boolean;
  summary?: TestSummary;
  tests?: TestCaseResult[];
}
