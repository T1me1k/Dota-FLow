import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
test('desktop runtime providers preserve their public names while mock code stays lazy',async()=>{
  const provider=await readFile(new URL('../../../apps/desktop/src/runtime/provider.ts',import.meta.url),'utf8');
  const mock=await readFile(new URL('../../../apps/desktop/src/runtime/mock-provider.ts',import.meta.url),'utf8');
  for(const name of['MockRuntimeProvider','ReplayRuntimeProvider','ElectronIpcRuntimeProvider'])assert.match(provider,new RegExp(name));
  assert.match(provider,/import\('\.\/mock-provider'\)/);
  assert.doesNotMatch(provider,/mock-match-runtime|replay-scenarios\.json/);
  assert.match(mock,/MockMatchRuntime/);
  assert.match(mock,/replay-scenarios\.json/);
});
