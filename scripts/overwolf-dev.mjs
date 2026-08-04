import { spawn } from 'node:child_process';
import { get } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const dashboardUrl = 'http://127.0.0.1:4173/live';
const WINDOWS_STATUS_CONTROL_C_EXIT = 0xc000013a;
const OWEPM_INVALID_VERIFICATION_EXIT = 0xffff7003;
const OWEPM_INVALID_VERIFICATION_SIGNED_EXIT = -36861;
const gsiOnlyRequested = process.argv.includes('--gsi-only') || process.env.DOTA_FLOW_GSI_ONLY === '1';
const trackedChildren = new Map();
let shutdownPromise = null;
let shutdownRequested = false;

function npmInvocation(script) {
  const npmCliPath = process.env.npm_execpath;
  if (npmCliPath) {
    return {
      command: process.execPath,
      args: [npmCliPath, 'run', script]
    };
  }

  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', `npm run ${script}`]
    };
  }

  return { command: 'npm', args: ['run', script] };
}

function startProcess(command, args, label, envOverrides = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...envOverrides },
    stdio: 'inherit',
    windowsHide: false
  });

  trackedChildren.set(child, label);
  const exit = new Promise((resolveExit, rejectStart) => {
    child.once('error', rejectStart);
    child.once('exit', (code, signal) => {
      trackedChildren.delete(child);
      resolveExit({ code, signal });
    });
  });

  return { child, exit, label };
}

function startNpmScript(script, envOverrides = {}) {
  const invocation = npmInvocation(script);
  return startProcess(invocation.command, invocation.args, script, envOverrides);
}

async function runNpmScript(script, envOverrides = {}) {
  const processHandle = startNpmScript(script, envOverrides);
  const result = await processHandle.exit;
  if (result.code !== 0) {
    throw new Error(`${script} failed (${result.code ?? result.signal ?? 'unknown exit'}).`);
  }
}

function probeDashboard() {
  return new Promise((resolveProbe) => {
    const request = get(dashboardUrl, (response) => {
      response.resume();
      resolveProbe(Boolean(response.statusCode && response.statusCode < 500));
    });
    request.setTimeout(1_000, () => {
      request.destroy();
      resolveProbe(false);
    });
    request.once('error', () => resolveProbe(false));
  });
}

async function waitForDashboard(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeDashboard()) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Dashboard did not become ready at ${dashboardUrl} within ${timeoutMs / 1_000}s.`);
}

function terminateProcessTree(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();

  if (process.platform === 'win32') {
    return new Promise((resolveKill) => {
      const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true
      });
      killer.once('error', () => resolveKill());
      killer.once('exit', () => resolveKill());
    });
  }

  child.kill('SIGTERM');
  return Promise.resolve();
}

function shutdown() {
  if (shutdownPromise) return shutdownPromise;
  shutdownPromise = Promise.allSettled(
    [...trackedChildren.keys()].map((child) => terminateProcessTree(child))
  ).then(() => undefined);
  return shutdownPromise;
}

function isControlCExit(result) {
  const code = Number(result?.code);
  return result?.signal === 'SIGINT'
    || code === 130
    || code === WINDOWS_STATUS_CONTROL_C_EXIT
    || code === -1073741510;
}

function isOwepmVerificationExit(result) {
  const code = Number(result?.code);
  return code === OWEPM_INVALID_VERIFICATION_EXIT
    || code === OWEPM_INVALID_VERIFICATION_SIGNED_EXIT;
}

function handleSignal(exitCode) {
  shutdownRequested = true;
  console.log('\nStopping Dota Flow, dashboard and Overwolf Electron/GSI runtime.');
  void shutdown().finally(() => process.exit(exitCode));
}

function waitForRuntimeOrDashboard(runtime, dashboard) {
  return Promise.race([
    runtime.exit.then((result) => ({ source: 'runtime', result })),
    dashboard.exit.then((result) => ({ source: 'dashboard', result }))
  ]);
}

function assertRuntimeOutcome(outcome, runtimeLabel) {
  if (shutdownRequested || isControlCExit(outcome.result)) return false;
  if (outcome.source === 'dashboard') {
    throw new Error(`Dashboard stopped while ${runtimeLabel} was running (${outcome.result.code ?? outcome.result.signal ?? 'unknown exit'}).`);
  }
  if (outcome.result.code !== 0) {
    throw new Error(`${runtimeLabel} stopped with ${outcome.result.code ?? outcome.result.signal ?? 'unknown exit'}.`);
  }
  return true;
}

process.once('SIGINT', () => handleSignal(130));
process.once('SIGTERM', () => handleSignal(143));

async function main() {
  console.log(gsiOnlyRequested
    ? 'Dota Flow: starting stable GSI-only desktop mode.'
    : 'Dota Flow: starting one-console Overwolf dev mode.');

  if (!gsiOnlyRequested) {
    await runNpmScript('overwolf:preflight');
  } else {
    console.log('GSI-only mode: Overwolf credentials and gaming-package verification are not required.');
  }

  await runNpmScript('dota:gsi:install');
  await runNpmScript('build', { VITE_DOTA_FLOW_RUNTIME_MODE: 'live' });
  await runNpmScript('overwolf:build');

  const dashboard = startProcess(process.execPath, ['apps/mock-dashboard/server.mjs'], 'dashboard');
  const dashboardStartup = await Promise.race([
    waitForDashboard().then(() => ({ type: 'ready' })),
    dashboard.exit.then((result) => ({ type: 'exit', result }))
  ]);

  if (dashboardStartup.type === 'exit') {
    if (shutdownRequested || isControlCExit(dashboardStartup.result)) return;
    throw new Error(`Dashboard stopped before startup (${dashboardStartup.result.code ?? dashboardStartup.result.signal ?? 'unknown exit'}).`);
  }

  console.log(`Dashboard ready: ${dashboardUrl}`);

  if (gsiOnlyRequested) {
    console.log('Starting stable Electron GSI runtime. Keep this PowerShell open; Ctrl+C stops both processes.');
    const gsiRuntime = startNpmScript('gsi:start', { DOTA_FLOW_GSI_ONLY: '1' });
    const outcome = await waitForRuntimeOrDashboard(gsiRuntime, dashboard);
    assertRuntimeOutcome(outcome, 'GSI Electron');
    return;
  }

  console.log('Starting Overwolf Electron. Keep this PowerShell open; Ctrl+C stops both processes.');
  const overwolfRuntime = startNpmScript('overwolf:start');
  const outcome = await waitForRuntimeOrDashboard(overwolfRuntime, dashboard);

  if (shutdownRequested || isControlCExit(outcome.result)) return;
  if (outcome.source === 'runtime' && isOwepmVerificationExit(outcome.result)) {
    console.warn('WARNING: Overwolf package verification failed (0xFFFF7003).');
    console.warn('Switching automatically to stable GSI-only Electron mode; Dota telemetry and the coaching UI will keep working without owepm.');
    const gsiRuntime = startNpmScript('gsi:start', { DOTA_FLOW_GSI_ONLY: '1' });
    const fallbackOutcome = await waitForRuntimeOrDashboard(gsiRuntime, dashboard);
    assertRuntimeOutcome(fallbackOutcome, 'GSI fallback Electron');
    return;
  }

  assertRuntimeOutcome(outcome, 'Overwolf Electron');
}

try {
  await main();
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await shutdown();
}
