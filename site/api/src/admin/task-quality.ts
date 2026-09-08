export type QualityEventType = 'started' | 'run' | 'failed' | 'passed' | 'completed';

export interface QualityEvent {
  userId: string;
  type: QualityEventType;
  itemId: string;
  courseId: string | null;
  occurredAt: Date;
}

export interface TaskQualitySignal {
  courseId: string;
  taskId: string;
  feedback: number;
  failed: number;
  passed: number;
  failureRate: number;
  recoveredUsers: number;
  startedUsers: number;
  completedUsers: number;
}

/**
 * Turns anonymous event rows into editor-facing task signals. Chapters, labs
 * and interview sessions use namespaced item ids; grader task ids are plain.
 */
export function deriveTaskQuality(events: QualityEvent[]): TaskQualitySignal[] {
  type Aggregate = {
    courseId: string;
    taskId: string;
    failed: number;
    passed: number;
    startedUsers: Set<string>;
    completedUsers: Set<string>;
    recoveredUsers: Set<string>;
  };

  const aggregates = new Map<string, Aggregate>();
  const failedBeforePass = new Set<string>();
  const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  for (const event of ordered) {
    // `go:chapter:...`, `os:lab:...`, and `interview:...` are not grader tasks.
    if (event.itemId.includes(':')) continue;
    const courseId = event.courseId || 'go';
    const key = `${courseId}:${event.itemId}`;
    const aggregate = aggregates.get(key) ?? {
      courseId,
      taskId: event.itemId,
      failed: 0,
      passed: 0,
      startedUsers: new Set<string>(),
      completedUsers: new Set<string>(),
      recoveredUsers: new Set<string>(),
    };
    aggregates.set(key, aggregate);

    if (event.type === 'started') aggregate.startedUsers.add(event.userId);
    if (event.type === 'completed') aggregate.completedUsers.add(event.userId);
    if (event.type === 'failed') {
      aggregate.failed += 1;
      failedBeforePass.add(`${key}:${event.userId}`);
    }
    if (event.type === 'passed') {
      aggregate.passed += 1;
      if (failedBeforePass.has(`${key}:${event.userId}`)) {
        aggregate.recoveredUsers.add(event.userId);
      }
    }
  }

  return [...aggregates.values()]
    .map((aggregate) => {
      const feedback = aggregate.failed + aggregate.passed;
      return {
        courseId: aggregate.courseId,
        taskId: aggregate.taskId,
        feedback,
        failed: aggregate.failed,
        passed: aggregate.passed,
        failureRate: feedback ? Math.round((aggregate.failed / feedback) * 100) : 0,
        recoveredUsers: aggregate.recoveredUsers.size,
        startedUsers: aggregate.startedUsers.size,
        completedUsers: aggregate.completedUsers.size,
      };
    })
    // Sparse data is not a useful editorial signal. Three grader responses is
    // the same minimum evidence used by the anonymous quality leaderboard.
    .filter((item) => item.feedback >= 3)
    .sort((a, b) => b.failureRate - a.failureRate || b.failed - a.failed || b.feedback - a.feedback);
}
