import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/index.css',import.meta.url),'utf8');
test('responsive-layout-contract contract',()=>{
  for(const token of ['max-width:1280px', 'max-width:720px', 'min-width:1800px']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
