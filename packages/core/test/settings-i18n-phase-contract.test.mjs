import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read=(path)=>readFile(new URL(`../../../${path}`,import.meta.url),'utf8');

test('settings expose fifteen persisted themes and Russian English localization',async()=>{
  const[settings,styles,main,pregame]=await Promise.all([
    read('apps/desktop/src/app-settings.tsx'),read('apps/desktop/src/themes-settings.css'),read('apps/desktop/src/main.tsx'),read('apps/desktop/src/PregameCoach.tsx')
  ]);
  const themeIds=[...settings.matchAll(/\{id:'([^']+)'/g)].map(match=>match[1]);
  assert.equal(themeIds.length,15);
  assert.equal(new Set(themeIds).size,15);
  assert.match(settings,/type Language='ru'\|'en'/);
  assert.match(settings,/trust-language/);
  assert.match(settings,/trust-theme/);
  assert.match(settings,/'nav.settings':'Настройки'/);
  assert.match(settings,/'live.title':'Комната решений'/);
  assert.match(styles,/data-theme='violet'/);
  assert.match(styles,/data-theme='gold'/);
  assert.match(main,/route==='\/settings'/);
  assert.match(main,/THEMES\.map/);
  assert.match(pregame,/useAppSettings/);
});

test('phase-aware presentation blocks pregame and laning macro calls',async()=>{
  const phase=await read('apps/desktop/src/phase-aware.ts');
  assert.match(phase,/LANING_END_SEC=12\*60/);
  assert.match(phase,/MID_GAME_END_SEC=30\*60/);
  assert.match(phase,/LATE_GAME_END_SEC=45\*60/);
  assert.match(phase,/stage==='PREGAME'/);
  assert.match(phase,/stage==='LANING'/);
  assert.match(phase,/STABILIZE_LANE/);
  assert.doesNotMatch(phase,/LANING_ALLOWED[^;]*SPLIT_PUSH/s);
  assert.doesNotMatch(phase,/LANING_ALLOWED[^;]*PREPARE_ROSHAN/s);
});
