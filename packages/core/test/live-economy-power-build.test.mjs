import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGameEventPipeline } from '../src/live-pipeline.mjs';
import { evaluateLaningStance } from '../src/laning-stance-engine.mjs';
import { reduceGameEvent } from '../src/gep-normalizer.mjs';
import { createInitialGameState } from '../src/game-state.mjs';
import { GAME_EVENT_TYPES } from '../src/game-events.mjs';

const root = resolve(import.meta.dirname, '../../..');

function morphlingState(overrides = {}) {
  return {
    source: 'gsi',
    phase: 'playing',
    gameTimeSec: 8 * 60,
    hero: 'morphling',
    role: 'carry',
    level: 7,
    gold: 850,
    gpm: 455,
    xpm: 510,
    health: 1050,
    maxHealth: 1300,
    mana: 520,
    maxMana: 700,
    alive: true,
    ultimateReady: true,
    inventory: [{ id: 'item_power_treads', name: 'Power Treads' }],
    abilities: {
      ability0: { name: 'morphling_waveform', level: 3, cooldown: 0, canCast: true },
      ability5: { name: 'morphling_replicate', level: 1, cooldown: 0, canCast: true, ultimate: true }
    },
    progression: { levelReachedAt: { 6: 450 }, itemAcquiredAt: {} },
    roleContext: {
      playerNetWorth: 4200,
      laneOpponentNetWorth: 0,
      dangerLevel: 0.2,
      alliesNearby: 1,
      enemiesNearby: 1,
      meta: { quality: 'LIVE', signals: { playerNetWorth: { quality: 'LIVE', value: 4200 } } }
    },
    context: { safeRouteAvailable: false, roshanAvailable: false, alliesReady: 0, enemiesVisible: 0 },
    draft: { radiant: ['morphling'], dire: [] },
    ...overrides
  };
}

test('live Morphling snapshot exposes a named power spike and usable adaptive build card', () => {
  const pipeline = createGameEventPipeline({ initialState: morphlingState() });
  const snapshot = pipeline.snapshot();

  assert.equal(snapshot.powerSpike.status, 'ACTIVE');
  assert.match(snapshot.powerSpike.name, /Morph/i);
  assert.equal(snapshot.powerSpike.available, true);
  assert.equal(typeof snapshot.powerSpike.recommendation, 'string');
  assert.equal(snapshot.powerSpike.statusLabelRu, 'Активен');
  assert.equal(snapshot.powerSpike.statusLabelEn, 'Active');

  assert.equal(snapshot.adaptiveBuild.status, 'READY');
  assert.equal(typeof snapshot.adaptiveBuild.activePlan, 'string');
  assert.equal(snapshot.adaptiveBuild.nextItem, 'Manta Style');
  assert.equal(snapshot.adaptiveBuild.nextItemId, 'item_manta');
});

test('adaptive build advances to the next confirmed unowned item after inventory changes', () => {
  const pipeline = createGameEventPipeline({ initialState: morphlingState() });
  const snapshot = pipeline.dispatch({
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    source: 'gsi',
    gameTimeSec: 540,
    payload: {
      inventory: [
        { id: 'item_power_treads', name: 'Power Treads' },
        { id: 'item_manta', name: 'Manta Style' }
      ]
    }
  });

  assert.notEqual(snapshot.adaptiveBuild.nextItemId, 'item_manta');
  assert.equal(snapshot.adaptiveBuild.nextItemId, 'item_sphere');
  assert.equal(snapshot.adaptiveBuild.nextItem, "Linken's Sphere");
});

test('observed local net worth survives a GSI snapshot and is used by the laning engine', () => {
  const raw = {
    name: 'gsi_snapshot',
    data: morphlingState({
      gameTimeSec: 240,
      level: 4,
      roleContext: {
        playerNetWorth: 4200,
        laneOpponentNetWorth: 0,
        dangerLevel: 0.2,
        alliesNearby: 1,
        enemiesNearby: 1,
        meta: { quality: 'LIVE', signals: { playerNetWorth: { quality: 'LIVE', value: 4200 } } }
      }
    })
  };
  const state = reduceGameEvent(createInitialGameState(), raw);
  const stance = evaluateLaningStance(state);

  assert.equal(state.roleContext.playerNetWorth, 4200);
  assert.equal(state.roleContext.meta.signals.playerNetWorth.quality, 'LIVE');
  assert.equal(stance.economy.value, 4200);
  assert.equal(stance.economy.quality, 'OBSERVED');
});

test('GSI adapter maps exact local net worth and ultimate readiness without enemy inference', async () => {
  const adapter = await readFile(resolve(root, 'apps/overwolf-electron/src/main/dota-gsi-adapter.ts'), 'utf8');

  assert.match(adapter, /player\.net_worth \?\? player\.networth/);
  assert.match(adapter, /playerNetWorth: netWorth \?\? 0/);
  assert.match(adapter, /quality: netWorth !== undefined \? 'LIVE' : 'UNAVAILABLE'/);
  assert.match(adapter, /ultimateReadyFromAbilities/);
  assert.match(adapter, /ultimateReady/);
  assert.doesNotMatch(adapter, /enemyNetWorth|enemy_net_worth/);
});
