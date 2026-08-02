import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';
import { listDetailedProfilePacks } from '../src/hero-profile-registry.mjs';

const HERO_IDS = ['anti_mage','faceless_void','medusa','phantom_assassin','luna','ursa'];
const SUPPORTED_REQUIREMENTS = new Set(['ultimate_ready','min_health_pct','min_mana_pct']);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function semanticFingerprint(profile) {
  return JSON.stringify(stable({
    archetypes: [...profile.archetypes].sort(),
    vulnerabilities: [...profile.vulnerabilities].sort(),
    basePower: profile.basePower,
    stageCurves: profile.stageCurves,
    benchmarks: profile.benchmarks,
    plans: profile.buildPlans.map((plan) => ({
      scenarioTags: [...plan.scenarioTags].sort(),
      priority: plan.priority,
      items: plan.items.map((item) => item.id),
      optional: plan.optionalItems.map((item) => item.id),
      situational: plan.situationalItems.map((item) => item.id),
      reasons: [...plan.reasons].sort(),
      requiredSignals: [...plan.requiredSignals].sort()
    })),
    spikes: profile.spikes.map((spike) => ({
      trigger: spike.trigger,
      expectedMinute: spike.expectedMinute,
      permanent: spike.permanent,
      window: spike.window,
      actions: spike.actions,
      requires: spike.requires
    }))
  }));
}

test('legacy carry remediation pack replaces runtime padding with explicit semantics', () => {
  const pack = listDetailedProfilePacks().find((entry) => entry.id === 'legacy-carry-remediation-1');
  assert.deepEqual(pack?.heroIds, HERO_IDS);

  const fingerprints = new Set();
  for (const id of HERO_IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationTier, 'DETAILED');
    assert.equal(profile.patchVersion, '7.41-review-required');
    assert.ok(profile.playstyleIdentity.length > 40);
    assert.ok(profile.benchmarkContract);
    assert.equal(profile.buildPlans.length, 4);
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.id.startsWith(`${id}_`)));
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 3 && plan.scenarioTags.length > 0));
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`)));
    assert.ok(profile.spikes.every((spike) => spike.recommendation && Number.isFinite(spike.expectedMinute)));
    assert.ok(profile.spikes.flatMap((spike) => spike.requires ?? []).every((requirement) => SUPPORTED_REQUIREMENTS.has(requirement.type)));
    assert.ok(profile.buildPlans.every((plan) => !/^(Recovery progression|Objective conversion|Baseline.*)$/i.test(plan.name)));
    assert.ok(profile.spikes.every((spike) => !/^(Late role breakpoint|Baseline.*)$/i.test(spike.name)));
    assert.ok(profile.buildPlans.every((plan) => !plan.generic));
    assert.ok(profile.spikes.every((spike) => !spike.generic));

    const fingerprint = semanticFingerprint(profile);
    assert.ok(!fingerprints.has(fingerprint), `semantic duplicate in legacy carry remediation: ${id}`);
    fingerprints.add(fingerprint);
  }
});

test('legacy carry profiles preserve distinct economy, fight and objective identities', () => {
  const antiMage = getHeroProfile('anti_mage');
  const voidProfile = getHeroProfile('faceless_void');
  const medusa = getHeroProfile('medusa');
  const pa = getHeroProfile('phantom_assassin');
  const luna = getHeroProfile('luna');
  const ursa = getHeroProfile('ursa');

  assert.ok(antiMage.basePower.mobility > medusa.basePower.mobility);
  assert.ok(antiMage.basePower.farm > ursa.basePower.farm);
  assert.ok(voidProfile.basePower.initiation > luna.basePower.initiation);
  assert.ok(voidProfile.basePower.fight > antiMage.basePower.fight);
  assert.ok(medusa.basePower.survival > pa.basePower.survival);
  assert.ok(pa.basePower.initiation > luna.basePower.initiation);
  assert.ok(luna.basePower.push > voidProfile.basePower.push);
  assert.ok(ursa.basePower.objective > antiMage.basePower.objective);
  assert.ok(ursa.basePower.objective > medusa.basePower.objective);

  assert.deepEqual(antiMage.buildPlans.find((plan) => plan.id === 'anti_mage_control_response').items.slice(0, 3).map((item) => item.id), ['item_bfury','item_manta','item_black_king_bar']);
  assert.ok(voidProfile.buildPlans.find((plan) => plan.id === 'faceless_void_control_response').items.some((item) => item.id === 'item_black_king_bar'));
  assert.deepEqual(medusa.buildPlans.find((plan) => plan.id === 'medusa_objective').items.slice(0, 2).map((item) => item.id), ['item_manta','item_skadi']);
  assert.equal(pa.buildPlans.find((plan) => plan.id === 'phantom_assassin_control_response').items.findIndex((item) => item.id === 'item_black_king_bar'), 1);
  assert.ok(luna.buildPlans.find((plan) => plan.id === 'luna_objective').items.some((item) => item.id === 'item_manta'));
  assert.ok(ursa.buildPlans.find((plan) => plan.id === 'ursa_objective').items.some((item) => item.id === 'item_basher'));

  assert.equal(luna.spikes.find((spike) => spike.id === 'luna_manta').actions.PRESSURE, 23);
  assert.ok(ursa.spikes.find((spike) => spike.id === 'ursa_blink').actions.OBJECTIVE >= 18);
  assert.ok(voidProfile.spikes.find((spike) => spike.id === 'faceless_void_chrono_1').requires.some((requirement) => requirement.type === 'ultimate_ready'));
  assert.ok(medusa.spikes.find((spike) => spike.id === 'medusa_manta').requires.some((requirement) => requirement.type === 'min_mana_pct'));
  assert.ok(pa.spikes.find((spike) => spike.id === 'phantom_assassin_bkb_combo').actions.FIGHT > voidProfile.spikes.find((spike) => spike.id === 'faceless_void_maelstrom').actions.FIGHT);

  assert.ok(voidProfile.profileConfidence < antiMage.profileConfidence);
  assert.ok(voidProfile.telemetryLimitations.includes('chronosphere_geometry_not_available'));
  assert.ok(ursa.telemetryLimitations.includes('fury_swipes_stacks_not_available'));
});
