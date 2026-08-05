import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'../../..');
const source=(path)=>readFile(resolve(root,path),'utf8');

test('live farm route card shows the next node first and expands the full route',async()=>{
  const [index,enhancer,css,pipeline]=await Promise.all([
    source('apps/desktop/index.html'),
    source('apps/desktop/src/farm-route-enhancer.ts'),
    source('apps/desktop/src/farm-route-enhancer.css'),
    source('packages/core/src/live-pipeline.mjs')
  ]);
  assert.match(index,/farm-route-enhancer\.ts/);
  assert.ok(index.indexOf('farm-route-enhancer.ts')<index.indexOf('main.tsx'));
  assert.match(enhancer,/dota-flow:runtime-snapshot/);
  assert.match(enhancer,/data-farm-route-title/);
  assert.match(enhancer,/<details data-farm-route-details>/);
  assert.match(enhancer,/data-farm-route-list/);
  assert.match(enhancer,/instructionRu/);
  assert.match(enhancer,/instructionEn/);
  assert.doesNotMatch(enhancer,/\.subscribe\(|dotaFlowRuntime/);
  assert.match(css,/farm-route-card/);
  assert.match(css,/farm-route-index/);
  assert.match(pipeline,/farmRoute: this\.farmRoute/);
  assert.match(pipeline,/farmRoute: this\.farmRoute\?\.dataQuality/);
});
