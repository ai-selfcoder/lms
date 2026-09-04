/**
 * Split an authored OS chapter body into an ordered list of blocks. The content
 * pipeline renders Markdown → HTML (no JSX), so interactive widgets are authored
 * as standalone marker lines (`<Sim id="…" />`, `<Quiz id="…" />`). This parser
 * pulls those markers out so the page can render markdown segments as prose and
 * the markers as React components, in order. Pure / unit-tested.
 */

export type Block =
  | { type: "md"; content: string }
  | { type: "sim"; id: string }
  | { type: "quiz"; id: string };

const MARKER = /^\s*<(Sim|Quiz)\s+id="([^"]+)"\s*\/>\s*$/;

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text.length > 0) blocks.push({ type: "md", content: text });
    buffer.length = 0;
  };

  for (const line of source.split("\n")) {
    const m = line.match(MARKER);
    if (m) {
      flush();
      blocks.push({ type: m[1] === "Sim" ? "sim" : "quiz", id: m[2] });
    } else {
      buffer.push(line);
    }
  }
  flush();

  return blocks;
}
