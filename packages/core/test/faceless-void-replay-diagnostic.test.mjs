import test from 'node:test';
import assert from 'node:assert/strict';
import { runReplaySuite } from '../src/replay-calibration.mjs';

test('diagnose faceless void replay checkpoint', async () => {
  const suite = await runReplaySuite({ id: 'carry-02-faceless_void' });
  const result = suite.results[0];
  const entry = result.timeline.filter((item) => item.gameTimeSec <= 817).at(-1);
  console.log(`FACELESS_VOID_817=${JSON.stringify(entry)}`);
  assert.ok(entry);
});
