import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/index.css',import.meta.url),'utf8');
test('ember-design-token contract',()=>{
  for(const token of ['--canvas:#08090b', '--accent:#ff8a1f', '--text-primary:#f5f1ea']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
