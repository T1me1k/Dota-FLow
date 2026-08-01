import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  GepDiagnosticSession,
  GepFeatureHealthTracker,
  diagnoseJsonlRecording,
  inspectRawGameEvents,
  parseJsonl,
  serializeJsonl,
  toCanonicalGameEvents
} from '../src/index.mjs';

test('one raw game envelope maps every event instead of only the first', () => {
  const raw = {
    events: [
      { name: 'clock_time_changed', data: { clock_time: 500 } },
      { name: 'gold', data: { gold: 1200 } },
      { name: 'mystery_event', data: { value: 1 } }
    ]
  };
  const inspected = inspectRawGameEvents(raw);
  const canonical = toCanonicalGameEvents(raw);
  assert.equal(inspected.length, 3);
  assert.equal(canonical.length, 2);
  assert.deepEqual(canonical.map((event) => event.type), ['CLOCK_UPDATED', 'GOLD_CHANGED']);
  assert.equal(inspected[2].status, 'ignored');
});

test('feature health distinguishes active, stale, unseen and unexpected features', () => {
  const tracker = new GepFeatureHealthTracker({ expectedFeatures: ['gold', 'gpm'], staleAfterMs: 1000 });
  tracker.observe({ type: 'status', payload: { features: ['gold', 'gpm'] }, receivedAt: 1000 });
  tracker.observe({ type: 'game-event', payload: { name: 'gold', data: { gold: 900 } }, receivedAt: 1100 });
  tracker.observe({ type: 'game-event', payload: { name: 'future_feature', data: {} }, receivedAt: 2500 });
  const snapshot = tracker.snapshot(2600);
  assert.equal(snapshot.features.find((feature) => feature.name === 'gold').status, 'STALE');
  assert.equal(snapshot.features.find((feature) => feature.name === 'gpm').status, 'UNSEEN');
  assert.equal(snapshot.features.find((feature) => feature.name === 'future_feature').status, 'ACTIVE');
  assert.equal(snapshot.summary.unexpected, 1);
});

test('diagnostic session records canonical mappings, unknown payloads and receipt gaps', () => {
  const session = new GepDiagnosticSession({
    expectedFeatures: ['clock_time_changed', 'gold'],
    gapThresholdMs: 1000,
    staleAfterMs: 1000,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  session.ingestEnvelope({
    type: 'game-event',
    payload: { events: [
      { name: 'clock_time_changed', data: { clock_time: 600 } },
      { name: 'gold', data: { gold: 1400 } },
      { name: 'unknown_event', data: {} }
    ] },
    receivedAt: 1000
  });
  const report = session.ingestEnvelope({
    type: 'game-event',
    payload: { name: 'gpm', data: { gpm: 500, game_time: 600 } },
    receivedAt: 3000
  });
  assert.equal(report.summary.envelopeCount, 2);
  assert.equal(report.summary.canonicalEventCount, 3);
  assert.equal(report.summary.ignoredMappingCount, 1);
  assert.equal(report.pipeline.state.gold, 1400);
  assert.equal(report.pipeline.state.gpm, 500);
  assert.ok(report.issues.some((issue) => issue.code === 'UNMAPPED_PAYLOAD'));
  assert.ok(report.issues.some((issue) => issue.code === 'ENVELOPE_GAP'));
});

test('JSONL parser keeps valid lines and reports malformed lines without aborting import', () => {
  const text = [
    JSON.stringify({ type: 'status', payload: { mode: 'mock' }, receivedAt: 1 }),
    '{not json}',
    '',
    JSON.stringify({ type: 'game-event', payload: { name: 'gold', data: { gold: 777 } }, receivedAt: 2 })
  ].join('\n');
  const parsed = parseJsonl(text);
  assert.equal(parsed.records.length, 2);
  assert.equal(parsed.errors.length, 1);
  const report = diagnoseJsonlRecording(text, { expectedFeatures: ['gold'] });
  assert.equal(report.recording.parseErrorCount, 1);
  assert.equal(report.pipeline.state.gold, 777);
  assert.ok(report.issues.some((issue) => issue.code === 'JSONL_PARSE_ERROR'));
});

test('JSONL serialization round-trips GEP envelopes', () => {
  const records = [
    { type: 'status', payload: { mode: 'mock' }, receivedAt: 1 },
    { type: 'game-event', payload: { name: 'gold', data: { gold: 1000 } }, receivedAt: 2 }
  ];
  const parsed = parseJsonl(serializeJsonl(records));
  assert.deepEqual(parsed.records.map((record) => record.value), records);
  assert.equal(parsed.errors.length, 0);
});

test('bundled GEP recording produces deterministic diagnostics', async () => {
  const text = await readFile(new URL('../../../fixtures/recordings/sample-gep-session.jsonl', import.meta.url), 'utf8');
  const report = diagnoseJsonlRecording(text, {
    staleAfterMs: 5000,
    gapThresholdMs: 5000,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  assert.equal(report.recording.parseErrorCount, 0);
  assert.equal(report.summary.envelopeCount, 8);
  assert.equal(report.summary.canonicalEventCount, 9);
  assert.equal(report.summary.ignoredMappingCount, 1);
  assert.equal(report.pipeline.state.hero, 'luna');
  assert.equal(report.pipeline.state.matchId, 'sample-match-7314');
  assert.equal(report.pipeline.state.gameTimeSec, 720);
  assert.ok(report.pipeline.state.inventory.some((item) => item.id === 'item_mask_of_madness'));
  assert.ok(report.issues.some((issue) => issue.code === 'ENVELOPE_GAP'));
  assert.ok(report.issues.some((issue) => issue.code === 'GEP_STATUS_WARNING'));
});
