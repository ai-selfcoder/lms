import React from 'react';

export interface TaskListItemProps {
  index: number;
  title: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'solved' | 'attempted' | 'todo';
  /** Code-review tasks get a magnifier glyph. */
  type?: 'functional' | 'review';
  active?: boolean;
  /** Icon-only rail mode for the collapsed sidebar. */
  collapsed?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * A task row in the trainer's left navigator (index, title, difficulty, solved check).
 * @dsCard group="Components"
 */
export function TaskListItem(props: TaskListItemProps): JSX.Element;
export default TaskListItem;
