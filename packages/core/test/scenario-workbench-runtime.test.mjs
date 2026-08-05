import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
test('scenario workbench runtime',async()=>{
  const provider=await readFile(new URL('../../../apps/desktop/src/runtime/provider.ts',import.meta.url),'utf8');
  const mock=await readFile(new URL('../../../apps/desktop/src/runtime/mock-provider.ts',import.meta.url),'utf8');
  assert.match(provider,/listScenarios/);
  assert.match(provider,/runScenarioCategory/);
  assert.match(mock,/Unknown scenario/);
});
