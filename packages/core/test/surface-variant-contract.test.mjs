import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/ui.tsx',import.meta.url),'utf8');
test('surface-variant-contract contract',()=>{
  for(const token of ["'command'", "'danger'", "'success'", "'inset'"]) assert.ok(source.includes(token),`missing contract: ${token}`);
});
