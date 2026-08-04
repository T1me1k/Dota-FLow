import { copyFile, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const appRoot = resolve(import.meta.dirname, '..');
const compiledPreload = resolve(appRoot, 'dist/preload/preload.cjs');
const runtimePreload = resolve(appRoot, 'dist/preload/preload.js');
const mainEntry = resolve(appRoot, 'dist/main/main.js');

await stat(mainEntry);
await stat(compiledPreload);

const preloadSource = await readFile(compiledPreload, 'utf8');
if (!/require\(["']electron["']\)/.test(preloadSource)) {
  throw new Error('Compiled preload is not CommonJS: require("electron") was not found.');
}
if (/^\s*import\s/m.test(preloadSource)) {
  throw new Error('Compiled preload still contains ESM imports and cannot run in Electron sandbox mode.');
}

await copyFile(compiledPreload, runtimePreload);
console.log('Overwolf build verified: sandbox-compatible preload.js created from preload.cjs.');
