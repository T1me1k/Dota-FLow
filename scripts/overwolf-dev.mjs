import { spawn } from 'node:child_process';
import { get } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const dashboardUrl = 'http://127.0.0.1:4173/live';
const trackedChildren = new Map();
let shutdownPromise = null;

function startProcess(command, args, label) {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
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

async function runNpmScript(script) {
  const processHandle = startProcess(npmCommand, ['run', script], script);
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
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
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

function handleSignal(exitCode) {
  void shutdown().finally(() => process.exit(exitCode));
}

process.once('SIGINT', () => handleSignal(130));
process.once('SIGTERM', () => handleSignal(143));

async function main() {
  console.log('Dota Flow: starting one-console Overwolf dev mode.');
  await runNpmScript('overwolf:preflight');
  await runNpmScript('build');
  await runNpmScript('overwolf:build');

  const dashboard = startProcess(process.execPath, ['apps/mock-dashboard/server.mjs'], 'dashboard');
  const dashboardStartup = await Promise.race([
    waitForDashboard().then(() => ({ type: 'ready' })),
    dashboard.exit.then((result) => ({ type: 'exit', result }))
  ]);

  if (dashboardStartup.type === 'exit') {
    throw new Error(`Dashboard stopped before startup (${dashboardStartup.result.code ?? dashboardStartup.result.signal ?? 'unknown exit'}).`);
  }

  console.log(`Dashboard ready: ${dashboardUrl}`);
  console.log('Starting Overwolf Electron. Keep this PowerShell open; Ctrl+C stops both processes.');

  const electron = startProcess(npmCommand, ['run', 'overwolf:start'], 'overwolf:start');
  const outcome = await Promise.race([
    electron.exit.then((result) => ({ source: 'electron', result })),
    dashboard.exit.then((result) => ({ source: 'dashboard', result }))
  ]);

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
