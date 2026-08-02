import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';
import { listDetailedProfilePacks } from '../src/hero-profile-registry.mjs';
import { LEGACY_SPIKE_ALIASES } from '../src/legacy_core_profile_pack_5.mjs';

const HERO_IDS = ['muerta','templar_assassin','weaver','sven','marci','dawnbreaker'];
const SUPPORTED_REQUIREMENTS = new Set(['ultimate_ready','min_health_pct','min_mana_pct']);
const LEGACY_SPIKE_IDS = new Map([
  ['muerta', ['muerta_level_6','muerta_maelstrom','muerta_bkb']],
  ['templar_assassin', ['templar_assassin_level_6','templar_assassin_desolator','templar_assassin_blink_bkb']],
  ['weaver', ['weaver_maelstrom','weaver_linken','weaver_bkb']],
  ['sven', ['sven_blink','sven_bkb']],
  ['marci', ['marci_level_6','marci_bkb','marci_basher']],
  ['dawnbreaker', ['dawnbreaker_level_6','dawnbreaker_desolator','dawnbreaker_bkb']]
]);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function semanticFingerprint(profile) {
  return JSON.stringify(stable({
    role: profile.role,
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

test('fifth legacy core remediation pack replaces carry and mid padding and empties builtin ownership', () => {
  const packs = listDetailedProfilePacks();
  const pack = packs.find((entry) => entry.id === 'legacy-core-remediation-5');
  const builtin = packs.find((entry) => entry.id === 'builtin');
  const carry = packs.find((entry) => entry.id === 'carry');
  const mid = packs.find((entry) => entry.id === 'mid');

  assert.deepEqual(pack?.heroIds, HERO_IDS);
  assert.deepEqual(builtin?.heroIds, []);
  for (const id of ['muerta','weaver','marci','dawnbreaker']) assert.ok(!carry?.heroIds.includes(id));
  assert.ok(!mid?.heroIds.includes('templar_assassin'));

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
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation && Number.isFinite(spike.expectedMinute)));
    assert.ok(profile.spikes.flatMap((spike) => spike.requires ?? []).every((requirement) => SUPPORTED_REQUIREMENTS.has(requirement.type)));
    assert.ok(profile.buildPlans.every((plan) => !/^(Recovery progression|Objective conversion|Baseline.*)$/i.test(plan.name)));
    assert.ok(profile.spikes.every((spike) => !/^(Late role breakpoint|Baseline.*)$/i.test(spike.name)));
    assert.ok(profile.buildPlans.every((plan) => !plan.generic));
    assert.ok(profile.spikes.every((spike) => !spike.generic));
    for (const spikeId of LEGACY_SPIKE_IDS.get(id)) {
      assert.ok(profile.spikes.some((spike) => spike.id === spikeId), `${id} lost public spike ${spikeId}`);
    }

    const fingerprint = semanticFingerprint(profile);
    assert.ok(!fingerprints.has(fingerprint), `semantic duplicate in fifth legacy core remediation: ${id}`);
    fingerprints.add(fingerprint);
  }

  const sven = getHeroProfile('sven');
  assert.equal(LEGACY_SPIKE_ALIASES.sven_gods_strength, 'sven_level_6');
  assert.equal(sven.spikeAliases.sven_gods_strength, 'sven_level_6');
  assert.ok(sven.spikes.some((spike) => spike.id === 'sven_level_6'));
  assert.equal(getHeroProfile('templar_assassin').role, 'mid');
});

test('fifth legacy core profiles preserve firing-line, trap, lapse, cleave, target-lock and global identities', () => {
  const muerta = getHeroProfile('muerta');
  const templar = getHeroProfile('templar_assassin');
  const weaver = getHeroProfile('weaver');
  const sven = getHeroProfile('sven');
  const marci = getHeroProfile('marci');
  const dawnbreaker = getHeroProfile('dawnbreaker');

  assert.ok(templar.basePower.objective > muerta.basePower.objective);
  assert.ok(weaver.basePower.mobility > dawnbreaker.basePower.mobility);
  assert.ok(sven.basePower.farm > marci.basePower.farm);
  assert.ok(marci.basePower.initiation > muerta.basePower.initiation);
  assert.ok(dawnbreaker.basePower.survival > templar.basePower.survival);
  assert.ok(muerta.stageCurves.late.fight > templar.stageCurves.late.fight);

  assert.deepEqual(muerta.buildPlans.find((plan) => plan.id === 'muerta_balanced').items.slice(0, 3).map((item) => item.id), ['item_maelstrom','item_dragon_lance','item_black_king_bar']);
  assert.ok(templar.buildPlans.find((plan) => plan.id === 'templar_assassin_objective').requiredSignals.includes('roshan_approach_trapped'));
  assert.ok(weaver.buildPlans.find((plan) => plan.id === 'weaver_recovery').avoidWhen.includes('enemy_detection_covers_all_exit_routes'));
  assert.ok(sven.buildPlans.find((plan) => plan.id === 'sven_objective').items.some((item) => item.id === 'item_assault'));
  assert.ok(marci.buildPlans.find((plan) => plan.id === 'marci_objective').requiredSignals.includes('stable_unleash_target_confirmed'));
  assert.ok(dawnbreaker.buildPlans.find((plan) => plan.id === 'dawnbreaker_objective').requiredSignals.includes('safe_global_landing_confirmed'));

  assert.ok(templar.spikes.find((spike) => spike.id === 'templar_assassin_desolator').actions.OBJECTIVE > (muerta.spikes.find((spike) => spike.id === 'muerta_maelstrom').actions.OBJECTIVE ?? 0));
  assert.ok(weaver.spikes.find((spike) => spike.id === 'weaver_level_6').actions.PRESSURE > (sven.spikes.find((spike) => spike.id === 'sven_level_6').actions.PRESSURE ?? 0));
  assert.ok(sven.spikes.find((spike) => spike.id === 'sven_bkb').actions.FIGHT > dawnbreaker.spikes.find((spike) => spike.id === 'dawnbreaker_bkb').actions.FIGHT);
  assert.ok(marci.spikes.find((spike) => spike.id === 'marci_bkb').actions.FIGHT > muerta.spikes.find((spike) => spike.id === 'muerta_bkb').actions.FIGHT);
  assert.ok(dawnbreaker.spikes.find((spike) => spike.id === 'dawnbreaker_level_6').actions.CONNECT > templar.spikes.find((spike) => spike.id === 'templar_assassin_level_6').actions.CONNECT);

  assert.ok(muerta.telemetryLimitations.includes('pierce_the_veil_state_not_available'));
  assert.ok(templar.telemetryLimitations.includes('trap_network_not_available'));
  assert.ok(weaver.telemetryLimitations.includes('enemy_detection_coverage_not_available'));
  assert.ok(sven.telemetryLimitations.includes('cleave_geometry_not_available'));
  assert.ok(marci.telemetryLimitations.includes('unleash_pulse_state_not_available'));
  assert.ok(dawnbreaker.telemetryLimitations.includes('solar_guardian_landing_not_available'));
});
