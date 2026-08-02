import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';
import { listDetailedProfilePacks } from '../src/hero-profile-registry.mjs';

const HERO_IDS = ['drow_ranger','lifestealer','wraith_king','chaos_knight','gyrocopter','bloodseeker'];
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

test('second legacy carry remediation pack replaces runtime padding with explicit semantics', () => {
  const pack = listDetailedProfilePacks().find((entry) => entry.id === 'legacy-carry-remediation-2');
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
    assert.ok(!fingerprints.has(fingerprint), `semantic duplicate in second legacy carry remediation: ${id}`);
    fingerprints.add(fingerprint);
  }
});

test('second legacy carry profiles preserve distinct positioning, durability and tempo identities', () => {
  const drow = getHeroProfile('drow_ranger');
  const lifestealer = getHeroProfile('lifestealer');
  const wraithKing = getHeroProfile('wraith_king');
  const chaosKnight = getHeroProfile('chaos_knight');
  const gyro = getHeroProfile('gyrocopter');
  const bloodseeker = getHeroProfile('bloodseeker');

  assert.ok(drow.basePower.push > lifestealer.basePower.push);
  assert.ok(drow.basePower.survival < wraithKing.basePower.survival);
  assert.ok(lifestealer.basePower.survival > gyro.basePower.survival);
  assert.ok(wraithKing.basePower.survival > chaosKnight.basePower.survival);
  assert.ok(chaosKnight.basePower.fight > drow.basePower.fight);
  assert.ok(gyro.basePower.farm > chaosKnight.basePower.farm);
  assert.ok(bloodseeker.basePower.mobility > lifestealer.basePower.mobility);
  assert.ok(lifestealer.basePower.objective > drow.basePower.objective);
  assert.ok(chaosKnight.basePower.initiation > gyro.basePower.initiation);

  assert.ok(drow.buildPlans.find((plan) => plan.id === 'drow_ranger_control_response').items.some((item) => item.id === 'item_black_king_bar'));
  assert.deepEqual(drow.buildPlans.find((plan) => plan.id === 'drow_ranger_objective').items.slice(0, 2).map((item) => item.id), ['item_dragon_lance','item_hurricane_pike']);
  assert.ok(lifestealer.buildPlans.find((plan) => plan.id === 'lifestealer_objective').items.some((item) => item.id === 'item_desolator'));
  assert.deepEqual(wraithKing.buildPlans.find((plan) => plan.id === 'wraith_king_control_response').items.slice(1, 3).map((item) => item.id), ['item_blink','item_black_king_bar']);
  assert.ok(chaosKnight.buildPlans.find((plan) => plan.id === 'chaos_knight_objective').items.some((item) => item.id === 'item_assault'));
  assert.deepEqual(gyro.buildPlans.find((plan) => plan.id === 'gyrocopter_balanced').items.slice(1, 3).map((item) => item.id), ['item_ultimate_scepter','item_black_king_bar']);
  assert.ok(bloodseeker.buildPlans.find((plan) => plan.id === 'bloodseeker_objective').items.some((item) => item.id === 'item_abyssal_blade'));

  assert.ok(drow.spikes.find((spike) => spike.id === 'drow_ranger_pike_bkb').actions.FIGHT >= 25);
  assert.ok(lifestealer.spikes.find((spike) => spike.id === 'lifestealer_desolator').actions.OBJECTIVE > lifestealer.spikes.find((spike) => spike.id === 'lifestealer_desolator').actions.FIGHT);
  assert.ok(wraithKing.spikes.find((spike) => spike.id === 'wraith_king_level_6').requires.some((requirement) => requirement.type === 'min_mana_pct'));
  assert.ok(chaosKnight.spikes.find((spike) => spike.id === 'chaos_knight_heart').permanent.survival > chaosKnight.spikes.find((spike) => spike.id === 'chaos_knight_heart').permanent.fight);
  assert.ok(gyro.spikes.find((spike) => spike.id === 'gyrocopter_bkb').actions.FIGHT > bloodseeker.spikes.find((spike) => spike.id === 'bloodseeker_maelstrom').actions.FIGHT);
  assert.ok(bloodseeker.spikes.find((spike) => spike.id === 'bloodseeker_level_6').requires.some((requirement) => requirement.type === 'ultimate_ready'));

  assert.ok(drow.profileConfidence < lifestealer.profileConfidence);
  assert.ok(drow.telemetryLimitations.includes('enemy_gap_close_cooldowns_not_available'));
  assert.ok(lifestealer.telemetryLimitations.includes('infest_host_position_not_available'));
  assert.ok(wraithKing.telemetryLimitations.includes('reincarnation_mana_exactness_not_available'));
  assert.ok(chaosKnight.telemetryLimitations.includes('surviving_illusion_count_not_available'));
  assert.ok(gyro.telemetryLimitations.includes('flak_target_count_not_available'));
  assert.ok(bloodseeker.telemetryLimitations.includes('enemy_low_health_locations_not_available'));
});
