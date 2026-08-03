import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagePath = resolve(root, 'apps/overwolf-electron/package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));

const errors = [];
const warnings = [];

if (process.platform !== 'win32') {
  errors.push('Overwolf gaming packages run on Windows only.');
}

const hasConsoleCredentials = Boolean(process.env.OW_CLI_EMAIL && process.env.OW_CLI_API_KEY);
const hasDevToken = Boolean(process.env.OW_DEV_KEY);
if (!hasConsoleCredentials && !hasDevToken) {
  errors.push('Set OW_CLI_EMAIL and OW_CLI_API_KEY, or set OW_DEV_KEY, in this PowerShell session.');
}
if (Boolean(process.env.OW_CLI_EMAIL) !== Boolean(process.env.OW_CLI_API_KEY)) {
  errors.push('OW_CLI_EMAIL and OW_CLI_API_KEY must be set together.');
}

const dependencies = packageJson.devDependencies ?? {};
if (!dependencies['@overwolf/ow-electron']) errors.push('@overwolf/ow-electron is missing.');
if (!dependencies['@overwolf/ow-electron-builder']) errors.push('@overwolf/ow-electron-builder is missing.');

const packages = new Set(packageJson.overwolf?.packages ?? []);
for (const required of ['gep', 'overlay']) {
  if (!packages.has(required)) errors.push(`Overwolf package ${required} is not enabled.`);
}

if (!String(packageJson.scripts?.start ?? '').includes('electronapi-qa.overwolf.com/v2/packages')) {
  warnings.push('The QA gaming-package channel is not present in the start command.');
}

console.log('Dota Flow Overwolf dev-mode preflight');
console.log(`Platform: ${process.platform === 'win32' ? 'Windows OK' : process.platform}`);
console.log(`Credentials: ${hasConsoleCredentials ? 'Console email/API key OK' : hasDevToken ? 'OW_DEV_KEY OK' : 'MISSING'}`);
console.log(`Gaming packages: ${[...packages].join(', ') || 'none'}`);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log('READY: install dependencies, build, then start from this same elevated PowerShell session.');
}
