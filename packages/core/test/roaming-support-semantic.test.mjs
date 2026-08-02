import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';

const IDS = ['bounty_hunter','clockwerk','earth_spirit','earthshaker','hoodwink','mirana','nyx_assassin','pudge','spirit_breaker','tusk'];

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

test('roaming support remediation replaces generated variants with explicit semantics', () => {
  const fingerprints = new Set();
  for (const id of IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.41-roaming-support-v2');
    assert.equal(profile.role, 'support');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 4));
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));
    assert.ok(profile.spikes[0].requires.some((entry) => entry.type === 'ultimate_ready'));
    const value = fingerprint(profile);
    assert.ok(!fingerprints.has(value), `semantic duplicate in roaming support pack: ${id}`);
    fingerprints.add(value);
  }
});

test('roaming supports preserve distinct pickoff, save and map identities', () => {
  const bounty = getHeroProfile('bounty_hunter');
  const clock = getHeroProfile('clockwerk');
  const earthSpirit = getHeroProfile('earth_spirit');
  const shaker = getHeroProfile('earthshaker');
  const hoodwink = getHeroProfile('hoodwink');
  const mirana = getHeroProfile('mirana');
  const nyx = getHeroProfile('nyx_assassin');
  const pudge = getHeroProfile('pudge');
  const breaker = getHeroProfile('spirit_breaker');
  const tusk = getHeroProfile('tusk');

  assert.ok(breaker.basePower.mobility > earthSpirit.basePower.mobility);
  assert.ok(earthSpirit.basePower.mobility > bounty.basePower.mobility);
  assert.ok(shaker.basePower.fight > bounty.basePower.fight);
  assert.ok(clock.basePower.initiation > mirana.basePower.initiation);
  assert.ok(pudge.basePower.survival > hoodwink.basePower.survival);
  assert.ok(hoodwink.basePower.push > nyx.basePower.push);
  assert.ok(tusk.basePower.initiation > mirana.basePower.initiation);

  assert.deepEqual(
    bounty.buildPlans.find((plan) => plan.id === 'bounty_hunter_track_economy').items.slice(2, 4).map((item) => item.id),
    ['item_spirit_vessel','item_solar_crest']
  );
  assert.ok(clock.buildPlans.find((plan) => plan.id === 'clockwerk_hook_isolation').items.some((item) => item.id === 'item_blade_mail'));
  assert.deepEqual(
    shaker.buildPlans.find((plan) => plan.id === 'earthshaker_blink_echo').items.slice(0, 2).map((item) => item.id),
    ['item_arcane_boots','item_blink']
  );
  assert.ok(hoodwink.buildPlans.find((plan) => plan.id === 'hoodwink_atos_pickoff').items.some((item) => item.id === 'item_rod_of_atos'));
  assert.ok(mirana.buildPlans.find((plan) => plan.id === 'mirana_objective').items.some((item) => item.id === 'item_guardian_greaves'));
  assert.ok(nyx.buildPlans.find((plan) => plan.id === 'nyx_assassin_vendetta_pickoff').items.some((item) => item.id === 'item_dagon'));
  assert.ok(pudge.buildPlans.find((plan) => plan.id === 'pudge_hook_dismember').items.some((item) => item.id === 'item_aether_lens'));
  assert.deepEqual(
    breaker.buildPlans.find((plan) => plan.id === 'spirit_breaker_global_charge').items.slice(2, 4).map((item) => item.id),
    ['item_invis_sword','item_black_king_bar']
  );
  assert.ok(tusk.buildPlans.find((plan) => plan.id === 'tusk_save_initiation').items.some((item) => item.id === 'item_solar_crest'));

  assert.ok(mirana.spikes.find((spike) => spike.id === 'mirana_level_6').actions.CONNECT > mirana.spikes.find((spike) => spike.id === 'mirana_level_6').actions.FIGHT);
  assert.ok(shaker.spikes.find((spike) => spike.id === 'earthshaker_blink').actions.FIGHT > bounty.spikes.find((spike) => spike.id === 'bounty_hunter_level_6').actions.FIGHT);
  assert.ok(earthSpirit.profileConfidence < clock.profileConfidence);
  assert.match(earthSpirit.calibrationSource, /Stone Remnant stock is not available/i);
  assert.ok(hoodwink.profileConfidence < mirana.profileConfidence);
});
