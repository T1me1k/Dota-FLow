import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';

const IDS = ['riki','rubick','skywrath_mage','snapfire','techies','venomancer','silencer','witch_doctor'];

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

test('utility support remediation replaces generated variants with explicit semantics', () => {
  const fingerprints = new Set();
  for (const id of IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.41-utility-support-v2');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 4));
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));
    const value = fingerprint(profile);
    assert.ok(!fingerprints.has(value), `semantic duplicate in utility support pack: ${id}`);
    fingerprints.add(value);
  }
});

test('utility supports preserve distinct burst, denial, global and channel identities', () => {
  const riki = getHeroProfile('riki');
  const rubick = getHeroProfile('rubick');
  const sky = getHeroProfile('skywrath_mage');
  const snap = getHeroProfile('snapfire');
  const techies = getHeroProfile('techies');
  const veno = getHeroProfile('venomancer');
  const silencer = getHeroProfile('silencer');
  const witchDoctor = getHeroProfile('witch_doctor');

  assert.ok(riki.basePower.mobility > veno.basePower.mobility);
  assert.ok(rubick.stageCurves.late.fight > sky.stageCurves.late.fight);
  assert.ok(sky.basePower.fight > riki.basePower.fight);
  assert.ok(snap.basePower.objective > rubick.basePower.objective);
  assert.ok(techies.basePower.objective > sky.basePower.objective);
  assert.ok(veno.basePower.objective > silencer.basePower.objective);
  assert.ok(witchDoctor.basePower.fight > snap.basePower.fight);

  assert.ok(riki.buildPlans.find((plan) => plan.id === 'riki_diffusal_pickoff').items.some((item) => item.id === 'item_diffusal_blade'));
  assert.deepEqual(
    rubick.buildPlans.find((plan) => plan.id === 'rubick_cast_range_control').items.slice(1, 3).map((item) => item.id),
    ['item_aether_lens','item_blink']
  );
  assert.ok(sky.buildPlans.find((plan) => plan.id === 'skywrath_mage_atos_burst').items.some((item) => item.id === 'item_rod_of_atos'));
  assert.ok(snap.buildPlans.find((plan) => plan.id === 'snapfire_solar_artillery').items.some((item) => item.id === 'item_solar_crest'));
  assert.ok(veno.buildPlans.find((plan) => plan.id === 'venomancer_objective').items.some((item) => item.id === 'item_shivas_guard'));
  assert.ok(silencer.buildPlans.find((plan) => plan.id === 'silencer_global_counter').items.some((item) => item.id === 'item_refresher'));
  assert.deepEqual(
    witchDoctor.buildPlans.find((plan) => plan.id === 'witch_doctor_glimmer_channel').items.slice(1, 4).map((item) => item.id),
    ['item_glimmer_cape','item_aether_lens','item_ultimate_scepter']
  );

  assert.ok(silencer.spikes.find((spike) => spike.id === 'silencer_refresher').requires.some((entry) => entry.type === 'min_mana_pct' && entry.value === 0.75));
  assert.ok(witchDoctor.spikes.find((spike) => spike.id === 'witch_doctor_glimmer_scepter').actions.FIGHT > snap.spikes.find((spike) => spike.id === 'snapfire_scepter').actions.FIGHT);
  assert.ok(techies.profileConfidence < veno.profileConfidence);
  assert.match(techies.calibrationSource, /geometry are not available/i);
});
