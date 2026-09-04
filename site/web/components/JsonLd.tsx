/**
 * Renders a JSON-LD <script> for structured data. Server component — emit it
 * anywhere in a page's tree and search engines pick up the graph.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here: it's our own data, no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default JsonLd;
