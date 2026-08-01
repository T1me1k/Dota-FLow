import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const json = process.argv.includes('--json');
const strict = process.argv.includes('--strict');
const checks = [];

function add(id, status, message, details = null) {
  checks.push({ id, status, message, ...(details ? { details } : {}) });
}

const major = Number(process.versions.node.split('.')[0]);
add('node', major >= 20 ? 'PASS' : 'BLOCKED', `Node ${process.versions.node}`, { required: '>=20' });

for (const file of [
  'package.json',
  'packages/core/src/live-gep-bridge.mjs',
  'packages/core/src/manual-context.mjs',
  'apps/overwolf-electron/package.json',
  'apps/overwolf-electron/src/main/main.ts',
  'docs/FIRST_LIVE_TEST.md'
]) {
  try {
    await access(resolve(file), constants.R_OK);
    add(`file:${file}`, 'PASS', file);
  } catch {
    add(`file:${file}`, 'BLOCKED', `Missing required file: ${file}`);
  }
}

const electronPackage = resolve('apps/overwolf-electron/node_modules/electron/package.json');
try {
  await access(electronPackage, constants.R_OK);
  add('electron_dependencies', 'PASS', 'Electron dependencies are installed');
} catch {
  add('electron_dependencies', 'ACTION', 'Run npm install inside apps/overwolf-electron before the Windows test');
}

add('platform', process.platform === 'win32' ? 'PASS' : 'ACTION', process.platform === 'win32'
  ? 'Windows runtime detected'
  : `Current platform is ${process.platform}; the approved Overwolf Electron runtime test must run on Windows`);

const probeDir = join(tmpdir(), `dota-flow-preflight-${process.pid}`);
try {
  await mkdir(probeDir, { recursive: true });
  await writeFile(join(probeDir, 'write-test.txt'), 'ok\n', 'utf8');
  add('recording_write', 'PASS', 'Capture storage is writable');
} catch (error) {
  add('recording_write', 'BLOCKED', 'Capture storage is not writable', { error: String(error) });
} finally {
  await rm(probeDir, { recursive: true, force: true });
}

add('steam_launch_option', 'MANUAL', 'Confirm Dota 2 launch option: -gamestateintegration');
add('overwolf_runtime', 'MANUAL', 'Confirm the app is approved/available in the Overwolf Electron development runtime');
add('bot_lobby', 'MANUAL', 'Use a bot lobby first; do not start with ranked matchmaking');
add('capture_plan', 'MANUAL', 'Start capture before GEP activation and keep Dota Flow running through a second lobby for reset validation');

const blockers = checks.filter((check) => check.status === 'BLOCKED');
const actions = checks.filter((check) => ['ACTION', 'MANUAL'].includes(check.status));
const result = {
  version: '0.20.0',
  ready: blockers.length === 0 && (!strict || actions.length === 0),
  blockerCount: blockers.length,
  actionCount: actions.length,
  checks
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('Dota Flow v0.20 first-match preflight\n');
  for (const check of checks) {
    const icon = check.status === 'PASS' ? '✓' : check.status === 'BLOCKED' ? '✗' : '•';
    console.log(`${icon} [${check.status}] ${check.message}`);
  }
  console.log(`\nBlockers: ${blockers.length} · Actions/manual checks: ${actions.length}`);
  console.log(blockers.length ? 'Preflight is blocked.' : 'Automated preflight passed. Complete the manual Windows checks above.');
}

if (blockers.length || (strict && actions.length)) process.exitCode = 1;
