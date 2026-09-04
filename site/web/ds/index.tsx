"use client";

// Баррель дизайн-системы goroutine. Все потребители импортируют компоненты
// отсюда (это клиентская граница: компоненты используют React-хуки).
export { Button } from "./core/Button";
export { Badge } from "./core/Badge";
export { Card } from "./core/Card";
export { SegmentedControl } from "./core/SegmentedControl";
export { ProgressBar } from "./core/ProgressBar";
export { CodeBlock, highlightGo } from "./core/CodeBlock";
export { Terminal } from "./core/Terminal";
export { Callout } from "./core/Callout";
export { TaskListItem } from "./core/TaskListItem";
export { Kbd } from "./core/Kbd";
export { Logo } from "./core/Logo";

export type { TerminalStatus } from "./core/Terminal";
