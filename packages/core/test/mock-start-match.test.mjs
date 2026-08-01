import test from 'node:test';
import assert from 'node:assert/strict';
import { MockMatchRuntime } from '../src/mock-match-runtime.mjs';

const command = { hero: 'shadow_fiend', role: 'mid', draft: { radiant: ['shadow_fiend', 'axe', 'tusk', 'luna', 'crystal_maiden'], dire: ['puck', 'underlord', 'lion', 'juggernaut', 'zeus'] } };

test('Start Match reaches the canonical pipeline and is idempotent while active', () => {
  const runtime = new MockMatchRuntime();
  let snapshot;
  assert.doesNotThrow(() => { snapshot = runtime.startMatch(command); });
  assert.equal(snapshot.state.phase, 'playing');
  assert.match(snapshot.state.matchId, /^mock-match-/);
  assert.equal(snapshot.state.gameTimeSec, 0);
  assert.equal(snapshot.state.hero, 'shadow_fiend');
  assert.equal(snapshot.state.role, 'mid');
  assert.deepEqual(snapshot.state.draft, command.draft);
  assert.ok(snapshot.macroDecision?.action);
  assert.ok(snapshot.roleDecision?.action);
  assert.ok(snapshot.powerSpike);
  const same = runtime.startMatch(command);
  assert.equal(same.state.matchId, snapshot.state.matchId);
  assert.equal(runtime.advance(30).state.gameTimeSec, 30);
  assert.doesNotThrow(() => runtime.sendManualContext('ROUTE_SAFE'));
  const timed = runtime.startCoachTimer({ kind: 'GLYPH', durationSec: 60 });
  assert.equal(timed.state.coachContext.timers[0].durationSec, 60);
});

test('a completed mock match can start a fresh session without hero fallback', () => {
  const runtime = new MockMatchRuntime();
  const first = runtime.startMatch(command);
  assert.equal(runtime.endMatch().state.phase, 'ended');
  const second = runtime.startMatch({ ...command, hero: 'anti_mage', role: 'carry' });
  assert.notEqual(second.state.matchId, first.state.matchId);
  assert.notEqual(second.runtimeMetadata.sessionId, first.runtimeMetadata.sessionId);
  assert.equal(second.state.hero, 'anti_mage');
  assert.equal(second.state.role, 'carry');
  assert.equal(second.state.gameTimeSec, 0);
});
