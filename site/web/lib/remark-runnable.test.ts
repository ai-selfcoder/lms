import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkRunnable } from "./remark-runnable";

async function render(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRunnable)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

describe("remarkRunnable", () => {
  it("turns ```go play into a data-runnable island with base64 code", async () => {
    const html = await render("```go play\npackage main\n```\n");
    expect(html).toContain("data-runnable");
    expect(html).toMatch(/data-code="[A-Za-z0-9+/=]+"/);
  });

  it("leaves a plain ```go block alone", async () => {
    const html = await render("```go\npackage main\n```\n");
    expect(html).not.toContain("data-runnable");
  });
});
