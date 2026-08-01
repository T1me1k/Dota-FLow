import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=['src/app.mjs','public/index.html','public/styles.css'].map(file=>fs.readFileSync(new URL(`../../../apps/decision-overlay/${file}`,import.meta.url),'utf8')).join('\n');
test('overlay-visual-contract contract',()=>{
  for(const token of ['decision-overlay', 'actionLabel', 'confidence']) assert.ok(source.includes(token),`missing contract: ${token}`);
});
