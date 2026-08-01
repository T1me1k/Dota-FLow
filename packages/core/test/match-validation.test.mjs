import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  MATCH_CAPTURE_STATES,
  MATCH_VALIDATION_PROFILES,
  MatchCaptureTracker,
  inspectInfoUpdates,
  toCanonicalGameEvents,
  validateJsonlRecording,
  validateRecordingSuite
} from '../src/index.mjs';

const fixtureUrl = new URL('../../../fixtures/recordings/real-match-validation-session.jsonl', import.meta.url);

test('official key/value info updates map to canonical match, player and phase events', () => {
  const match = inspectInfoUpdates({
    feature: 'match_info', category: 'match_info', key: 'pseudo_match_id', value: 'abc-123'
  })[0].canonicalEvent;
  const hero = inspectInfoUpdates({
    feature: 'me', category: 'me', key: 'hero', value: 'luna'
  })[0].canonicalEvent;
  const phase = inspectInfoUpdates({
    feature: 'match_state_changed', category: 'game', key: 'match_state', value: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS'
  })[0].canonicalEvent;

  assert.equal(match.type, 'MATCH_IDENTIFIED');
  assert.equal(match.payload.matchId, 'abc-123');
  assert.equal(hero.type, 'PLAYER_IDENTIFIED');
  assert.equal(hero.payload.hero, 'luna');
  assert.equal(phase.type, 'GAME_SNAPSHOT');
  assert.equal(phase.payload.phase, 'playing');
});

test('official new_game and game_over payloads map match lifecycle', () => {
  const events = toCanonicalGameEvents({ events: [
    { name: 'new_game', data: '' },
    { name: 'game_over', data: '' }
  ] });
  assert.deepEqual(events.map((event) => event.type), ['MATCH_STARTED', 'MATCH_ENDED']);
});

test('complete validation fixture passes the release profile and infers payload contracts', async () => {
  const text = await readFile(fixtureUrl, 'utf8');
  const report = validateJsonlRecording(text, {
    profile: MATCH_VALIDATION_PROFILES.RELEASE,
    gapThresholdMs: 10_000,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });

  assert.notEqual(report.status, 'BLOCKED');
  assert.equal(report.summary.blockerCount, 0);
  assert.equal(report.signals.find((signal) => signal.id === 'next_match_reset').pass, true);
  assert.equal(report.calibration.matchIds.length, 2);
  assert.ok(report.calibration.itemAcquisitions.some((item) => item.itemId === 'item_manta'));
  const itemContract = report.contracts.find((contract) => contract.feature === 'hero_item_changed');
  assert.equal(itemContract.stringifiedJsonCount, 3);
  assert.ok(itemContract.keys.some((key) => key.name === 'name'));
});


test('validation blocks captures when the runtime reports a missing required feature', async () => {
  const text = await readFile(fixtureUrl, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  const status = JSON.parse(lines[0]);
  status.payload.supportedFeatures = status.payload.supportedFeatures.filter((feature) => feature !== 'hero_item_changed');
  status.payload.features = status.payload.features.filter((feature) => feature !== 'hero_item_changed');
  status.payload.missingFeatures = ['hero_item_changed'];
  lines[0] = JSON.stringify(status);
  const report = validateJsonlRecording(`${lines.join('\n')}\n`, {
    profile: MATCH_VALIDATION_PROFILES.RELEASE,
    gapThresholdMs: 10_000
  });

  assert.equal(report.status, 'BLOCKED');
  const signal = report.signals.find((entry) => entry.id === 'feature_registration');
  assert.equal(signal.pass, false);
  assert.deepEqual(signal.evidence.missingRequiredFeatures, ['hero_item_changed']);
});

test('validation blocks a recording that never exposes inventory changes', async () => {
  const text = await readFile(fixtureUrl, 'utf8');
  const filtered = text.split(/\r?\n/)
    .filter((line) => line && !line.includes('hero_item_changed'))
    .join('\n');
  const report = validateJsonlRecording(`${filtered}\n`, { gapThresholdMs: 10_000 });
  assert.equal(report.status, 'BLOCKED');
  assert.equal(report.signals.find((signal) => signal.id === 'inventory_updates').pass, false);
});

test('suite gate requires five passing recordings and one cross-match reset', async () => {
  const text = await readFile(fixtureUrl, 'utf8');
  const collecting = validateRecordingSuite([{ name: 'one.jsonl', text }]);
  assert.equal(collecting.status, 'COLLECTING');
  assert.equal(collecting.summary.remainingRecordingCount, 4);

  const ready = validateRecordingSuite(Array.from({ length: 5 }, (_, index) => ({ name: `${index}.jsonl`, text })));
  assert.equal(ready.status, 'READY');
  assert.equal(ready.summary.passingRecordingCount, 5);
});

test('capture tracker creates a validation-ready manifest summary', () => {
  let now = 1000;
  const tracker = new MatchCaptureTracker({ now: () => now, appVersion: '0.7.0-test' });
  tracker.start({ captureId: 'capture-test', gameId: 7314 });
  tracker.observe({
    type: 'game-event',
    payload: { events: [{ name: 'gold', data: '{"gold":700}' }] },
    receivedAt: 1100
  }, {
    bridge: { state: 'LIVE', activeMatchId: 'match-a' },
    diagnostics: { summary: { envelopeCount: 1 }, pipeline: { state: { hero: 'luna', matchId: 'match-a' } } }
  });
  now = 2000;
  const stopped = tracker.stop('TEST_COMPLETE');
  assert.equal(stopped.state, MATCH_CAPTURE_STATES.STOPPED);
  assert.equal(stopped.captureId, 'capture-test');
  assert.equal(stopped.envelopeCount, 1);
  assert.deepEqual(stopped.matchIds, ['match-a']);
  assert.deepEqual(stopped.heroes, ['luna']);
  assert.equal(stopped.featureCounts.gold, 1);
  assert.equal(stopped.files.events, 'events.jsonl');
});
