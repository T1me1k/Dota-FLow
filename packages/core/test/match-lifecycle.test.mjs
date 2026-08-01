import test from 'node:test';
import assert from 'node:assert/strict';
import { MockMatchRuntime } from '../src/mock-match-runtime.mjs';

const command = {
  hero: 'luna',
  role: 'carry',
  draft: {
    radiant: ['luna', 'axe', 'puck', 'tusk', 'treant_protector'],
    dire: ['juggernaut', 'underlord', 'windranger', 'crystal_maiden', 'zeus']
  }
};

test('ended mock matches stop publishing active coaching projections', () => {
  const runtime = new MockMatchRuntime();

  const idle = runtime.snapshot();
  assert.equal(idle.coachCall, null);
  assert.equal(idle.powerSpike, null);
  assert.equal(idle.dataQuality.overall, 'UNAVAILABLE');

  const started = runtime.startMatch(command);
  assert.equal(started.state.phase, 'playing');
  assert.ok(started.coachCall);
  assert.ok(started.roleDecision);
  assert.ok(started.powerSpike);
  assert.equal(started.runtimeMetadata.engineProjections, true);

  runtime.advance(60);
  const ended = runtime.endMatch();

  assert.equal(ended.state.phase, 'ended');
  assert.equal(ended.status, 'MATCH_ENDED');
  assert.equal(ended.decision, null);
  assert.equal(ended.macroDecision, null);
  assert.equal(ended.roleDecision, null);
  assert.equal(ended.laneDecision, null);
  assert.equal(ended.objectiveDecision, null);
  assert.equal(ended.powerSpike, null);
  assert.equal(ended.adaptiveBuild, null);
  assert.equal(ended.coachCall, null);
  assert.equal(ended.dataQuality.overall, 'UNAVAILABLE');
  assert.equal(ended.runtimeMetadata.engineProjections, false);
  assert.equal(ended.runtimeMetadata.reviewAvailable, true);
  assert.equal(ended.review.matchId, started.state.matchId);
  assert.equal(typeof ended.review.flowPerformanceIndex, 'number');
  assert.equal(ended.review.metrics.FPI, ended.review.flowPerformanceIndex);
  assert.ok(Array.isArray(ended.review.timeline));
});

test('starting a new match clears the previous review and creates a new session', () => {
  const runtime = new MockMatchRuntime();
  const first = runtime.startMatch(command);
  runtime.advance(30);
  const ended = runtime.endMatch();
  assert.ok(ended.review);

  const second = runtime.startMatch({ ...command, hero: 'axe', role: 'offlane' });
  assert.equal(second.state.phase, 'playing');
  assert.equal(second.state.hero, 'axe');
  assert.equal(second.state.role, 'offlane');
  assert.equal(second.review, null);
  assert.notEqual(second.state.matchId, first.state.matchId);
  assert.ok(second.coachCall);
});
