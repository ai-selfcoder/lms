// remark plugin: a ```go play fence becomes an island the client hydrates into
// <Runnable>. The output element is shaped via mdast-util-to-hast hints
// (hName/hProperties/hChildren) — no raw HTML / allowDangerousHtml needed. The
// inner <pre><code> is a static no-JS fallback. The source goes into data-code
// (base64) so the client can mount <Runnable> without re-parsing.
import type { Plugin } from "unified";
import type { Root, Code } from "mdast";
import { visit } from "unist-util-visit";

function b64(s: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(s, "utf8").toString("base64");
  // eslint-disable-next-line no-undef
  return btoa(unescape(encodeURIComponent(s)));
}

export const remarkRunnable: Plugin<[], Root> = () => (tree) => {
  visit(tree, "code", (node: Code) => {
    if (node.lang !== "go") return;
    if (!/\bplay\b/.test(node.meta ?? "")) return;
    const source = node.value;
    node.data = {
      ...node.data,
      hName: "div",
      hProperties: { dataRunnable: "", dataCode: b64(source) },
      hChildren: [
        {
          type: "element",
          tagName: "pre",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "code",
              properties: {},
              children: [{ type: "text", value: source }],
            },
          ],
        },
      ],
    };
  });
};
