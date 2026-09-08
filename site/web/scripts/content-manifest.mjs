import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const content = resolve(process.cwd(), "..", "content");
const coursesFile = join(content, "courses.json");
const manifestFile = join(content, "content-manifest.json");

const exists = async (file) => access(file).then(() => true).catch(() => false);

async function filesUnder(root) {
  if (!(await exists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(file));
    else files.push(file);
  }
  return files.sort();
}

function digest(parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(part.path);
    hash.update("\0");
    hash.update(part.content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function readCourses() {
  return JSON.parse(await readFile(coursesFile, "utf8"));
}

/** Build a deterministic lockfile for the authored learning content. */
export async function buildManifest() {
  const courses = await readCourses();
  const result = { schema: 1, courses: {} };
  for (const course of courses) {
    const root = join(content, course.contentDir);
    const files = (await filesUnder(root)).filter((file) => {
      if (course.contentDir !== "") return true;
      const rel = relative(root, file).replaceAll("\\", "/");
      const top = rel.split("/")[0];
      return ["tasks", "book", "topics", "sims", "quizzes"].includes(top);
    });
    const grouped = new Map();
    for (const file of files) {
      const rel = relative(root, file).replaceAll("\\", "/");
      const [area, item] = rel.split("/");
      let key = "course";
      if (area === "tasks" && item) key = `task:${item}`;
      else if (area === "book" && item) key = `chapter:${item.replace(/\.mdx$/, "")}`;
      else if (area === "sims" && item) key = `lab:${item.replace(/\.json$/, "")}`;
      else if (area === "quizzes" && item) key = `quiz:${item.replace(/\.json$/, "")}`;
      const list = grouped.get(key) ?? [];
      list.push({ path: rel, content: await readFile(file) });
      grouped.set(key, list);
    }
    const items = {};
    for (const key of [...grouped.keys()].sort()) items[key] = digest(grouped.get(key));
    result.courses[course.id] = {
      version: course.version,
      versionDate: course.versionDate,
      hash: digest(Object.entries(items).map(([path, content]) => ({ path, content }))),
      items,
    };
  }
  return result;
}

export async function checkManifest() {
  const errors = [];
  let stored;
  try {
    stored = JSON.parse(await readFile(manifestFile, "utf8"));
  } catch {
    return ["content-manifest.json: missing or invalid JSON"];
  }
  if (stored?.schema !== 1 || !stored?.courses || typeof stored.courses !== "object") {
    return ["content-manifest.json: unsupported schema"];
  }
  const expected = await buildManifest();
  if (!stored.history || typeof stored.history !== "object") {
    errors.push("content-manifest.json: revision history is missing");
  }
  for (const [courseId, current] of Object.entries(expected.courses)) {
    const saved = stored.courses[courseId];
    if (!saved) {
      errors.push(`${courseId}: missing content manifest entry`);
      continue;
    }
    if (saved.version !== current.version || saved.versionDate !== current.versionDate) {
      errors.push(`${courseId}: manifest version differs from courses.json; bump and regenerate content-manifest.json`);
    }
    if (saved.hash !== current.hash) {
      errors.push(`${courseId}: content changed without regenerating content-manifest.json and bumping the course version`);
    }
    const revisions = Array.isArray(stored.history?.[courseId]) ? stored.history[courseId] : [];
    const matchingRevision = revisions.find((revision) => revision?.version === current.version && revision?.hash === current.hash);
    if (!matchingRevision) errors.push(`${courseId}: current content/version is absent from revision history`);
    const seenVersions = new Map();
    for (const revision of revisions) {
      if (!revision?.version || !revision?.hash) continue;
      const previousHash = seenVersions.get(revision.version);
      if (previousHash && previousHash !== revision.hash) errors.push(`${courseId}: version ${revision.version} has multiple content hashes`);
      seenVersions.set(revision.version, revision.hash);
    }
    for (const item of Object.keys(current.items)) {
      if (saved.items?.[item] !== current.items[item]) errors.push(`${courseId}/${item}: content hash mismatch`);
    }
    for (const item of Object.keys(saved.items ?? {})) {
      if (!(item in current.items)) errors.push(`${courseId}/${item}: stale manifest item`);
    }
  }
  for (const courseId of Object.keys(stored.courses)) {
    if (!(courseId in expected.courses)) errors.push(`${courseId}: stale manifest course`);
  }
  for (const courseId of Object.keys(stored.history ?? {})) {
    if (!(courseId in expected.courses)) errors.push(`${courseId}: stale manifest history`);
  }
  return errors;
}

if (process.argv.includes("--write")) {
  const next = await buildManifest();
  let previous = null;
  try { previous = JSON.parse(await readFile(manifestFile, "utf8")); } catch { /* first publication */ }
  const history = previous?.history && typeof previous.history === "object" ? { ...previous.history } : {};
  for (const [courseId, current] of Object.entries(next.courses)) {
    const old = previous?.courses?.[courseId];
    if (old?.hash && old.hash !== current.hash && old.version === current.version) {
      throw new Error(`${courseId}: content changed under v${current.version}; bump courses.json before regenerating the manifest`);
    }
    const revisions = Array.isArray(history[courseId]) ? [...history[courseId]] : [];
    if (!revisions.some((revision) => revision?.version === current.version && revision?.hash === current.hash)) {
      revisions.push({ version: current.version, versionDate: current.versionDate, hash: current.hash });
    }
    history[courseId] = revisions;
  }
  next.history = history;
  await writeFile(manifestFile, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Content manifest written: ${manifestFile}`);
} else {
  const errors = await checkManifest();
  if (errors.length) {
    console.error(`Content manifest failed (${errors.length})`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("Content manifest passed: authored content matches published versions");
}
