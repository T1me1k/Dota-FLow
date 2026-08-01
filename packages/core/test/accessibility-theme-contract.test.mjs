import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/index.css',import.meta.url),'utf8');
test('accessibility-theme-contract contract',()=>{
  for(const token of [':focus-visible', 'prefers-reduced-motion', 'prefers-contrast']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
