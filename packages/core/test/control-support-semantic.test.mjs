import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';

const IDS = [
  'ancient_apparition',
  'bane',
  'crystal_maiden',
  'disruptor',
  'jakiro',
  'lich',
  'lion',
  'shadow_shaman'
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

test('control support remediation replaces generated variants with explicit semantics', () => {
  const fingerprints = new Set();
  for (const id of IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.41-control-support-v2');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 4));
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));
    const value = fingerprint(profile);
    assert.ok(!fingerprints.has(value), `semantic duplicate in control support pack: ${id}`);
    fingerprints.add(value);
  }
});

test('control supports preserve distinct global, channel, zone, burst and siege identities', () => {
  const aa = getHeroProfile('ancient_apparition');
  const bane = getHeroProfile('bane');
  const cm = getHeroProfile('crystal_maiden');
  const disruptor = getHeroProfile('disruptor');
  const jakiro = getHeroProfile('jakiro');
  const lich = getHeroProfile('lich');
  const lion = getHeroProfile('lion');
  const shaman = getHeroProfile('shadow_shaman');

  assert.ok(disruptor.basePower.fight > cm.basePower.fight);
  assert.ok(lion.basePower.initiation > bane.basePower.initiation);
  assert.ok(jakiro.basePower.objective > lich.basePower.objective);
  assert.ok(shaman.basePower.objective > jakiro.basePower.objective);
  assert.ok(cm.basePower.survival < lich.basePower.survival);
  assert.ok(aa.stageCurves.late.fight > bane.stageCurves.late.fight);

  assert.ok(
    aa.buildPlans.find((plan) => plan.id === 'ancient_apparition_global_anti_heal')
      .scenarioTags.includes('enemy_healing_high')
  );
  assert.equal(
    bane.buildPlans.find((plan) => plan.id === 'bane_blink_pickoff').items[1].id,
    'item_blink'
  );
  assert.ok(
    cm.buildPlans.find((plan) => plan.id === 'crystal_maiden_glimmer_channel')
      .items.some((item) => item.id === 'item_black_king_bar')
  );
  assert.ok(
    disruptor.buildPlans.find((plan) => plan.id === 'disruptor_objective')
      .items.some((item) => item.id === 'item_refresher')
  );
  assert.ok(
    jakiro.buildPlans.find((plan) => plan.id === 'jakiro_objective')
      .items.some((item) => item.id === 'item_shivas_guard')
  );
  assert.ok(
    lich.buildPlans.find((plan) => plan.id === 'lich_shield_teamfight')
      .items.some((item) => item.id === 'item_glimmer_cape')
  );
  assert.equal(
    lion.buildPlans.find((plan) => plan.id === 'lion_blink_hex').items[1].id,
    'item_blink'
  );
  assert.ok(
    shaman.buildPlans.find((plan) => plan.id === 'shadow_shaman_objective')
      .items.some((item) => item.id === 'item_refresher')
  );

  assert.ok(
    aa.spikes.find((spike) => spike.id === 'ancient_apparition_level_6')
      .requires.some((entry) => entry.type === 'ultimate_ready')
  );
  assert.ok(
    bane.spikes.find((spike) => spike.id === 'bane_blink_bkb')
      .requires.some((entry) => entry.type === 'ultimate_ready')
  );
  assert.ok(
    cm.spikes.find((spike) => spike.id === 'crystal_maiden_blink_bkb')
      .requires.some((entry) => entry.type === 'ultimate_ready')
  );
  assert.ok(
    disruptor.spikes.find((spike) => spike.id === 'disruptor_scepter_refresher')
      .requires.some((entry) => entry.type === 'min_mana_pct' && entry.value === 0.78)
  );
  const shamanLevelSix = shaman.spikes.find((spike) => spike.id === 'shadow_shaman_level_6');
  assert.ok(shamanLevelSix.actions.OBJECTIVE > shamanLevelSix.actions.FIGHT);
});
