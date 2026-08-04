import { spawn } from 'node:child_process';
import { get } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const dashboardUrl = 'http://127.0.0.1:4173/live';
const WINDOWS_STATUS_CONTROL_C_EXIT = 0xc000013a;
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

function handleSignal(exitCode) {
  shutdownRequested = true;
  console.log('\nStopping Dota Flow, dashboard and Overwolf Electron.');
  void shutdown().finally(() => process.exit(exitCode));
}

process.once('SIGINT', () => handleSignal(130));
process.once('SIGTERM', () => handleSignal(143));

async function main() {
  console.log('Dota Flow: starting one-console Overwolf dev mode.');
  await runNpmScript('overwolf:preflight');
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
  console.log('Starting Overwolf Electron. Keep this PowerShell open; Ctrl+C stops both processes.');

  const electron = startNpmScript('overwolf:start');
  const outcome = await Promise.race([
    electron.exit.then((result) => ({ source: 'electron', result })),
    dashboard.exit.then((result) => ({ source: 'dashboard', result }))
  ]);

  if (shutdownRequested || isControlCExit(outcome.result)) return;
  if (outcome.source === 'dashboard') {
    throw new Error(`Dashboard stopped while Overwolf was running (${outcome.result.code ?? outcome.result.signal ?? 'unknown exit'}).`);
  }
  if (outcome.result.code !== 0) {
    throw new Error(`Overwolf Electron stopped with ${outcome.result.code ?? outcome.result.signal ?? 'unknown exit'}.`);
  }
}

try {
  await main();
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await shutdown();
}
