"use client";

/** Small chip shown while a grade waits in the queue: "В очереди: 3-й из 12". */
export function QueueStatus({
  position,
  queueLength,
}: {
  position: number;
  queueLength: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--label-sm)",
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--warning)",
        }}
      />
      В очереди: {position}-й из {queueLength}
    </span>
  );
}
