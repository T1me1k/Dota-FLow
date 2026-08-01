import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/main.tsx',import.meta.url),'utf8');
test('landing-content-contract contract',()=>{
  for(const token of ['One clear move', 'Explainable coaching', 'Fair play & privacy', 'Development roadmap', 'FAQ']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
