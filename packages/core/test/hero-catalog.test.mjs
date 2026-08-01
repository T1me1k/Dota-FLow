import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_EVENT_TYPES,
  HERO_PROFILE_TIERS,
  applyGameEvent,
  createInitialGameState,
  defaultTargetItem,
  evaluateMacroDecision,
  getHeroProfile,
  getHeroTags,
  listHeroProfiles,
  normalizeGameState,
  resolveHeroId
} from '../src/index.mjs';

const REQUIRED_DIMENSIONS = ['farm', 'fight', 'push', 'survival', 'initiation', 'objective', 'mobility'];

test('current Dota roster exposes 127 unique hero profiles including Largo', () => {
  const profiles = listHeroProfiles();
  assert.equal(profiles.length, 127);
  assert.equal(new Set(profiles.map((profile) => profile.id)).size, 127);
  assert.equal(new Set(profiles.map((profile) => profile.displayName)).size, 127);
  assert.ok(profiles.some((profile) => profile.id === 'ringmaster'));
  assert.ok(profiles.some((profile) => profile.id === 'kez'));
  assert.ok(profiles.some((profile) => profile.id === 'largo'));
});

test('hero intelligence packs expose 40 detailed heroes while uncalibrated heroes stay conservative', () => {
  const profiles = listHeroProfiles();
  const detailed = profiles.filter((profile) => profile.calibrationTier === HERO_PROFILE_TIERS.DETAILED);
  const baseline = profiles.filter((profile) => profile.calibrationTier === HERO_PROFILE_TIERS.BASELINE);

  assert.equal(detailed.length, 40);
  assert.equal(baseline.length, 95);
  assert.ok(['anti_mage', 'faceless_void', 'medusa', 'naga_siren', 'slark', 'spectre', 'terrorblade']
    .every((heroId) => detailed.some((profile) => profile.id === heroId)));
  assert.ok(detailed.every((profile) => profile.buildPlans.some((plan) => plan.items.length >= 4)));
  assert.ok(detailed.every((profile) => profile.spikes.length >= 3));
  assert.ok(baseline.every((profile) => profile.buildPlans[0].items.length === 0));
});

test('internal Valve/GEP hero names resolve to the public Dota Flow ids', () => {
  const aliases = {
    npc_dota_hero_antimage: 'anti_mage',
    npc_dota_hero_nevermore: 'shadow_fiend',
    npc_dota_hero_furion: 'natures_prophet',
    npc_dota_hero_zuus: 'zeus',
    npc_dota_hero_windrunner: 'windranger',
    npc_dota_hero_skeleton_king: 'wraith_king',
    npc_dota_hero_obsidian_destroyer: 'outworld_destroyer',
    npc_dota_hero_abyssal_underlord: 'underlord'
  };

  for (const [input, expected] of Object.entries(aliases)) {
    assert.equal(resolveHeroId(input), expected);
    assert.equal(getHeroProfile(input).id, expected);
  }
});

test('every hero profile satisfies the engine contract', () => {
  for (const profile of listHeroProfiles()) {
    assert.ok(profile.displayName);
    assert.ok(profile.role);
    assert.ok(profile.profileTemplate);
    assert.ok(Array.isArray(profile.roles) && profile.roles.length > 0);
    assert.ok(Array.isArray(profile.archetypes) && profile.archetypes.length > 0);
    assert.ok(Array.isArray(profile.vulnerabilities));
    assert.ok(Array.isArray(profile.benchmarks) && profile.benchmarks.length >= 2);
    assert.ok(Array.isArray(profile.buildPlans) && profile.buildPlans.length >= 1);
    assert.ok(Array.isArray(profile.spikes) && profile.spikes.length >= 1);
    for (const dimension of REQUIRED_DIMENSIONS) {
      assert.equal(typeof profile.basePower[dimension], 'number', `${profile.id}.${dimension}`);
    }
  }
});

test('all 127 heroes can run through the macro engine without falling back to Luna', () => {
  for (const profile of listHeroProfiles()) {
    const state = createInitialGameState({
      phase: 'playing',
      gameTimeSec: 15 * 60,
      hero: profile.id,
      level: 12,
      gpm: 450,
      targetItem: null,
      buildPlanId: profile.buildPlans[0].id
    });
    const decision = evaluateMacroDecision(state);
    assert.equal(decision.powerState.hero, profile.id);
    assert.equal(decision.profile.calibrationTier, profile.calibrationTier);
    assert.ok(decision.confidence >= 0.25 && decision.confidence <= 0.98);
  }
});

test('baseline heroes do not invent an item target before live calibration', () => {
  const largo = getHeroProfile('largo');
  assert.equal(largo.calibrationTier, HERO_PROFILE_TIERS.BASELINE);
  assert.equal(defaultTargetItem('largo', [], largo.buildPlans[0].id), null);

  const luna = getHeroProfile('luna');
  assert.equal(luna.calibrationTier, HERO_PROFILE_TIERS.DETAILED);
  assert.equal(defaultTargetItem('luna', [], luna.buildPlans[0].id)?.id, 'item_mask_of_madness');
});

test('state normalization accepts internal hero ids and stores canonical ids', () => {
  const previous = createInitialGameState({ hero: 'luna' });
  const result = normalizeGameState(previous, {
    ...previous,
    hero: 'npc_dota_hero_nevermore'
  }, { eventType: 'PLAYER_SNAPSHOT' });

  assert.equal(result.hero, 'shadow_fiend');
  assert.equal(result.diagnostics.warnings.length, 0);
});


test('starting a baseline hero match keeps the item target empty instead of inheriting Luna data', () => {
  const state = applyGameEvent(createInitialGameState(), {
    type: GAME_EVENT_TYPES.MATCH_STARTED,
    gameTimeSec: 0,
    payload: { hero: 'npc_dota_hero_largo', buildPlanId: 'baseline_manual' }
  });

  assert.equal(state.hero, 'largo');
  assert.equal(state.targetItem, null);
  assert.equal(state.buildPlanId, 'baseline_manual');
});


test('unknown draft hero ids do not inherit Luna tags', () => {
  assert.deepEqual(getHeroTags('npc_dota_hero_future_unknown'), []);
});
