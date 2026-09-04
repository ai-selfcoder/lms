import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import { remarkRunnable } from "./remark-runnable";

/**
 * Render trusted authored Markdown/MDX-lite content to HTML.
 *
 * The content tree is authored as Markdown with code fences and links — but
 * sometimes contains Go syntax in prose (`<-chan`, generics, braces) that the
 * strict MDX/JSX parser rejects. A plain Markdown pipeline treats those as
 * literal text, so it is both safer and more robust for partially-generated
 * content. Content is fully trusted (our own repo), so raw HTML is not enabled
 * and there is no XSS surface from user input here.
 */

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRunnable)
  .use(remarkRehype) // allowDangerousHtml off: literal '<' stays escaped text
  .use(rehypeSlug)
  .use(rehypePrettyCode, {
    theme: "github-dark-dimmed",
    keepBackground: false,
    defaultLang: "go",
  })
  .use(rehypeAutolinkHeadings, {
    behavior: "wrap",
    properties: { className: ["heading-anchor"] },
  })
  .use(rehypeStringify);

export async function renderMarkdown(source: string): Promise<string> {
  const file = await processor.process(source);
  return String(file);
}
