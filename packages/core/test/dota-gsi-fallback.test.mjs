import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { toCanonicalGameEvent, reduceGameEvent } from '../src/gep-normalizer.mjs';
import { createInitialGameState } from '../src/game-state.mjs';
import { normalizeGameState } from '../src/game-state-normalizer.mjs';
import { orchestrateDecision } from '../src/decision-orchestrator.mjs';
import { GAME_EVENT_TYPES } from '../src/game-events.mjs';

const root = resolve(import.meta.dirname, '../../..');

test('direct Dota GSI snapshots normalize into full canonical game snapshots', () => {
  const raw = {
    name: 'gsi_snapshot',
    data: {
      source: 'gsi',
      phase: 'playing',
      gameTimeSec: 321,
      clock_time: 321,
      matchId: '987654321',
      steamId: '76561198000000000',
      hero: 'slark',
      role: 'unknown',
      team: 'radiant',
      level: 12,
      gold: 2450,
      gpm: 510,
      xpm: 620,
      health: 1200,
      maxHealth: 1800,
      mana: 500,
      maxMana: 900,
      kills: 5,
      deaths: 2,
      assists: 7,
      lastHits: 84,
      denies: 9,
      alive: true,
      targetItem: null,
      context: { safeRouteAvailable: false, roshanAvailable: false },
      inventory: [{ id: 'power_treads', name: 'power_treads' }]
    }
  };

  const event = toCanonicalGameEvent(raw);
  assert.equal(event.type, GAME_EVENT_TYPES.GAME_SNAPSHOT);
  assert.equal(event.source, 'gsi');
  assert.equal(event.gameTimeSec, 321);
  assert.equal(event.payload.hero, 'slark');
  assert.equal(event.payload.matchId, '987654321');

  const state = reduceGameEvent(createInitialGameState(), raw);
  assert.equal(state.source, 'gsi');
  assert.equal(state.phase, 'playing');
  assert.equal(state.hero, 'slark');
  assert.equal(state.role, 'unknown');
  assert.equal(state.gameTimeSec, 321);
  assert.equal(state.gold, 2450);
  assert.equal(state.context.safeRouteAvailable, false);
  assert.equal(state.context.roshanAvailable, false);
  assert.equal(state.targetItem, null);
  assert.equal(state.inventory[0].id, 'item_power_treads');
});

test('unknown live role is preserved instead of falling back to carry', () => {
  const base = createInitialGameState({ role: 'unknown' });
  const normalized = normalizeGameState(base, { ...base, role: 'unknown' }, { eventType: 'GAME_SNAPSHOT' });
  assert.equal(normalized.role, 'unknown');
});

test('pregame phase blocks Roshan and other active coaching calls', () => {
  const pregame = orchestrateDecision({
    state: { phase: 'pregame', gameTimeSec: 75, source: 'gsi', alive: true },
    objectiveDecision: {
      action: 'TAKE_ROSHAN',
      confidence: 0.95,
      reasons: ['Roshan appears available'],
      missingSignals: []
    },
    dataQuality: { overall: 'LIVE' }
  });

  assert.equal(pregame.primaryAction, 'WAIT_FOR_HORN');
  assert.equal(pregame.urgency, 'INFORMATIONAL');
  assert.doesNotMatch(pregame.instruction, /Roshan/i);

  const playing = orchestrateDecision({
    state: { phase: 'playing', gameTimeSec: 0, source: 'gsi', alive: true, health: 600, maxHealth: 600 },
    objectiveDecision: {
      action: 'TAKE_ROSHAN',
      confidence: 0.95,
      reasons: ['Roshan appears available'],
      missingSignals: []
    },
    dataQuality: { overall: 'LIVE' }
  });

  assert.notEqual(playing.primaryAction, 'WAIT_FOR_HORN');
});

test('Overwolf dev launcher installs and starts the local Dota GSI fallback', async () => {
  const rootPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const launcher = await readFile(resolve(root, 'scripts/overwolf-dev.mjs'), 'utf8');
  const installer = await readFile(resolve(root, 'scripts/dota-gsi-install.mjs'), 'utf8');
  const main = await readFile(resolve(root, 'apps/overwolf-electron/src/main/main.ts'), 'utf8');
  const adapter = await readFile(resolve(root, 'apps/overwolf-electron/src/main/dota-gsi-adapter.ts'), 'utf8');
  const runtimeStore = await readFile(resolve(root, 'apps/desktop/src/runtime/store.tsx'), 'utf8');

  assert.equal(rootPackage.scripts['dota:gsi:install'], 'node scripts/dota-gsi-install.mjs');
  assert.match(launcher, /runNpmScript\('dota:gsi:install'\)/);
  assert.match(installer, /gamestate_integration_dota_flow\.cfg/);
  assert.match(installer, /127\.0\.0\.1:\$\{GSI_PORT\}\$\{GSI_PATH\}/);
  assert.match(installer, /"provider" "1"/);
  assert.match(installer, /"hero" "1"/);
  assert.match(installer, /"items" "1"/);
  assert.match(installer, /"throttle" "0\.25"/);
  assert.match(main, /new DotaGsiAdapter\(broadcastGsi\)/);
  assert.match(main, /if \(fresh\(lastGsiDataAt\)\) return/);
  assert.match(main, /capture:\s*captureRecorder\?\.status\(\) \?\? null/);
  assert.match(main, /roshanAvailable:\s*false/);
  assert.match(adapter, /GSI_CONNECTED/);
  assert.match(adapter, /gsi_snapshot/);
  assert.match(adapter, /DEFAULT_GSI_EMIT_INTERVAL_MS = 250/);
  assert.match(adapter, /clockMode: phase === 'pregame' \? 'countdown' : 'elapsed'/);
  assert.match(adapter, /role: 'unknown'/);
  assert.match(adapter, /safeRouteAvailable: false/);
  assert.match(adapter, /roshanAvailable: false/);
  assert.match(adapter, /127\.0\.0\.1/);
  assert.match(runtimeStore, /diagnostics\?\.pipeline/);
  assert.match(runtimeStore, /BRIDGE_STATUS_LABELS/);
  assert.match(runtimeStore, /canonicalEventCount/);
  assert.match(runtimeStore, /rawRole === 'unknown'/);
  assert.match(runtimeStore, /macroDecision:\s*pipeline\.macroDecision\s*\?\?\s*pipeline\.decision/);
  assert.match(runtimeStore, /transport:\s*source === 'gsi'/);
  assert.doesNotMatch(installer, /OW_DEV_KEY|OW_CLI_API_KEY/);
});
