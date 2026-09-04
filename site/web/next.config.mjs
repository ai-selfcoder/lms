/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle — small runtime image for Docker / Coolify.
  // Run with `node server.js` from the web dir so `../content` still resolves.
  output: "standalone",
  // Content lives outside web/ (../content) and is read via fs at server time.
  // Allow tracing files outside the app dir for standalone output / Vercel.
  outputFileTracingRoot: process.cwd(),
  // The Go course moved from root paths into its own /go section. Permanently
  // redirect the legacy URLs so old links / bookmarks keep working.
  async redirects() {
    return [
      { source: "/book", destination: "/go/book", permanent: true },
      { source: "/book/:slug", destination: "/go/book/:slug", permanent: true },
      { source: "/topics", destination: "/go/topics", permanent: true },
      { source: "/topics/:n", destination: "/go/topics/:n", permanent: true },
      { source: "/tasks/:slug", destination: "/go/tasks/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
