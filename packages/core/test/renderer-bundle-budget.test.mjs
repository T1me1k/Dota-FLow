import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';

test('renderer build keeps mock intelligence lazy and enforces a 500 KiB startup budget',async()=>{
  const provider=await readFile(new URL('../../../apps/desktop/src/runtime/provider.ts',import.meta.url),'utf8');
  const checker=await readFile(new URL('../../../scripts/check-renderer-bundle.mjs',import.meta.url),'utf8');
  const pkg=JSON.parse(await readFile(new URL('../../../package.json',import.meta.url),'utf8'));
  const ci=await readFile(new URL('../../../.github/workflows/ci.yml',import.meta.url),'utf8');
  assert.match(provider,/import\('\.\/mock-provider'\)/);
  assert.doesNotMatch(provider,/mock-match-runtime|replay-scenarios\.json/);
  assert.match(checker,/500\*1024/);
  assert.match(checker,/modulepreload/);
  assert.equal(pkg.scripts['bundle:check'],'node scripts/check-renderer-bundle.mjs');
  assert.match(ci,/Renderer bundle budget/);
  assert.match(ci,/npm run bundle:check/);
});
