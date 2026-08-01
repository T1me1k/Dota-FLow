import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game-state.mjs';
import { buildPregameBriefing } from '../src/pregame-briefing.mjs';
import { MockMatchRuntime } from '../src/mock-match-runtime.mjs';

test('pre-game intelligence fails closed when no draft is available', () => {
  const briefing = buildPregameBriefing(createInitialGameState());

  assert.equal(briefing.status, 'UNAVAILABLE');
  assert.equal(briefing.dataQuality, 'UNAVAILABLE');
  assert.equal(briefing.draftSummary, null);
  assert.equal(briefing.matchPlan, null);
  assert.equal(briefing.buildPlan, null);
  assert.equal(briefing.adaptiveBuild.status, 'WAITING_FOR_DRAFT');
  assert.deepEqual(briefing.counterItems, []);
  assert.ok(briefing.missingSignals.includes('Союзный draft: 0/5'));
  assert.ok(briefing.missingSignals.includes('Вражеский draft: 0/5'));
});

test('partial draft is useful but visibly marked as partial', () => {
  const briefing = buildPregameBriefing(createInitialGameState({
    hero: 'luna',
    role: 'carry',
    draft: {
      radiant: ['luna', 'axe'],
      dire: ['lion', 'zeus']
    }
  }));

  assert.equal(briefing.status, 'PARTIAL');
  assert.equal(briefing.dataQuality, 'PARTIAL');
  assert.equal(briefing.draftSummary.ownCount, 2);
  assert.equal(briefing.draftSummary.enemyCount, 2);
  assert.ok(briefing.threats.length > 0);
  assert.ok(briefing.counterItems.length > 0);
  assert.ok(briefing.matchPlan);
  assert.ok(briefing.missingSignals.length === 2);
});

test('complete mock draft publishes ready pre-game intelligence through the runtime snapshot', () => {
  const runtime = new MockMatchRuntime();
  const snapshot = runtime.startMatch({
    hero: 'luna',
    role: 'carry',
    draft: {
      radiant: ['luna', 'axe', 'puck', 'tusk', 'treant_protector'],
      dire: ['juggernaut', 'underlord', 'windranger', 'crystal_maiden', 'zeus']
    }
  });

  const briefing = snapshot.coach?.pregame;
  assert.ok(briefing);
  assert.equal(briefing.status, 'READY');
  assert.equal(briefing.dataQuality, 'INFERRED');
  assert.equal(briefing.draftSummary.ownCount, 5);
  assert.equal(briefing.draftSummary.enemyCount, 5);
  assert.equal(briefing.missingSignals.length, 0);
  assert.ok(briefing.threats.length > 0);
  assert.ok(briefing.strengths.length > 0);
  assert.ok(briefing.buildPlan);
  assert.ok(briefing.adaptiveBuild.recommendedPlan);
  assert.ok(briefing.counterItems.length > 0);
  assert.ok(briefing.matchPlan?.fightRule);
  assert.ok(briefing.matchPlan?.conversion);
});
