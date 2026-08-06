import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read=(path)=>readFile(new URL(`../../../${path}`,import.meta.url),'utf8');

test('enemy last-seen UI is loaded from the single normalized snapshot stream',async()=>{
  const[index,enhancer,styles,pipeline]=await Promise.all([
    read('apps/desktop/index.html'),
    read('apps/desktop/src/enemy-last-seen-enhancer.ts'),
    read('apps/desktop/src/enemy-last-seen-enhancer.css'),
    read('packages/core/src/live-pipeline.mjs')
  ]);
  assert.match(index,/enemy-last-seen-enhancer\.ts/);
  assert.match(enhancer,/dota-flow:runtime-snapshot/);
  assert.doesNotMatch(enhancer,/onLiveSnapshot\(/);
  assert.match(enhancer,/lastSeenEnabled/);
  assert.match(enhancer,/lastSeenOverlayEnabled/);
  assert.match(enhancer,/lastSeenSampleHz/);
  assert.match(enhancer,/row\.status==='MISSING'&&row\.timerVisible/);
  assert.match(enhancer,/row\.status!=='VISIBLE'/);
  assert.match(styles,/enemy-last-seen-overlay-panel/);
  assert.match(styles,/enemy-last-seen-row\.missing/);
  assert.match(pipeline,/enemyLastSeenTracker/);
  assert.match(pipeline,/enemyVisibility:/);
});

test('overlay stays available for last-seen timers without economy panel',async()=>{
  const[bootstrap,windowController]=await Promise.all([
    read('apps/overwolf-electron/src/main/economy-bootstrap.ts'),
    read('apps/overwolf-electron/src/main/economy-overlay-window.ts')
  ]);
  assert.match(bootstrap,/settings\.lastSeenEnabled===true/);
  assert.match(windowController,/visibilityOnly/);
  assert.match(windowController,/showLastSeen/);
  assert.match(windowController,/lastSeenOverlayEnabled/);
});

test('fair-play copy explicitly denies hidden-location inference',async()=>{
  const[engine,enhancer]=await Promise.all([
    read('packages/core/src/enemy-last-seen-engine.mjs'),
    read('apps/desktop/src/enemy-last-seen-enhancer.ts')
  ]);
  assert.match(engine,/No hidden location is inferred/);
  assert.match(engine,/Visible enemies never show a missing timer/);
  assert.match(enhancer,/Таймер не содержит скрытую позицию/);
  assert.doesNotMatch(engine,/hiddenPosition|estimatedLocation|predictedLocation/);
});
