import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/index.css',import.meta.url),'utf8');
test('navigation-visual-model contract',()=>{
  for(const token of ['.nav-group button.active:before', 'var(--accent-soft)']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
