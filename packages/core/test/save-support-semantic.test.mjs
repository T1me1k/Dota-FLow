import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';

const IDS = ['abaddon','dazzle','io','omniknight','oracle','phoenix','treant_protector','vengeful_spirit'];

function fingerprint(profile) {
  return JSON.stringify({
    basePower: profile.basePower,
    stageCurves: profile.stageCurves,
    plans: profile.buildPlans.map((plan) => ({
      tags: [...plan.scenarioTags].sort(),
      items: plan.items.map((item) => item.id),
      optional: plan.optionalItems.map((item) => item.id)
    })),
    spikes: profile.spikes.map((spike) => ({
      trigger: spike.trigger,
      requires: spike.requires,
      permanent: spike.permanent,
      window: spike.window,
      actions: spike.actions
    }))
  });
}

test('save support remediation replaces generated variants with explicit semantics', () => {
  const fingerprints = new Set();
  for (const id of IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.41-save-support-v2');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 4));
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));
    const value = fingerprint(profile);
    assert.ok(!fingerprints.has(value), `semantic duplicate in save support pack: ${id}`);
    fingerprints.add(value);
  }
});

test('save supports preserve distinct dispel, global, teamfight and reposition identities', () => {
  const abaddon = getHeroProfile('abaddon');
  const dazzle = getHeroProfile('dazzle');
  const io = getHeroProfile('io');
  const omni = getHeroProfile('omniknight');
  const oracle = getHeroProfile('oracle');
  const phoenix = getHeroProfile('phoenix');
  const treant = getHeroProfile('treant_protector');
  const venge = getHeroProfile('vengeful_spirit');

  assert.ok(abaddon.basePower.survival > oracle.basePower.survival);
  assert.ok(oracle.basePower.fight > abaddon.basePower.fight);
  assert.ok(io.basePower.mobility > dazzle.basePower.mobility);
  assert.ok(phoenix.basePower.fight > omni.basePower.fight);
  assert.ok(treant.basePower.objective > oracle.basePower.objective);
  assert.ok(venge.basePower.initiation > dazzle.basePower.initiation);

  assert.deepEqual(
    abaddon.buildPlans.find((plan) => plan.id === 'abaddon_shield_sustain').items.slice(1, 4).map((item) => item.id),
    ['item_mekansm','item_guardian_greaves','item_lotus_orb']
  );
  assert.ok(dazzle.buildPlans.find((plan) => plan.id === 'dazzle_grave_range').items.some((item) => item.id === 'item_aether_lens'));
  assert.deepEqual(
    io.buildPlans.find((plan) => plan.id === 'io_tether_sustain').items.slice(1, 3).map((item) => item.id),
    ['item_mekansm','item_guardian_greaves']
  );
  assert.ok(omni.buildPlans.find((plan) => plan.id === 'omniknight_physical_save').items.some((item) => item.id === 'item_ultimate_scepter'));
  assert.deepEqual(
    oracle.buildPlans.find((plan) => plan.id === 'oracle_promise_range').items.slice(1, 3).map((item) => item.id),
    ['item_aether_lens','item_glimmer_cape']
  );
  assert.ok(phoenix.buildPlans.find((plan) => plan.id === 'phoenix_supernova_control').items.some((item) => item.id === 'item_shivas_guard'));
  assert.ok(treant.buildPlans.find((plan) => plan.id === 'treant_protector_objective').items.some((item) => item.id === 'item_refresher'));
  assert.ok(venge.buildPlans.find((plan) => plan.id === 'vengeful_spirit_swap_utility').items.some((item) => item.id === 'item_solar_crest'));

  assert.ok(oracle.spikes.find((spike) => spike.id === 'oracle_level_6').requires.some((entry) => entry.type === 'ultimate_ready'));
  assert.ok(phoenix.spikes.find((spike) => spike.id === 'phoenix_level_6').requires.some((entry) => entry.type === 'min_health_pct'));
  assert.ok(treant.spikes.find((spike) => spike.id === 'treant_protector_scepter_refresher').actions.OBJECTIVE > dazzle.spikes.find((spike) => spike.id === 'dazzle_greaves_scepter').actions.OBJECTIVE);
  assert.ok(io.profileConfidence < dazzle.profileConfidence);
  assert.ok(phoenix.profileConfidence < omni.profileConfidence);
  assert.ok(treant.profileConfidence < venge.profileConfidence);
  assert.match(io.calibrationSource, /tether partner identity/i);
  assert.match(phoenix.calibrationSource, /attack count/i);
  assert.match(treant.calibrationSource, /tree geometry/i);
});
