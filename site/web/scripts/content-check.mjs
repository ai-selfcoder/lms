import { readdir, readFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { checkManifest } from "./content-manifest.mjs";

const content = resolve(process.cwd(), "..", "content");
const courses = JSON.parse(await readFile(join(content, "courses.json"), "utf8"));
const errors = [];
errors.push(...await checkManifest());
const exists = async (file) => access(file).then(() => true).catch(() => false);
const semver = /^\d+\.\d+\.\d+$/;
let changelogEntries = [];
const routes = new Set(["/", "/account", "/account/report", "/auth", "/projects", "/teams", "/changelog", "/go", "/go/book", "/go/practice", "/go/skills", "/go/interview", "/go/topics", "/os", "/os/book", "/os/labs", "/os/sim/scheduler"]);
const linkRefs = [];
const normalizeRoute = (href) => {
  const clean = href.replace(/[?#].*$/, "").replace(/\/$/, "") || "/";
  if (clean === "/book") return "/go/book";
  if (clean.startsWith("/book/")) return `/go${clean}`;
  if (clean === "/topics") return "/go/topics";
  if (clean.startsWith("/topics/")) return `/go${clean}`;
  if (clean.startsWith("/tasks/")) return `/go${clean}`;
  return clean;
};
const collectLinks = (source, label) => {
  for (const match of source.matchAll(/\]\(\s*(\/[^)#?\s]+)(?:[?#][^)]*)?\s*\)/g)) linkRefs.push({ href: match[1], label });
};

const changelogFile = join(content, "changelog.json");
if (await exists(changelogFile)) {
  try {
    const changelog = JSON.parse(await readFile(changelogFile, "utf8"));
    if (!Array.isArray(changelog)) errors.push("changelog.json: expected an array");
    else {
      changelogEntries = changelog;
      const versions = new Set();
      for (const [index, entry] of changelog.entries()) {
        const label = `changelog[${index}]`;
        if (!entry || typeof entry !== "object") { errors.push(`${label}: expected an object`); continue; }
        if (!entry.version || versions.has(entry.version)) errors.push(`${label}: duplicate or missing version`);
        versions.add(entry.version);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? "")) errors.push(`${label}: invalid date`);
        if (!['release', 'feature', 'content', 'fix'].includes(entry.type)) errors.push(`${label}: invalid type`);
        if (!entry.title || !entry.summary) errors.push(`${label}: missing title or summary`);
        if (!Array.isArray(entry.links)) errors.push(`${label}: links must be an array`);
        else for (const link of entry.links) {
          if (!link?.label || typeof link.href !== "string" || !link.href.startsWith("/")) {
            errors.push(`${label}: invalid internal link`);
          } else {
            linkRefs.push({ href: link.href, label: `${label}.links` });
          }
        }
        if (!Array.isArray(entry.courses) || entry.courses.length === 0) errors.push(`${label}: courses must be a non-empty array`);
      }
    }
  } catch { errors.push("changelog.json: invalid JSON"); }
}

for (const course of courses) {
  const root = join(content, course.contentDir);
  if (!(await exists(root))) { errors.push(`${course.id}: missing content root`); continue; }
  routes.add(`/${course.slug}`);
  routes.add(`/${course.slug}/book`);
  const tasks = join(root, "tasks");
  if (await exists(tasks)) {
    const ids = new Set();
    for (const dir of await readdir(tasks, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const metaFile = join(tasks, dir.name, "meta.json");
      if (!(await exists(metaFile))) { errors.push(`${course.id}/tasks/${dir.name}: missing meta.json`); continue; }
      let meta;
      try { meta = JSON.parse(await readFile(metaFile, "utf8")); } catch { errors.push(`${course.id}/tasks/${dir.name}: invalid meta.json`); continue; }
      if (!meta.id || ids.has(meta.id)) errors.push(`${course.id}/tasks/${dir.name}: duplicate or missing id`);
      ids.add(meta.id);
      routes.add(`/${course.slug}/tasks/${meta.slug ?? meta.id}`);
      routes.add(`/${course.slug}/tasks/${meta.id}`);
      routes.add(`/${course.slug}/tasks/${meta.num ?? parseInt(meta.id, 10)}`);
      if (!(await exists(join(tasks, dir.name, "starter.go")))) errors.push(`${course.id}/tasks/${dir.name}: missing starter.go`);
      for (const file of ["problem.md", "problem.mdx", "theory.mdx", "solution.mdx", "editorial.mdx"]) {
        const filePath = join(tasks, dir.name, file);
        if (await exists(filePath)) collectLinks(await readFile(filePath, "utf8"), `${course.id}/tasks/${dir.name}/${file}`);
      }
    }
  }
  const book = join(root, "book");
  const chapterSlugs = new Set();
  if (await exists(book)) {
    for (const file of (await readdir(book)).filter((name) => name.endsWith(".mdx"))) {
      const raw = await readFile(join(book, file), "utf8");
      const slug = raw.match(/^slug:\s*["']?([^"'\n]+)["']?/m)?.[1]?.trim() ?? file.replace(/\.mdx$/, "");
      if (chapterSlugs.has(slug)) errors.push(`${course.id}/book: duplicate slug ${slug}`);
      chapterSlugs.add(slug);
      routes.add(`/${course.slug}/book/${slug}`);
      collectLinks(raw, `${course.id}/book/${file}`);
      for (const marker of raw.matchAll(/<(Sim|Quiz)\s+id="([^"]+)"\s*\/>/g)) {
        const markerDir = marker[1] === "Sim" ? "sims" : "quizzes";
        if (!(await exists(join(root, markerDir, `${marker[2]}.json`)))) errors.push(`${course.id}/book/${file}: missing ${marker[1]} definition ${marker[2]}`);
      }
    }
  }
  const sims = join(root, "sims");
  if (await exists(sims)) {
    for (const file of (await readdir(sims)).filter((name) => name.endsWith(".json"))) {
      let sim;
      try { sim = JSON.parse(await readFile(join(sims, file), "utf8")); } catch { errors.push(`${course.id}/sims/${file}: invalid JSON`); continue; }
      if (!sim?.id || !sim?.kind || !sim?.title) errors.push(`${course.id}/sims/${file}: missing id, kind, or title`);
      if (!sim?.chapterSlug || !chapterSlugs.has(sim.chapterSlug)) errors.push(`${course.id}/sims/${file}: unknown chapterSlug ${sim?.chapterSlug ?? "(missing)"}`);
      routes.add(`/${course.slug}/sim/${sim.id}`);
    }
  }
}

// Legacy root paths are permanent redirects, so authored links may keep using them.
for (const route of [...routes]) if (route.startsWith("/go/")) routes.add(route.replace(/^\/go/, ""));
for (const { href, label } of linkRefs) {
  if (!routes.has(normalizeRoute(href))) errors.push(`${label}: broken internal link ${href}`);
}

const courseIds = new Set(courses.map((course) => course?.id).filter(Boolean));
for (const [index, course] of courses.entries()) {
  const label = `courses[${index}]`;
  if (!course || typeof course !== "object") { errors.push(`${label}: expected an object`); continue; }
  if (!course.id || !course.slug) errors.push(`${label}: missing id or slug`);
  if (!semver.test(course.version ?? "")) errors.push(`${label}: version must be semver (x.y.z)`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(course.versionDate ?? "")) errors.push(`${label}: invalid versionDate`);
  const release = changelogEntries.find((entry) => entry.version === course.version && entry.courses?.includes(course.id));
  if (!release) errors.push(`${label}: version ${course.version} is not linked from changelog for ${course.id}`);
}

for (const entry of changelogEntries) {
  if (!Array.isArray(entry.courses)) continue;
  for (const courseId of entry.courses) if (!courseIds.has(courseId)) errors.push(`changelog ${entry.version}: unknown course ${courseId}`);
}

if (errors.length) {
  console.error(`Content check failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Content check passed: ${courses.length} courses and all task/chapter references validated`);
