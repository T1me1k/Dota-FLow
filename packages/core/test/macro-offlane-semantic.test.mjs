import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';

const IDS = ['beastmaster','brewmaster','bristleback','dark_seer','doom','enigma','night_stalker','timbersaw','underlord'];

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

test('macro offlane remediation replaces generated variants with explicit semantics', () => {
  const fingerprints = new Set();
  for (const id of IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.41-macro-offlane-v2');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 4));
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));
    const value = fingerprint(profile);
    assert.ok(!fingerprints.has(value), `semantic duplicate in macro offlane pack: ${id}`);
    fingerprints.add(value);
  }
});

test('macro offlaners preserve distinct strategic direction', () => {
  const beastmaster = getHeroProfile('beastmaster');
  const brew = getHeroProfile('brewmaster');
  const bristle = getHeroProfile('bristleback');
  const darkSeer = getHeroProfile('dark_seer');
  const doom = getHeroProfile('doom');
  const enigma = getHeroProfile('enigma');
  const nightStalker = getHeroProfile('night_stalker');
  const timber = getHeroProfile('timbersaw');
  const underlord = getHeroProfile('underlord');

  assert.ok(beastmaster.basePower.objective > brew.basePower.objective);
  assert.ok(beastmaster.basePower.push > doom.basePower.push);
  assert.ok(enigma.basePower.fight > darkSeer.basePower.fight);
  assert.ok(enigma.basePower.survival < underlord.basePower.survival);
  assert.ok(bristle.basePower.survival > timber.basePower.survival);
  assert.ok(timber.basePower.mobility > bristle.basePower.mobility);
  assert.ok(doom.basePower.farm > nightStalker.basePower.farm);
  assert.ok(nightStalker.basePower.mobility > underlord.basePower.mobility);

  assert.deepEqual(
    beastmaster.buildPlans.find((plan) => plan.id === 'beastmaster_dominator_map_control').items.slice(1, 3).map((item) => item.id),
    ['item_helm_of_the_dominator','item_vladmir']
  );
  assert.ok(brew.buildPlans.find((plan) => plan.id === 'brewmaster_control_response').items.some((item) => item.id === 'item_black_king_bar'));
  assert.ok(darkSeer.buildPlans.find((plan) => plan.id === 'dark_seer_greaves_combo').items.some((item) => item.id === 'item_guardian_greaves'));
  assert.ok(doom.buildPlans.find((plan) => plan.id === 'doom_midas_doom_tempo').items.some((item) => item.id === 'item_hand_of_midas'));
  assert.deepEqual(
    enigma.buildPlans.find((plan) => plan.id === 'enigma_blink_black_hole').items.slice(1, 3).map((item) => item.id),
    ['item_blink','item_black_king_bar']
  );
  assert.ok(underlord.buildPlans.find((plan) => plan.id === 'underlord_objective').items.some((item) => item.id === 'item_crimson_guard'));

  assert.ok(beastmaster.spikes.find((spike) => spike.id === 'beastmaster_level_6').requires.some((entry) => entry.type === 'ultimate_ready'));
  assert.ok(brew.spikes.find((spike) => spike.id === 'brewmaster_refresher').requires.some((entry) => entry.type === 'min_mana_pct'));
  assert.ok(enigma.spikes.find((spike) => spike.id === 'enigma_blink_bkb').actions.FIGHT > bristle.spikes.find((spike) => spike.id === 'bristleback_bloodstone').actions.FIGHT);
  assert.ok(nightStalker.profileConfidence < underlord.profileConfidence);
  assert.match(nightStalker.calibrationSource, /day\/night telemetry is not available/i);
});
