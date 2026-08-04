import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('main coaching window can pin, collapse and expand through allowlisted IPC', async () => {
  const [main, controller, preload, renderer, styles] = await Promise.all([
    read('apps/overwolf-electron/src/main/main.ts'),
    read('apps/overwolf-electron/src/main/main-window-controller.ts'),
    read('apps/overwolf-electron/src/preload/preload.cts'),
    read('apps/desktop/src/WindowFrame.tsx'),
    read('apps/desktop/src/window-frame.css')
  ]);

  assert.match(main, /MainWindowController\.create\(mainWindow\)/);
  assert.match(main, /window:get-state/);
  assert.match(main, /window:set-compact/);
  assert.match(main, /window:set-always-on-top/);

  assert.match(controller, /setAlwaysOnTop\(true, 'screen-saver'\)/);
  assert.match(controller, /setBounds\(/);
  assert.match(controller, /ANIMATION_DURATION_MS = 220/);
  assert.match(controller, /COMPACT_WIDTH = 420/);
  assert.match(controller, /window-settings\.json/);

  for (const channel of ['window:get-state', 'window:set-compact', 'window:set-always-on-top']) {
    assert.match(preload, new RegExp(channel.replaceAll(':', '\\:')));
  }

  assert.match(renderer, /Collapse to compact window/);
  assert.match(renderer, /Expand TRUST window/);
  assert.match(renderer, /Always on top/);
  assert.match(renderer, /compact-window-body/);
  assert.match(styles, /compact-window-enter/);
  assert.match(styles, /window-controls/);
});
