import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
const electronPackage = JSON.parse(await readFile(resolve(root, 'apps/overwolf-electron/package.json'), 'utf8'));
const electronTsconfig = JSON.parse(await readFile(resolve(root, 'apps/overwolf-electron/tsconfig.json'), 'utf8'));
const rootPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const preflight = await readFile(resolve(root, 'scripts/overwolf-dev-preflight.mjs'), 'utf8');
const devLauncher = await readFile(resolve(root, 'scripts/overwolf-dev.mjs'), 'utf8');
const preload = await readFile(resolve(root, 'apps/overwolf-electron/src/preload/preload.cts'), 'utf8');
const finalizeBuild = await readFile(resolve(root, 'apps/overwolf-electron/scripts/finalize-build.mjs'), 'utf8');
const desktopIndex = await readFile(resolve(root, 'apps/desktop/index.html'), 'utf8');
const bootstrapGuard = await readFile(resolve(root, 'apps/desktop/src/bootstrap-guard.ts'), 'utf8');
const gepAdapter = await readFile(resolve(root, 'apps/overwolf-electron/src/main/overwolf-gep-adapter.ts'), 'utf8');
const ciWorkflow = await readFile(resolve(root, '.github/workflows/ci.yml'), 'utf8');

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

test('one-console launcher waits for the live renderer and owns both process trees', () => {
  assert.equal(rootPackage.scripts['overwolf:dev'], 'node scripts/overwolf-dev.mjs');
  assert.match(devLauncher, /runNpmScript\('overwolf:preflight'\)/);
  assert.match(devLauncher, /runNpmScript\('build', \{ VITE_DOTA_FLOW_RUNTIME_MODE: 'live' \}\)/);
  assert.match(devLauncher, /runNpmScript\('overwolf:build'\)/);
  assert.match(devLauncher, /startNpmScript\('overwolf:start'\)/);
  assert.match(devLauncher, /process\.env\.npm_execpath/);
  assert.match(devLauncher, /process\.env\.ComSpec \|\| 'cmd\.exe'/);
  assert.doesNotMatch(devLauncher, /npm\.cmd/);
  assert.match(devLauncher, /apps\/mock-dashboard\/server\.mjs/);
  assert.match(devLauncher, /http:\/\/127\.0\.0\.1:4173\/live/);
  assert.match(devLauncher, /waitForDashboard\(\)/);
  assert.match(devLauncher, /taskkill\.exe/);
  assert.match(devLauncher, /SIGINT/);
  assert.match(devLauncher, /SIGTERM/);
  assert.doesNotMatch(devLauncher, /OW_CLI_API_KEY|OW_DEV_KEY/);
  assert.doesNotMatch(devLauncher, /\b(?:writeFile|appendFile)\s*\(/);
});

test('sandboxed preload is compiled as CommonJS and startup IPC tolerates registration races', async () => {
  assert.ok(electronTsconfig.include.includes('src/**/*.cts'));
  assert.match(electronPackage.scripts.prebuild, /clean-dist\.mjs/);
  assert.match(electronPackage.scripts.build, /finalize-build\.mjs/);
  assert.match(preload, /contextBridge\.exposeInMainWorld\('dotaFlowRuntime'/);
  assert.match(preload, /invokeWithStartupRetry/);
  assert.match(preload, /IPC_RETRY_ATTEMPTS/);
  assert.match(preload, /IPC_CHANNEL_DENIED/);
  assert.doesNotMatch(preload, /exposeInMainWorld\([^\n]*ipcRenderer/);
  assert.match(finalizeBuild, /dist\/preload\/preload\.cjs/);
  assert.match(finalizeBuild, /dist\/preload\/preload\.js/);
  assert.match(finalizeBuild, /Compiled preload is not CommonJS/);
  assert.match(finalizeBuild, /copyFile/);
  await assert.rejects(
    readFile(resolve(root, 'apps/overwolf-electron/src/preload/preload.ts'), 'utf8'),
    (error) => error?.code === 'ENOENT'
  );
});

test('renderer bootstrap fails visibly instead of leaving a background-only window', () => {
  assert.match(desktopIndex, /id="boot-diagnostic"/);
  assert.match(desktopIndex, /bootstrap-guard\.ts/);
  assert.match(bootstrapGuard, /window\.addEventListener\('error'/);
  assert.match(bootstrapGuard, /window\.addEventListener\('unhandledrejection'/);
  assert.match(bootstrapGuard, /renderer did not mount within 10 seconds/i);
  assert.match(bootstrapGuard, /MutationObserver/);
});

test('GEP activation retries transient feature registration and reports honest states', () => {
  assert.match(gepAdapter, /GEP_REGISTRATION_ATTEMPTS = 4/);
  assert.match(gepAdapter, /setRequiredFeaturesWithRetry/);
  assert.match(gepAdapter, /GEP_FEATURE_REGISTRATION_RETRY/);
  assert.match(gepAdapter, /connection: 'waiting-for-game'/);
  assert.match(gepAdapter, /connection: 'connected'/);
  assert.match(gepAdapter, /GEP_ACTIVATION_FAILED/);
  assert.match(gepAdapter, /this\.#activeGameIds\.delete\(gameId\);\n      await this\.#activateGame\(gep, gameId, 'GAME_DETECTED'\)/);
});

test('CI validates the real Overwolf adapter instead of only static contracts', () => {
  assert.match(ciWorkflow, /Install Overwolf Electron dependencies/);
  assert.match(ciWorkflow, /npm run electron:typecheck/);
  assert.match(ciWorkflow, /npm run overwolf:build/);
});
