import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';

const IDS = [
  'chen',
  'dark_willow',
  'enchantress',
  'grimstroke',
  'keeper_of_the_light',
  'ringmaster',
  'shadow_demon'
];

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

test('macro support A remediation replaces generated variants with explicit semantics', () => {
  const fingerprints = new Set();
  for (const id of IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.41-macro-support-a-v2');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 4));
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));
    const value = fingerprint(profile);
    assert.ok(!fingerprints.has(value), `semantic duplicate in macro support A pack: ${id}`);
    fingerprints.add(value);
  }
});

test('macro supports preserve distinct army, combo, wave, save and purge identities', () => {
  const chen = getHeroProfile('chen');
  const willow = getHeroProfile('dark_willow');
  const enchantress = getHeroProfile('enchantress');
  const grimstroke = getHeroProfile('grimstroke');
  const kotl = getHeroProfile('keeper_of_the_light');
  const ringmaster = getHeroProfile('ringmaster');
  const shadowDemon = getHeroProfile('shadow_demon');

  assert.ok(chen.basePower.objective > enchantress.basePower.objective);
  assert.ok(chen.basePower.push > kotl.basePower.push);
  assert.ok(enchantress.basePower.survival > chen.basePower.survival);
  assert.ok(willow.basePower.fight > kotl.basePower.fight);
  assert.ok(grimstroke.basePower.fight > ringmaster.basePower.fight);
  assert.ok(kotl.basePower.mobility > ringmaster.basePower.mobility);
  assert.ok(shadowDemon.basePower.initiation > enchantress.basePower.initiation);
  assert.ok(ringmaster.profileConfidence < chen.profileConfidence);

  const chenObjective = chen.buildPlans.find((plan) => plan.id === 'chen_aura_objective');
  assert.deepEqual(
    chenObjective.items.slice(1).map((item) => item.id),
    ['item_mekansm', 'item_vladmir', 'item_guardian_greaves']
  );

  assert.equal(
    willow.buildPlans.find((plan) => plan.id === 'dark_willow_euls_control').items[1].id,
    'item_cyclone'
  );

  assert.ok(
    enchantress.buildPlans.find((plan) => plan.id === 'enchantress_lane_scaling')
      .items.some((item) => item.id === 'item_hurricane_pike')
  );

  assert.ok(
    grimstroke.buildPlans.find((plan) => plan.id === 'grimstroke_combo_range')
      .scenarioTags.includes('team_has_single_target_spells')
  );

  assert.ok(
    kotl.buildPlans.find((plan) => plan.id === 'keeper_of_the_light_wave_mobility')
      .items.some((item) => item.id === 'item_octarine_core')
  );

  assert.ok(
    ringmaster.buildPlans.find((plan) => plan.id === 'ringmaster_control_response')
      .items.some((item) => item.id === 'item_lotus_orb')
  );
  assert.match(ringmaster.calibrationSource, /ability-specific telemetry unavailable/i);

  assert.ok(
    shadowDemon.buildPlans.find((plan) => plan.id === 'shadow_demon_objective')
      .items.some((item) => item.id === 'item_refresher')
  );

  const chenMek = chen.spikes.find((spike) => spike.id === 'chen_mekansm');
  assert.ok(chenMek.actions.OBJECTIVE > chenMek.actions.FIGHT);

  assert.ok(
    willow.spikes.find((spike) => spike.id === 'dark_willow_level_6')
      .requires.some((entry) => entry.type === 'ultimate_ready')
  );

  assert.ok(
    enchantress.spikes.find((spike) => spike.id === 'enchantress_level_3')
      .actions.PRESSURE > 0
  );

  assert.ok(
    grimstroke.spikes.find((spike) => spike.id === 'grimstroke_level_6')
      .requires.some((entry) => entry.type === 'ultimate_ready')
  );

  const kotlLevelSix = kotl.spikes.find((spike) => spike.id === 'keeper_of_the_light_level_6');
  assert.ok(kotlLevelSix.actions.CONNECT > kotlLevelSix.actions.OBJECTIVE);

  assert.ok(
    ringmaster.spikes.find((spike) => spike.id === 'ringmaster_level_6')
      .requires.some((entry) => entry.type === 'ultimate_ready')
  );

  assert.ok(
    shadowDemon.spikes.find((spike) => spike.id === 'shadow_demon_scepter_refresher')
      .requires.some((entry) => entry.type === 'min_mana_pct' && entry.value === 0.78)
  );
});
