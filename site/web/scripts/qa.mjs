import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(process.cwd(), '..', 'content', 'tasks');
const dirs = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
if (dirs.length !== 32) throw new Error(`expected 32 tasks, found ${dirs.length}`);
for (const dir of dirs) {
  for (const file of ['meta.json', 'problem.md', 'theory.mdx', 'solution.mdx', 'starter.go', 'reference.go', 'solution_test.go']) {
    await readFile(join(root, dir, file));
  }
  JSON.parse(await readFile(join(root, dir, 'meta.json'), 'utf8'));
}
console.log(`QA passed: ${dirs.length} task fixtures validated`);
