import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
// This fixed path is the generated directory inside the project, never the source.
await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, 'assets/character/pixel'), { recursive: true });
for (const path of ['index.html', 'css', 'js', 'assets/character/pixel/gundul-sheet.png']) {
  await cp(resolve(root, path), resolve(output, path), { recursive: true });
}
console.log('Static game built in dist/');
