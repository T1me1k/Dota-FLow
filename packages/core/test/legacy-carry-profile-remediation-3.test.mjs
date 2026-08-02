import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';
import { listDetailedProfilePacks } from '../src/hero-profile-registry.mjs';

const HERO_IDS = ['arc_warden','morphling','naga_siren','phantom_lancer','spectre','terrorblade'];
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

test('third legacy carry remediation pack replaces runtime padding with explicit semantics', () => {
  const pack = listDetailedProfilePacks().find((entry) => entry.id === 'legacy-carry-remediation-3');
  assert.deepEqual(pack?.heroIds, HERO_IDS);

  const fingerprints = new Set();
  for (const id of HERO_IDS) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationTier, 'DETAILED');
    assert.equal(profile.patchVersion, '7.41-review-required');
    assert.ok(profile.playstyleIdentity.length > 60);
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
    assert.ok(!fingerprints.has(fingerprint), `semantic duplicate in third legacy carry remediation: ${id}`);
    fingerprints.add(fingerprint);
  }
});

test('third legacy carry profiles preserve distinct clone, attribute, illusion, global and cooldown identities', () => {
  const arc = getHeroProfile('arc_warden');
  const morph = getHeroProfile('morphling');
  const naga = getHeroProfile('naga_siren');
  const pl = getHeroProfile('phantom_lancer');
  const spectre = getHeroProfile('spectre');
  const tb = getHeroProfile('terrorblade');

  assert.ok(arc.basePower.farm > spectre.basePower.farm);
  assert.ok(arc.basePower.push > morph.basePower.push);
  assert.ok(morph.basePower.mobility > tb.basePower.mobility);
  assert.ok(morph.basePower.initiation > naga.basePower.initiation);
  assert.ok(naga.basePower.farm > pl.basePower.farm);
  assert.ok(naga.basePower.push > spectre.basePower.push);
  assert.ok(pl.basePower.mobility > naga.basePower.mobility);
  assert.ok(spectre.basePower.survival > morph.basePower.survival);
  assert.ok(tb.basePower.objective > pl.basePower.objective);
  assert.ok(tb.basePower.push > arc.basePower.push);

  assert.deepEqual(arc.buildPlans.find((plan) => plan.id === 'arc_warden_balanced').items.slice(0, 3).map((item) => item.id), ['item_hand_of_midas','item_maelstrom','item_travel_boots']);
  assert.equal(morph.buildPlans.find((plan) => plan.id === 'morphling_control_response').items.findIndex((item) => item.id === 'item_black_king_bar'), 1);
  assert.ok(naga.buildPlans.find((plan) => plan.id === 'naga_siren_objective').requiredSignals.includes('area_clear_location_known'));
  assert.equal(pl.buildPlans.find((plan) => plan.id === 'phantom_lancer_balanced').items[0].id, 'item_diffusal_blade');
  assert.ok(spectre.buildPlans.find((plan) => plan.id === 'spectre_objective').items.some((item) => item.id === 'item_abyssal_blade'));
  assert.ok(tb.buildPlans.find((plan) => plan.id === 'terrorblade_objective').items.some((item) => item.id === 'item_butterfly'));

  assert.ok(arc.spikes.find((spike) => spike.id === 'arc_warden_travel').actions.PRESSURE > spectre.spikes.find((spike) => spike.id === 'spectre_manta').actions.PRESSURE);
  assert.ok(morph.spikes.find((spike) => spike.id === 'morphling_satanic').actions.FIGHT > (arc.spikes.find((spike) => spike.id === 'arc_warden_maelstrom').actions.FIGHT ?? 0));
  assert.ok(naga.spikes.find((spike) => spike.id === 'naga_siren_manta').actions.PRESSURE > pl.spikes.find((spike) => spike.id === 'phantom_lancer_diffusal').actions.PRESSURE);
  assert.ok(spectre.spikes.find((spike) => spike.id === 'spectre_level_6').actions.CONNECT > tb.spikes.find((spike) => spike.id === 'terrorblade_level_6').actions.FIGHT);
  assert.ok(tb.spikes.find((spike) => spike.id === 'terrorblade_bkb').actions.OBJECTIVE > morph.spikes.find((spike) => spike.id === 'morphling_satanic').actions.OBJECTIVE);

  assert.ok(arc.profileConfidence < naga.profileConfidence);
  assert.ok(morph.profileConfidence < pl.profileConfidence);
  assert.ok(arc.telemetryLimitations.includes('tempest_double_state_not_available'));
  assert.ok(morph.telemetryLimitations.includes('attribute_shift_state_not_available'));
  assert.ok(tb.telemetryLimitations.includes('metamorphosis_state_not_available'));
});
