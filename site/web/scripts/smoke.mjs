import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const html = await readFile(join(process.cwd(), 'app', '(site)', 'page.tsx'), 'utf8');
if (!html.includes('/go/tasks/01')) throw new Error('landing CTA does not target task 1');
const task = await readFile(join(process.cwd(), '..', 'content', 'tasks', '01', 'meta.json'), 'utf8');
if (!JSON.parse(task).slug) throw new Error('task 1 metadata is missing a slug');
console.log('Smoke passed: landing CTA and task 1 metadata verified');
