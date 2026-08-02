import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';
import { createExplicitProfilePack } from '../src/explicit-profile-pack.mjs';

const HERO_IDS = ['axe','batrider','centaur_warrunner','legion_commander','magnus','mars','sand_king','slardar','tidehunter'];

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
      requires: spike.requires ?? [],
      permanent: spike.permanent,
      window: spike.window,
      actions: spike.actions
    }))
  });
}

test('frontline remediation replaces generated variants with explicit 7.41 semantics', () => {
  const fingerprints = new Set();
  for (const id of HERO_IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationVersion, 'prototype-7.41-frontline-v2');
    assert.equal(profile.patchVersion, '7.41-review-required');
    assert.doesNotMatch(profile.playstyleIdentity, /converts its distinct lane tools/i);
    assert.ok(profile.buildPlans.every((plan) => !/Balanced role progression|Low-economy recovery|Objective conversion/.test(plan.name)));
    assert.ok(profile.spikes.every((spike) => !/Level 6 role window|Defensive utility breakpoint|Two-item strategic breakpoint/.test(spike.name)));
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    const value = fingerprint(profile);
    assert.ok(!fingerprints.has(value), `semantic duplicate in frontline pack: ${id}`);
    fingerprints.add(value);
  }
});

test('frontline heroes preserve distinct initiation and objective identities', () => {
  const axe = getHeroProfile('axe');
  const bat = getHeroProfile('batrider');
  const centaur = getHeroProfile('centaur_warrunner');
  const legion = getHeroProfile('legion_commander');
  const magnus = getHeroProfile('magnus');
  const mars = getHeroProfile('mars');
  const sandKing = getHeroProfile('sand_king');
  const slardar = getHeroProfile('slardar');
  const tide = getHeroProfile('tidehunter');

  assert.ok(magnus.basePower.initiation > axe.basePower.initiation);
  assert.ok(tide.basePower.survival > sandKing.basePower.survival);
  assert.ok(slardar.basePower.objective > mars.basePower.objective);
  assert.ok(bat.basePower.mobility > legion.basePower.mobility);
  assert.ok(centaur.basePower.mobility > tide.basePower.mobility);
  assert.ok(sandKing.basePower.farm > axe.basePower.farm);

  assert.ok(axe.buildPlans.find((plan) => plan.id === 'axe_call_blade_mail').items.some((item) => item.id === 'item_blade_mail'));
  assert.deepEqual(bat.buildPlans.find((plan) => plan.id === 'batrider_travel_pickoff').items.slice(0, 2).map((item) => item.id), ['item_travel_boots','item_blink']);
  assert.equal(tide.buildPlans.find((plan) => plan.id === 'tidehunter_aura_anchor').items[1].id, 'item_pipe');
  assert.ok(slardar.buildPlans.find((plan) => plan.id === 'slardar_objective').items.some((item) => item.id === 'item_assault'));
  assert.ok(magnus.spikes.find((spike) => spike.id === 'magnus_refresher').trigger.all.some((condition) => condition.value === 'item_refresher'));

  assert.ok(legion.spikes.find((spike) => spike.id === 'legion_commander_level_6').requires.some((requirement) => requirement.type === 'ultimate_ready'));
  assert.ok(mars.spikes.find((spike) => spike.id === 'mars_blink').requires.some((requirement) => requirement.type === 'ultimate_ready'));
  assert.ok(bat.spikes.find((spike) => spike.id === 'batrider_level_6').requires.some((requirement) => requirement.type === 'min_mana_pct'));
  assert.ok(tide.spikes.find((spike) => spike.id === 'tidehunter_refresher').actions.OBJECTIVE > axe.spikes.find((spike) => spike.id === 'axe_bkb').actions.OBJECTIVE);
});

test('explicit profile normalizer fails closed on unknown item keys', () => {
  const definition = {
    id: 'invalid_explicit', displayName: 'Invalid', roles: ['Offlane'], archetypes: ['invalid'], draftTags: ['invalid'], vulnerabilities: ['invalid'], identity: 'invalid',
    basePower: { farm:1,fight:1,push:1,survival:1,initiation:1,objective:1,mobility:1 },
    stageCurves: { early:{fight:1},mid:{fight:1},late:{fight:1} }, benchmarkPoints: [[5,1,1]], benchmarkContract: {},
    plans: [{ id:'bad', name:'Bad', scenarioTags:['balanced'], priority:1, items:['misspelled_item','blink','bkb'], reasons:['balanced_draft'] }],
    spikes: []
  };
  assert.throws(() => createExplicitProfilePack([definition], {
    benchmark: (points) => points.map(([minute,gpm,level]) => ({ minute,gpm,level })),
    condition: (type,value) => ({ type,value })
  }, {
    calibrationVersion:'test', calibrationSource:'test', calibrationConfidence:0.1, patchVersion:'test', patchReviewRequired:true
  }), /Unknown item key/);
});
