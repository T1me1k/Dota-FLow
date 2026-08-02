import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';

const IDS = [
  'elder_titan',
  'largo',
  'ogre_magi',
  'undying',
  'warlock',
  'winter_wyvern'
];

function fingerprint(profile) {
  return JSON.stringify({
    basePower: profile.basePower,
    stageCurves: profile.stageCurves,
    plans: profile.buildPlans.map((plan) => ({
      tags: [...plan.scenarioTags].sort(),
      items: plan.items.map((item) => item.id),
      optional: plan.optionalItems.map((item) => item.id),
      requiredSignals: [...plan.requiredSignals].sort()
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

test('final support remediation replaces every remaining generated variant with explicit semantics', () => {
  const fingerprints = new Set();
  for (const id of IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.41-macro-support-b-v2');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.doesNotMatch(profile.playstyleIdentity, /using only repository role signals/i);
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 4));
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));

    const value = fingerprint(profile);
    assert.ok(!fingerprints.has(value), `semantic duplicate in final support pack: ${id}`);
    fingerprints.add(value);
  }
});

test('final supports preserve distinct setup, buff, lane, zone, ultimate and save identities', () => {
  const elderTitan = getHeroProfile('elder_titan');
  const largo = getHeroProfile('largo');
  const ogre = getHeroProfile('ogre_magi');
  const undying = getHeroProfile('undying');
  const warlock = getHeroProfile('warlock');
  const wyvern = getHeroProfile('winter_wyvern');

  assert.ok(elderTitan.basePower.initiation > ogre.basePower.initiation);
  assert.ok(largo.basePower.mobility > warlock.basePower.mobility);
  assert.ok(ogre.basePower.survival > wyvern.basePower.survival);
  assert.ok(warlock.basePower.objective > wyvern.basePower.objective);
  assert.ok(wyvern.basePower.initiation > largo.basePower.initiation);
  assert.ok(undying.stageCurves.early.fight > warlock.stageCurves.early.fight);
  assert.ok(warlock.stageCurves.late.fight > undying.stageCurves.late.fight);

  assert.equal(largo.profileConfidence, 0.62);
  assert.ok(largo.telemetryLimitations.includes('ally_buff_target_not_available'));
  assert.equal(wyvern.profileConfidence, 0.68);
  assert.ok(wyvern.telemetryLimitations.includes('enemy_cluster_geometry_not_available'));

  const elderTitanItems = elderTitan.buildPlans.flatMap((plan) => plan.items.map((item) => item.id));
  assert.ok(!elderTitanItems.includes('item_echo_sabre'));
  assert.ok(elderTitan.buildPlans.find((plan) => plan.id === 'elder_titan_spirit_setup')
    .items.some((item) => item.id === 'item_ultimate_scepter'));

  const ogreItems = ogre.buildPlans.flatMap((plan) => plan.items.map((item) => item.id));
  assert.ok(!ogreItems.includes('item_hand_of_midas'));
  assert.ok(ogre.buildPlans.find((plan) => plan.id === 'ogre_magi_bloodlust_utility')
    .items.some((item) => item.id === 'item_solar_crest'));

  assert.ok(undying.buildPlans.find((plan) => plan.id === 'undying_tombstone_greaves')
    .items.some((item) => item.id === 'item_guardian_greaves'));
  assert.ok(warlock.buildPlans.find((plan) => plan.id === 'warlock_golem_teamfight')
    .items.some((item) => item.id === 'item_refresher'));
  assert.equal(wyvern.buildPlans.find((plan) => plan.id === 'winter_wyvern_objective').items[2].id, 'item_blink');

  assert.ok(elderTitan.spikes.find((spike) => spike.id === 'elder_titan_scepter_bkb')
    .requires.some((entry) => entry.type === 'ultimate_ready'));
  assert.ok(largo.spikes.find((spike) => spike.id === 'largo_drums_greaves').actions.OBJECTIVE
    > largo.spikes.find((spike) => spike.id === 'largo_drums_greaves').actions.FIGHT);
  assert.ok(ogre.spikes.find((spike) => spike.id === 'ogre_magi_solar_crest').actions.OBJECTIVE
    > ogre.spikes.find((spike) => spike.id === 'ogre_magi_solar_crest').actions.FIGHT);
  assert.ok(undying.spikes.find((spike) => spike.id === 'undying_level_6')
    .requires.some((entry) => entry.type === 'ultimate_ready'));
  assert.ok(warlock.spikes.find((spike) => spike.id === 'warlock_scepter_refresher')
    .requires.some((entry) => entry.type === 'min_mana_pct' && entry.value === 0.72));
  assert.ok(wyvern.spikes.find((spike) => spike.id === 'winter_wyvern_blink_refresher')
    .requires.some((entry) => entry.type === 'ultimate_ready'));
});
