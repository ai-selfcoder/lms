import React from 'react';

export type TerminalStatus = 'idle' | 'running' | 'pass' | 'fail' | 'timeout' | 'compile';

export interface TerminalProps {
  status?: TerminalStatus;
  /** Raw `go test -race` output; lines are colourised by leading token. */
  output?: string;
  /** e.g. "1.84s". */
  duration?: string;
  /** Command shown in the header. */
  title?: string;
  /** Body height in px. */
  height?: number;
  style?: React.CSSProperties;
}

/**
 * The test-runner console — verdict header over raw `go test -race` output.
 * @dsCard group="Components"
 */
export function Terminal(props: TerminalProps): JSX.Element;
export default Terminal;
