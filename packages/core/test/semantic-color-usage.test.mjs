import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/index.css',import.meta.url),'utf8');
test('semantic-color-usage contract',()=>{
  for(const token of ['--critical:#ff5b54', '--success:#43d39e', '--warning:#ffc266']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
