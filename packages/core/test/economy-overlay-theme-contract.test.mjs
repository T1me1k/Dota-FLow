import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'../../..');

async function source(path){return readFile(resolve(root,path),'utf8')}

test('desktop loads persistent economy evidence and configurable buyback placement',async()=>{
  const html=await source('apps/desktop/index.html');
  const enhancer=await source('apps/desktop/src/economy-theme-enhancer.ts');
  const tracker=await source('apps/desktop/src/gsi-buyback-ledger.ts');
  const css=await source('apps/desktop/src/economy-theme-enhancer.css');
  assert.match(html,/economy-theme-enhancer\.ts/);
  assert.match(html,/gsi-buyback-ledger\.ts/);
  for(const token of ['economyEnabled','LOCAL_EXACT','ESTIMATED','SPECTATOR_EXACT','buybackPlacement','showAllies','showEnemies','NET_WORTH'])assert.match(enhancer,new RegExp(token));
  assert.match(enhancer,/setOverlaySettings/);
  assert.match(enhancer,/showOverlay/);
  assert.match(enhancer,/buildEconomyOverlayModel/);
  assert.match(enhancer,/onGepEnvelope/);
  assert.match(enhancer,/runtime:get-snapshot/);
  assert.match(enhancer,/trust-economy-live-ledger-v1/);
  assert.match(enhancer,/setInterval/);
  assert.match(enhancer,/STALE/);
  assert.match(tracker,/buybackAvailable/);
  assert.match(tracker,/state\.available===true&&available===false/);
  assert.match(tracker,/BUYBACK_COOLDOWN_SEC=420/);
  assert.match(tracker,/StorageEvent/);
  assert.match(css,/economy-overlay-panel/);
  assert.match(css,/economy-buyback-strip/);
  assert.match(css,/quality-stale/);
  assert.match(css,/data-economy-side/);
  assert.match(css,/data-economy-scale/);
});

test('Electron starts through the economy bootstrap and supports left right scaling',async()=>{
  const pkg=JSON.parse(await source('apps/overwolf-electron/package.json'));
  const bootstrap=await source('apps/overwolf-electron/src/main/economy-bootstrap.ts');
  const layout=await source('apps/overwolf-electron/src/main/economy-overlay-window.ts');
  assert.equal(pkg.main,'dist/main/economy-bootstrap.js');
  assert.match(bootstrap,/dota-flow:set-overlay-settings/);
  assert.match(bootstrap,/await import\('\.\/main\.js'\)/);
  assert.match(layout,/side==='RIGHT'/);
  assert.match(layout,/SMALL/);
  assert.match(layout,/LARGE/);
  assert.match(layout,/setBounds/);
  assert.match(layout,/setOpacity/);
});

test('all fifteen themes control surfaces backgrounds borders glow and shadows',async()=>{
  const css=await source('apps/desktop/src/themes-settings.css');
  const themes=['emerald','violet','amber','crimson','sapphire','cyan','rose','orange','lime','teal','indigo','magenta','graphite','ice','gold'];
  for(const theme of themes)assert.match(css,new RegExp(`data-theme='${theme}'`));
  for(const variable of ['--background','--surface','--elevated','--border','--theme-glow','--theme-shadow'])assert.match(css,new RegExp(variable));
  assert.match(css,/\.shell>aside/);
  assert.match(css,/\.topbar/);
  assert.match(css,/\.compact-window/);
  assert.match(css,/\.decision/);
  assert.match(css,/\.card/);
});
