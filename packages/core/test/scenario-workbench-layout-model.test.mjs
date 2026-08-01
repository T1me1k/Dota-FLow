import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../apps/desktop/src/ScenarioWorkbench.tsx',import.meta.url),'utf8');
test('scenario-workbench-layout-model contract',()=>{
  for(const token of ['workbench', 'Checkpoint timeline', 'Golden diff', 'Run visible']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
