import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagePath = resolve(root, 'apps/overwolf-electron/package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));

const MINIMUM_NODE = [22, 12, 0];
const errors = [];
const warnings = [];

function parseVersion(value) {
  const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function versionAtLeast(actual, minimum) {
  for (let index = 0; index < minimum.length; index += 1) {
    if (actual[index] > minimum[index]) return true;
    if (actual[index] < minimum[index]) return false;
  }
  return true;
}

if (process.platform !== 'win32') {
  errors.push('Overwolf gaming packages run on Windows only.');
}

const nodeVersion = parseVersion(process.versions.node);
if (!nodeVersion || !versionAtLeast(nodeVersion, MINIMUM_NODE)) {
  errors.push(`Node.js ${MINIMUM_NODE.join('.')} or newer is required by the pinned Electron build toolchain; current version is ${process.versions.node}.`);
}

const hasConsoleEmail = Boolean(process.env.OW_CLI_EMAIL);
const hasConsoleApiKey = Boolean(process.env.OW_CLI_API_KEY);
const hasConsoleCredentials = hasConsoleEmail && hasConsoleApiKey;
const hasDevToken = Boolean(process.env.OW_DEV_KEY);

if (hasConsoleEmail !== hasConsoleApiKey) {
  errors.push('OW_CLI_EMAIL and OW_CLI_API_KEY must be set together.');
}
if (!hasConsoleCredentials && !hasDevToken) {
  errors.push('Set OW_CLI_EMAIL and OW_CLI_API_KEY, or set OW_DEV_KEY, in this PowerShell session.');
}
if (hasConsoleCredentials && hasDevToken) {
  errors.push('Two credential modes are set. Remove OW_CLI_EMAIL/OW_CLI_API_KEY when using OW_DEV_KEY, or remove OW_DEV_KEY when using a Console API key.');
}

const dependencies = packageJson.devDependencies ?? {};
if (!dependencies['@overwolf/ow-electron']) errors.push('@overwolf/ow-electron is missing.');
if (!dependencies['@overwolf/ow-electron-builder']) errors.push('@overwolf/ow-electron-builder is missing.');
if (!dependencies['@overwolf/ow-electron-packages-types']) errors.push('@overwolf/ow-electron-packages-types is missing.');

const packages = new Set(packageJson.overwolf?.packages ?? []);
for (const required of ['gep', 'overlay']) {
  if (!packages.has(required)) errors.push(`Overwolf package ${required} is not enabled.`);
}

if (!String(packageJson.scripts?.start ?? '').includes('electronapi-qa.overwolf.com/v2/packages')) {
  warnings.push('The QA gaming-package channel is not present in the start command.');
}

const credentialStatus = hasConsoleCredentials && hasDevToken
  ? 'CONFLICT'
  : hasConsoleCredentials
    ? 'Console email/API key OK'
    : hasDevToken
      ? 'OW_DEV_KEY OK'
      : 'MISSING';

console.log('Dota Flow Overwolf dev-mode preflight');
console.log(`Platform: ${process.platform === 'win32' ? 'Windows OK' : process.platform}`);
console.log(`Node.js: ${process.versions.node}${nodeVersion && versionAtLeast(nodeVersion, MINIMUM_NODE) ? ' OK' : ' UNSUPPORTED'}`);
console.log(`Credentials: ${credentialStatus}`);
console.log(`Gaming packages: ${[...packages].join(', ') || 'none'}`);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log('READY: dependencies, live renderer, sandbox preload and Overwolf Electron can be built from this elevated PowerShell session.');
}
