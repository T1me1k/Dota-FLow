import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
const electronPackage = JSON.parse(await readFile(resolve(root, 'apps/overwolf-electron/package.json'), 'utf8'));
const rootPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const preflight = await readFile(resolve(root, 'scripts/overwolf-dev-preflight.mjs'), 'utf8');
const devLauncher = await readFile(resolve(root, 'scripts/overwolf-dev.mjs'), 'utf8');

function majorMinor(version) {
  const match = String(version).match(/(\d+)\.(\d+)/);
  assert.ok(match, `invalid version range: ${version}`);
  return [Number(match[1]), Number(match[2])];
}

function atLeast(version, minimumMajor, minimumMinor) {
  const [major, minor] = majorMinor(version);
  return major > minimumMajor || (major === minimumMajor && minor >= minimumMinor);
}

test('Overwolf Electron dev mode uses current authenticated gaming-package path', () => {
  assert.ok(atLeast(electronPackage.devDependencies['@overwolf/ow-electron'], 39, 8));
  assert.ok(atLeast(electronPackage.devDependencies['@overwolf/ow-electron-builder'], 26, 9));
  assert.deepEqual(electronPackage.overwolf.packages, ['gep', 'overlay']);
  assert.match(electronPackage.scripts.start, /^ow-electron /);
  assert.match(electronPackage.scripts.start, /electronapi-qa\.overwolf\.com\/v2\/packages/);
  assert.match(electronPackage.scripts.start, /remote-debugging-port=9222/);
  assert.equal(electronPackage.productName, 'Dota Flow');
  assert.ok(electronPackage.author?.name);
});

test('root launch flow validates credentials without persisting or printing them', () => {
  for (const script of ['overwolf:preflight', 'overwolf:install', 'overwolf:build', 'overwolf:start', 'overwolf:dev']) {
    assert.ok(rootPackage.scripts[script], `missing root script ${script}`);
  }
  assert.match(preflight, /OW_CLI_EMAIL/);
  assert.match(preflight, /OW_CLI_API_KEY/);
  assert.match(preflight, /OW_DEV_KEY/);
  assert.doesNotMatch(preflight, /console\.(?:log|warn|error)\([^\n]*(?:OW_CLI_API_KEY|OW_DEV_KEY)\]/);
  assert.doesNotMatch(preflight, /\b(?:writeFile|appendFile)\s*\(/);
  assert.doesNotMatch(preflight, /['"]\.env['"]/);
});

test('one-console launcher waits for the renderer and owns both process trees', () => {
  assert.equal(rootPackage.scripts['overwolf:dev'], 'node scripts/overwolf-dev.mjs');
  assert.match(devLauncher, /runNpmScript\('overwolf:preflight'\)/);
  assert.match(devLauncher, /runNpmScript\('build'\)/);
  assert.match(devLauncher, /runNpmScript\('overwolf:build'\)/);
  assert.match(devLauncher, /apps\/mock-dashboard\/server\.mjs/);
  assert.match(devLauncher, /http:\/\/127\.0\.0\.1:4173\/live/);
  assert.match(devLauncher, /waitForDashboard\(\)/);
  assert.match(devLauncher, /\['run', 'overwolf:start'\]/);
  assert.match(devLauncher, /taskkill/);
  assert.match(devLauncher, /SIGINT/);
  assert.match(devLauncher, /SIGTERM/);
  assert.doesNotMatch(devLauncher, /OW_CLI_API_KEY|OW_DEV_KEY/);
  assert.doesNotMatch(devLauncher, /\b(?:writeFile|appendFile)\s*\(/);
});
