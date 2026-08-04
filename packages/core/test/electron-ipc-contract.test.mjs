import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('preload exposes allowlisted API without raw ipc', async () => {
  const source = await readFile('apps/overwolf-electron/src/preload/preload.cts', 'utf8');
  assert.match(source, /contextBridge/);
  assert.doesNotMatch(source, /exposeInMainWorld\([^]*ipcRenderer\s*[,}]/);
  assert.match(source, /runtime:get-snapshot/);
  assert.match(source, /removeListener/);
  assert.match(source, /invokeWithStartupRetry/);
  assert.match(source, /IPC_CHANNEL_DENIED/);
});
