import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('main coaching window starts compact and uses safe frameless controls', async () => {
  const [main, controller, preload, renderer, styles] = await Promise.all([
    read('apps/overwolf-electron/src/main/main.ts'),
    read('apps/overwolf-electron/src/main/main-window-controller.ts'),
    read('apps/overwolf-electron/src/preload/preload.cts'),
    read('apps/desktop/src/WindowFrame.tsx'),
    read('apps/desktop/src/window-frame.css')
  ]);
  assert.match(main, /MainWindowController\.create\((?:mainWindow|createdMainWindow)\)/);
  assert.match(main, /frame: false/);
  assert.match(main, /titleBarStyle: 'hidden'/);
  assert.match(main, /window:close/);
  assert.match(controller, /compact: true/);
  assert.match(controller, /COMPACT_WIDTH = 420/);
  assert.match(controller, /COMPACT_HEIGHT = 150/);
  assert.match(controller, /ANIMATION_DURATION_MS = 220/);
  assert.match(controller, /setAlwaysOnTop\(true, 'screen-saver'\)/);
  assert.match(controller, /setMenuBarVisibility\(false\)/);
  assert.match(controller, /systemPreferences\.getAnimationSettings\(\)/);
  assert.match(controller, /shouldRenderRichAnimation/);
  assert.match(controller, /prefersReducedMotion/);
  assert.match(controller, /resolve\(false\)/);
  for (const channel of ['window:get-state','window:set-compact','window:set-always-on-top','window:close']) assert.match(preload, new RegExp(channel.replaceAll(':', '\\:')));
  assert.match(renderer, /fallbackState:WindowState=\{compact:true/);
  assert.match(renderer, /custom-titlebar/);
  assert.match(renderer, /compact-window-body/);
  assert.match(renderer, /window:close/);
  assert.match(renderer, /aria-busy/);
  assert.match(renderer, /aria-expanded/);
  assert.match(renderer, /requestAnimationFrame/);
  assert.match(styles, /-webkit-app-region:drag/);
  assert.match(styles, /compact-window-enter/);
  assert.match(styles, /full-window-enter/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /\.topbar \.mobile/);
  assert.match(styles, /close-control/);
});
