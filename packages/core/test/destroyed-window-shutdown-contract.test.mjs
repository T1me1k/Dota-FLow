import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mainSource = await readFile(new URL('../../../apps/overwolf-electron/src/main/main.ts', import.meta.url), 'utf8');
const gsiSource = await readFile(new URL('../../../apps/overwolf-electron/src/main/dota-gsi-adapter.ts', import.meta.url), 'utf8');

test('Electron IPC delivery checks both window and webContents lifetime', () => {
  assert.match(mainSource, /!window\.isDestroyed\(\)/);
  assert.match(mainSource, /!window\.webContents\.isDestroyed\(\)/);
  assert.match(mainSource, /function sendToWindow/);
  assert.match(mainSource, /if \(gracefulQuitStarted \|\| !canUseWindow\(window\)\) return/);
  assert.match(mainSource, /createdMainWindow\.once\('closed'/);
  assert.match(mainSource, /createdOverlayWindow\.once\('closed'/);
});

test('queued GSI snapshots are cancelled before shutdown can reach renderer IPC', () => {
  assert.match(gsiSource, /#acceptingSnapshots = false/);
  assert.match(gsiSource, /if \(!this\.#acceptingSnapshots\) return/);
  assert.match(gsiSource, /this\.#acceptingSnapshots = false;\n    this\.#connected = false;/);
  assert.match(gsiSource, /code: 'GSI_STOPPING'/);
});
