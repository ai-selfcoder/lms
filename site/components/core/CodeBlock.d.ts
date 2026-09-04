import React from 'react';

export interface CodeBlockProps {
  code: string;
  /** Optional header with a file glyph, e.g. "worker_pool.go". */
  filename?: string;
  language?: string;
  showLineNumbers?: boolean;
  /** 1-based line numbers to highlight with an accent gutter. */
  highlightLines?: number[];
  style?: React.CSSProperties;
}

/** Tokenize Go source into coloured React spans (uses --code-* tokens). */
export function highlightGo(code: string): React.ReactNode[];

/**
 * Go source block with filename header + line numbers.
 * @dsCard group="Components"
 */
export function CodeBlock(props: CodeBlockProps): JSX.Element;
export default CodeBlock;
