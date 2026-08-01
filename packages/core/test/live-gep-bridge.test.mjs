import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LIVE_BRIDGE_STATES,
  LiveGepBridge,
  fingerprintGepEnvelope,
  parseJsonl
} from '../src/index.mjs';

function status(payload, receivedAt = 1000) {
  return { type: 'status', gameId: 7314, payload, receivedAt };
}

function info(feature, infoValue, receivedAt, extra = {}) {
  return {
    type: 'info-update',
    gameId: 7314,
    payload: { feature, info: { [feature]: infoValue } },
    receivedAt,
    ...extra
  };
}

function game(name, data, receivedAt, extra = {}) {
  return {
    type: 'game-event',
    gameId: 7314,
    payload: { name, data },
    receivedAt,
    ...extra
  };
}

test('live bridge forwards envelopes into one persistent diagnostic pipeline', () => {
  let now = 1000;
  const bridge = new LiveGepBridge({
    now: () => now,
    expectedFeatures: ['gold', 'gpm'],
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  const snapshots = [];
  const unsubscribe = bridge.subscribe((snapshot) => snapshots.push(snapshot));

  bridge.ingestEnvelope(status({ mode: 'overwolf', features: ['gold', 'gpm'] }, 1000));
  bridge.ingestEnvelope(game('gold', { gold: 1450 }, 1100));
  const snapshot = bridge.ingestEnvelope(game('gpm', { gpm: 520, game_time: 600 }, 1200));

  assert.equal(snapshot.bridge.state, LIVE_BRIDGE_STATES.LIVE);
  assert.equal(snapshot.bridge.forwardedEnvelopeCount, 3);
  assert.equal(snapshot.diagnostics.pipeline.state.gold, 1450);
  assert.equal(snapshot.diagnostics.pipeline.state.gpm, 520);
  assert.equal(snapshot.diagnostics.summary.canonicalEventCount, 2);
  assert.ok(snapshots.length >= 4);

  unsubscribe();
  now = 1300;
  assert.equal(bridge.snapshot().bridge.subscriberCount, 0);
});

test('transport duplicates are suppressed without re-dispatching canonical events', () => {
  const bridge = new LiveGepBridge({ dedupeWindowMs: 5000 });
  const envelope = game('gold', { gold: 900 }, 2000, { sourceSequence: 42 });

  bridge.ingestEnvelope(envelope);
  const duplicate = bridge.ingestEnvelope({ ...envelope, receivedAt: 2100 });

  assert.equal(duplicate.bridge.receivedEnvelopeCount, 2);
  assert.equal(duplicate.bridge.forwardedEnvelopeCount, 1);
  assert.equal(duplicate.bridge.duplicateEnvelopeCount, 1);
  assert.equal(duplicate.diagnostics.summary.envelopeCount, 1);
  assert.equal(duplicate.diagnostics.pipeline.eventCount, 1);
  assert.ok(duplicate.bridgeEvents.some((event) => event.code === 'DUPLICATE_ENVELOPE'));
});

test('fallback fingerprints can be accepted again after the dedupe window expires', () => {
  let now = 1000;
  const bridge = new LiveGepBridge({ dedupeWindowMs: 1000, now: () => now });
  const envelope = game('gold', { gold: 700 }, 1000);
  bridge.ingestEnvelope(envelope);
  now = 2501;
  const snapshot = bridge.ingestEnvelope(envelope);

  assert.equal(snapshot.bridge.forwardedEnvelopeCount, 2);
  assert.equal(snapshot.bridge.duplicateEnvelopeCount, 0);
  assert.equal(snapshot.diagnostics.pipeline.state.gold, 700);
});

test('explicit source identities remain deduplicated beyond the fallback window', () => {
  let now = 1000;
  const bridge = new LiveGepBridge({ dedupeWindowMs: 1000, now: () => now });
  bridge.ingestEnvelope(game('gold', { gold: 700 }, 1000, { sourceSequence: 'gold-1' }));
  now = 5000;
  const snapshot = bridge.ingestEnvelope(game('gold', { gold: 700 }, 5000, { sourceSequence: 'gold-1' }));

  assert.equal(snapshot.bridge.forwardedEnvelopeCount, 1);
  assert.equal(snapshot.bridge.duplicateEnvelopeCount, 1);
});

test('connection health moves through unavailable, degraded, live and stale states', () => {
  let now = 1000;
  const bridge = new LiveGepBridge({ now: () => now, connectionStaleAfterMs: 1000 });

  assert.equal(bridge.snapshot().bridge.state, LIVE_BRIDGE_STATES.WAITING);
  assert.equal(bridge.ingestEnvelope(status({ mode: 'mock', message: 'No runtime' }, 1000)).bridge.state, LIVE_BRIDGE_STATES.UNAVAILABLE);
  assert.equal(bridge.ingestEnvelope(status({ warning: 'GEP reconnecting' }, 1100)).bridge.state, LIVE_BRIDGE_STATES.DEGRADED);
  assert.equal(bridge.ingestEnvelope(game('gold', { gold: 1000 }, 1200)).bridge.state, LIVE_BRIDGE_STATES.LIVE);

  now = 2301;
  assert.equal(bridge.snapshot().bridge.state, LIVE_BRIDGE_STATES.STALE);
  assert.match(bridge.snapshot().bridge.message, /No forwarded GEP envelope/);
});

test('a new match id rotates the diagnostic session and archives the previous match', () => {
  const bridge = new LiveGepBridge({
    maxArchives: 3,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });

  bridge.ingestEnvelope(info('match_info', { pseudo_match_id: 'match-a' }, 1000));
  bridge.ingestEnvelope(info('me', { team: 'radiant', hero: 'luna' }, 1100));
  bridge.ingestEnvelope(game('gold', { gold: 1800 }, 1200));
  const rotated = bridge.ingestEnvelope(info('match_info', { pseudo_match_id: 'match-b' }, 5000));

  assert.equal(rotated.bridge.activeMatchId, 'match-b');
  assert.equal(rotated.bridge.session.generation, 2);
  assert.equal(rotated.bridge.session.archiveCount, 1);
  assert.equal(rotated.archives[0].matchId, 'match-a');
  assert.equal(rotated.archives[0].startedAt, 1000);
  assert.equal(rotated.archives[0].endedAt, 5000);
  assert.equal(rotated.archives[0].finalState.gold, 1800);
  assert.equal(rotated.diagnostics.summary.envelopeCount, 1);
  assert.equal(rotated.diagnostics.pipeline.state.matchId, 'match-b');
  assert.equal(rotated.diagnostics.pipeline.state.gold, 600);
  assert.ok(rotated.bridgeEvents.some((event) => event.code === 'SESSION_ROTATED'));
});



test('official game_state_changed match IDs rotate the live session', () => {
  const bridge = new LiveGepBridge({
    maxArchives: 3,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });

  bridge.ingestEnvelope(game('game_state_changed', {
    game_state: 'playing',
    match_state: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS',
    match_id: 'state-match-a'
  }, 1000));
  bridge.ingestEnvelope(game('gold', { gold: 1600 }, 1100));
  const rotated = bridge.ingestEnvelope(game('game_state_changed', {
    game_state: 'playing',
    match_state: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS',
    match_id: 'state-match-b'
  }, 5000));

  assert.equal(rotated.bridge.activeMatchId, 'state-match-b');
  assert.equal(rotated.bridge.session.generation, 2);
  assert.equal(rotated.bridge.session.archiveCount, 1);
  assert.equal(rotated.archives[0].matchId, 'state-match-a');
  assert.equal(rotated.diagnostics.pipeline.state.matchId, 'state-match-b');
});

test('late identity from the previous match cannot rotate the bridge backward', () => {
  const bridge = new LiveGepBridge({ maxArchives: 3 });
  bridge.ingestEnvelope(info('match_info', { pseudo_match_id: 'match-a' }, 1000));
  bridge.ingestEnvelope(game('gold', { gold: 1700 }, 1100));
  bridge.ingestEnvelope(info('match_info', { pseudo_match_id: 'match-b' }, 5000));
  const late = bridge.ingestEnvelope(info('match_info', { pseudo_match_id: 'match-a' }, 6000));

  assert.equal(late.bridge.activeMatchId, 'match-b');
  assert.equal(late.bridge.session.generation, 2);
  assert.equal(late.bridge.session.archiveCount, 1);
  assert.equal(late.bridge.droppedEnvelopeCount, 1);
  assert.equal(late.diagnostics.pipeline.state.matchId, 'match-b');
  assert.ok(late.diagnostics.issues.some((issue) => issue.code === 'STALE_MATCH_IDENTITY'));
  assert.ok(late.bridgeEvents.some((event) => event.code === 'STALE_MATCH_ENVELOPE_DROPPED'));
});

test('stopped bridge drops incoming envelopes until a manual reset', () => {
  let now = 1000;
  const bridge = new LiveGepBridge({ now: () => now });
  bridge.ingestEnvelope(game('gold', { gold: 1000 }, 1000));
  bridge.stop('app shutdown');
  const dropped = bridge.ingestEnvelope(game('gold', { gold: 9999 }, 1100));

  assert.equal(dropped.bridge.state, LIVE_BRIDGE_STATES.STOPPED);
  assert.equal(dropped.bridge.droppedEnvelopeCount, 1);
  assert.equal(dropped.diagnostics.pipeline.state.gold, 1000);

  now = 2000;
  const reset = bridge.reset({ archive: false });
  assert.equal(reset.bridge.state, LIVE_BRIDGE_STATES.WAITING);
  assert.equal(bridge.ingestEnvelope(game('gold', { gold: 1200 }, 2100)).diagnostics.pipeline.state.gold, 1200);
});

test('envelope fingerprints are stable across object key ordering', () => {
  const first = {
    type: 'game-event',
    gameId: 7314,
    receivedAt: 1000,
    payload: { name: 'gold', data: { gold: 900, reliable: 100 } }
  };
  const second = {
    payload: { data: { reliable: 100, gold: 900 }, name: 'gold' },
    receivedAt: 1000,
    gameId: 7314,
    type: 'game-event'
  };
  assert.equal(fingerprintGepEnvelope(first), fingerprintGepEnvelope(second));
});


test('bundled live bridge stream is deterministic across duplicate and match rotation', async () => {
  const text = await readFile(new URL('../../../fixtures/recordings/live-bridge-session.jsonl', import.meta.url), 'utf8');
  const parsed = parseJsonl(text);
  const bridge = new LiveGepBridge({
    staleAfterMs: 5000,
    gapThresholdMs: 5000,
    connectionStaleAfterMs: 5000,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  const snapshot = bridge.ingestMany(parsed.records.map((record) => record.value));

  assert.equal(parsed.errors.length, 0);
  assert.equal(snapshot.bridge.receivedEnvelopeCount, 12);
  assert.equal(snapshot.bridge.forwardedEnvelopeCount, 11);
  assert.equal(snapshot.bridge.duplicateEnvelopeCount, 1);
  assert.equal(snapshot.bridge.session.archiveCount, 1);
  assert.equal(snapshot.bridge.activeMatchId, 'live-match-b');
  assert.equal(snapshot.bridge.state, LIVE_BRIDGE_STATES.LIVE);
  assert.equal(snapshot.diagnostics.pipeline.state.hero, 'phantom_assassin');
  assert.equal(snapshot.diagnostics.pipeline.state.gameTimeSec, 420);
  assert.equal(snapshot.diagnostics.summary.canonicalEventCount, 6);
});
