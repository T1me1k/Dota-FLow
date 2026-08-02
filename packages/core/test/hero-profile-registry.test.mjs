import test from 'node:test';
import assert from 'node:assert/strict';
import { HERO_CATALOG } from '../src/hero-catalog.mjs';
import { DETAILED_HERO_IDS, listDetailedProfilePacks } from '../src/hero-profile-registry.mjs';
import { getHeroProfile, listHeroProfiles } from '../src/hero-profiles.mjs';
import { createStrategicProfilePack } from '../src/strategic-profile-factory.mjs';

const MID_TEMPO_IDS = ['broodmother','huskar','meepo','pugna','shadow_fiend','sniper','tinker','viper'];
const FLEX_CORE_IDS = ['lone_druid','lycan','natures_prophet','visage','kez','windranger'];

function semanticFingerprint(profile) {
  return JSON.stringify({
    basePower: profile.basePower,
    stageCurves: profile.stageCurves,
    plans: profile.buildPlans.map((plan) => ({
      tags: [...plan.scenarioTags].sort(),
      items: plan.items.map((item) => item.id),
      optional: plan.optionalItems.map((item) => item.id),
      situational: plan.situationalItems.map((item) => item.id)
    })),
    spikes: profile.spikes.map((spike) => ({
      trigger: spike.trigger,
      expectedMinute: spike.expectedMinute,
      requires: spike.requires ?? [],
      permanent: spike.permanent,
      window: spike.window,
      actions: spike.actions
    }))
  });
}

test('catalog detailed IDs exactly equal registered detailed profile IDs', () => {
  const catalog = HERO_CATALOG.filter((hero) => hero.calibrationTier === 'DETAILED').map((hero) => hero.id).sort();
  const registered = listHeroProfiles().filter((hero) => hero.calibrationTier === 'DETAILED').map((hero) => hero.id).sort();
  assert.deepEqual(catalog, registered);
  assert.deepEqual(catalog, [...DETAILED_HERO_IDS].sort());
  assert.equal(new Set(registered).size, 127);
  assert.equal(registered.length, HERO_CATALOG.length);
});

test('new strategic packs satisfy detailed, scenario and spike contracts without duplicate models', () => {
  const newIds = listDetailedProfilePacks().slice(3).flatMap((pack) => pack.heroIds);
  const fingerprints = new Set();
  for (const id of newIds) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationTier, 'DETAILED');
    assert.ok(profile.playstyleIdentity);
    assert.equal(profile.buildPlans.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 3 && plan.scenarioTags.length));
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));
    const fingerprint = JSON.stringify([profile.basePower, profile.stageCurves, profile.buildPlans.map((p) => p.items.map((i) => i.id)), profile.spikes.map((s) => [s.id,s.actions])]);
    assert.ok(!fingerprints.has(fingerprint), `duplicate strategic model for ${id}`);
    fingerprints.add(fingerprint);
  }
});

test('mid tempo remediation uses hero-specific semantics instead of variant-generated differences', () => {
  const fingerprints = new Set();
  for (const id of MID_TEMPO_IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.38-mid-tempo-v2');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.ok(profile.buildPlans.every((plan) => !/Balanced role progression|Low-economy recovery|Objective conversion/.test(plan.name)));
    assert.ok(profile.spikes.every((spike) => !/Level 6 role window|Defensive utility breakpoint|Two-item strategic breakpoint/.test(spike.name)));
    const fingerprint = semanticFingerprint(profile);
    assert.ok(!fingerprints.has(fingerprint), `semantic duplicate in remediated mid pack: ${id}`);
    fingerprints.add(fingerprint);
  }
});

test('mid tempo profiles preserve explicit strategic direction', () => {
  const brood = getHeroProfile('broodmother');
  const huskar = getHeroProfile('huskar');
  const meepo = getHeroProfile('meepo');
  const pugna = getHeroProfile('pugna');
  const sf = getHeroProfile('shadow_fiend');
  const sniper = getHeroProfile('sniper');
  const tinker = getHeroProfile('tinker');
  const viper = getHeroProfile('viper');

  assert.ok(brood.basePower.push > sf.basePower.push);
  assert.ok(huskar.basePower.fight > sniper.basePower.fight);
  assert.ok(huskar.basePower.objective > sniper.basePower.objective);
  assert.ok(sniper.basePower.initiation < viper.basePower.initiation);
  assert.ok(meepo.basePower.farm > pugna.basePower.farm);
  assert.ok(pugna.basePower.push > viper.basePower.push);
  assert.ok(tinker.basePower.mobility > brood.basePower.mobility);
  assert.ok(viper.stageCurves.early.fight > sniper.stageCurves.early.fight);

  assert.deepEqual(tinker.buildPlans[0].items.slice(0, 2).map((item) => item.id), ['item_travel_boots','item_blink']);
  assert.ok(sniper.buildPlans.find((plan) => plan.id === 'sniper_control_response').items.some((item) => item.id === 'item_hurricane_pike'));
  assert.ok(huskar.buildPlans.find((plan) => plan.id === 'huskar_objective').items.some((item) => item.id === 'item_armlet'));
  assert.ok(brood.buildPlans.find((plan) => plan.id === 'broodmother_objective').items.some((item) => item.id === 'item_assault'));

  assert.ok(tinker.spikes.find((spike) => spike.id === 'tinker_level_6').requires.some((requirement) => requirement.type === 'min_mana_pct'));
  assert.ok(huskar.spikes.find((spike) => spike.id === 'huskar_armlet').requires.some((requirement) => requirement.type === 'min_health_pct'));
  assert.ok(sniper.spikes.find((spike) => spike.id === 'sniper_hurricane_pike').actions.FIGHT < huskar.spikes.find((spike) => spike.id === 'huskar_armlet').actions.FIGHT);
});

test('flex core remediation replaces generated variants with explicit 7.41-era semantics', () => {
  const fingerprints = new Set();
  for (const id of FLEX_CORE_IDS) {
    const profile = getHeroProfile(id);
    const expectedVersion = id === 'kez' ? 'prototype-7.41-kez-conservative-v2' : 'prototype-7.41-flex-core-v2';
    assert.equal(profile.calibrationVersion, expectedVersion);
    assert.equal(profile.patchVersion, '7.41-review-required');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.ok(profile.buildPlans.every((plan) => !/Balanced role progression|Low-economy recovery|Objective conversion/.test(plan.name)));
    assert.ok(profile.spikes.every((spike) => !/Level 6 role window|Defensive utility breakpoint|Two-item strategic breakpoint/.test(spike.name)));
    const fingerprint = semanticFingerprint(profile);
    assert.ok(!fingerprints.has(fingerprint), `semantic duplicate in remediated flex pack: ${id}`);
    fingerprints.add(fingerprint);
  }
});

test('flex core profiles preserve different map, objective and execution identities', () => {
  const loneDruid = getHeroProfile('lone_druid');
  const lycan = getHeroProfile('lycan');
  const prophet = getHeroProfile('natures_prophet');
  const visage = getHeroProfile('visage');
  const kez = getHeroProfile('kez');
  const windranger = getHeroProfile('windranger');

  assert.ok(loneDruid.basePower.push > windranger.basePower.push);
  assert.ok(lycan.basePower.objective > prophet.basePower.objective);
  assert.ok(prophet.basePower.mobility > visage.basePower.mobility);
  assert.ok(visage.basePower.survival > prophet.basePower.survival);
  assert.ok(windranger.basePower.initiation > loneDruid.basePower.initiation);
  assert.ok(kez.profileConfidence < windranger.profileConfidence);

  assert.ok(loneDruid.telemetryLimitations.includes('inventory_does_not_distinguish_spirit_bear'));
  assert.deepEqual(lycan.buildPlans.find((plan) => plan.id === 'lycan_balanced').items.slice(0, 2).map((item) => item.id), ['item_helm_of_the_dominator','item_black_king_bar']);
  assert.ok(prophet.buildPlans.find((plan) => plan.id === 'natures_prophet_control_response').items.some((item) => item.id === 'item_sphere'));
  assert.deepEqual(visage.buildPlans.find((plan) => plan.id === 'visage_objective').items.slice(0, 2).map((item) => item.id), ['item_solar_crest','item_assault']);
  assert.ok(windranger.buildPlans.find((plan) => plan.id === 'windranger_objective').items.some((item) => item.id === 'item_gungir'));

  assert.ok(lycan.spikes.find((spike) => spike.id === 'lycan_level_6').requires.some((requirement) => requirement.type === 'ultimate_ready'));
  assert.ok(visage.spikes.find((spike) => spike.id === 'visage_level_6').requires.some((requirement) => requirement.type === 'ultimate_ready'));
  assert.ok(prophet.spikes.find((spike) => spike.id === 'natures_prophet_level_6').requires.some((requirement) => requirement.type === 'min_mana_pct'));
  assert.match(kez.calibrationSource, /conservative|ability-specific live calibration pending/i);
  assert.ok(kez.telemetryLimitations.includes('ability_specific_state_not_available'));
});

test('strategic factory rejects unknown item keys instead of silently using Force Staff', () => {
  assert.throws(() => createStrategicProfilePack([
    { id:'invalid_profile', displayName:'Invalid Profile', role:'core', identity:'invalid', signature:'misspelled_item', variant:0 }
  ], {
    benchmark: (points) => points.map(([minute,gpm,level]) => ({ minute,gpm,level })),
    condition: (type,value) => ({ type,value })
  }), /Unknown item key/);
});

test('named strategic differences remain explicit', () => {
  const huskar=getHeroProfile('huskar'), sniper=getHeroProfile('sniper'), axe=getHeroProfile('axe'), tide=getHeroProfile('tidehunter');
  assert.ok(huskar.basePower.initiation !== sniper.basePower.initiation);
  assert.match(sniper.playstyleIdentity, /protected range|position/i);
  assert.notDeepEqual(axe.stageCurves, tide.stageCurves);
  assert.notDeepEqual(getHeroProfile('oracle').basePower, getHeroProfile('dazzle').basePower);
  assert.notDeepEqual(getHeroProfile('chen').stageCurves, getHeroProfile('enchantress').stageCurves);
});
