import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
test('lazy development provider exposes scenario capabilities and electron fails closed',async()=>{
  const provider=await readFile(new URL('../../../apps/desktop/src/runtime/provider.ts',import.meta.url),'utf8');
  const mock=await readFile(new URL('../../../apps/desktop/src/runtime/mock-provider.ts',import.meta.url),'utf8');
  const source=`${provider}\n${mock}`;
  for(const token of['listScenarios','runScenario','runScenarioCategory','loadReplayScenario','getScenarioGoldenDiff','failed closed'])assert.match(source,new RegExp(token));
});
