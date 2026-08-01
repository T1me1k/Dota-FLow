import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/main.tsx',import.meta.url),'utf8');
test('live-command-panel-model contract',()=>{
  for(const token of ['NEXT MOVE', 'Coach call confidence', 'Cancel when', 'Missing data:']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
