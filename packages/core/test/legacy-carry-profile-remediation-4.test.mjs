import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroProfile } from '../src/hero-profiles.mjs';
import { listDetailedProfilePacks } from '../src/hero-profile-registry.mjs';

const HERO_IDS = ['alchemist','clinkz','juggernaut','monkey_king','slark','troll_warlord'];
const SUPPORTED_REQUIREMENTS = new Set(['ultimate_ready','min_health_pct','min_mana_pct']);
const LEGACY_SPIKE_IDS = new Map([
  ['alchemist', ['alchemist_radiance','alchemist_blink','alchemist_bkb']],
  ['clinkz', ['clinkz_orchid','clinkz_desolator','clinkz_bkb']],
  ['juggernaut', ['jugg_level_6','jugg_diffusal','jugg_manta']],
  ['monkey_king', ['monkey_king_echo','monkey_king_desolator','monkey_king_bkb']],
  ['slark', ['slark_diffusal','slark_aghs','slark_bkb']],
  ['troll_warlord', ['troll_warlord_battle_fury','troll_warlord_bkb','troll_warlord_basher']]
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

test('fourth legacy carry remediation pack replaces runtime padding and migrates Juggernaut from builtin', () => {
  const pack = listDetailedProfilePacks().find((entry) => entry.id === 'legacy-carry-remediation-4');
  const builtin = listDetailedProfilePacks().find((entry) => entry.id === 'builtin');
  assert.deepEqual(pack?.heroIds, HERO_IDS);
  assert.deepEqual(builtin?.heroIds, ['sven']);

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
    assert.ok(profile.spikes.every((spike) => spike.recommendation && Number.isFinite(spike.expectedMinute)));
    assert.ok(profile.spikes.flatMap((spike) => spike.requires ?? []).every((requirement) => SUPPORTED_REQUIREMENTS.has(requirement.type)));
    assert.ok(profile.buildPlans.every((plan) => !/^(Recovery progression|Objective conversion|Baseline.*)$/i.test(plan.name)));
    assert.ok(profile.spikes.every((spike) => !/^(Late role breakpoint|Baseline.*)$/i.test(spike.name)));
    assert.ok(profile.buildPlans.every((plan) => !plan.generic));
    assert.ok(profile.spikes.every((spike) => !spike.generic));
    for (const spikeId of LEGACY_SPIKE_IDS.get(id)) assert.ok(profile.spikes.some((spike) => spike.id === spikeId), `${id} lost public spike ${spikeId}`);

    const fingerprint = semanticFingerprint(profile);
    assert.ok(!fingerprints.has(fingerprint), `semantic duplicate in fourth legacy carry remediation: ${id}`);
    fingerprints.add(fingerprint);
  }
});

test('fourth legacy carry profiles preserve economy, stealth, sustain, zone, vision and target-lock identities', () => {
  const alchemist = getHeroProfile('alchemist');
  const clinkz = getHeroProfile('clinkz');
  const juggernaut = getHeroProfile('juggernaut');
  const monkey = getHeroProfile('monkey_king');
  const slark = getHeroProfile('slark');
  const troll = getHeroProfile('troll_warlord');

  assert.ok(alchemist.basePower.farm > troll.basePower.farm);
  assert.ok(clinkz.basePower.initiation > alchemist.basePower.initiation);
  assert.ok(juggernaut.basePower.survival > monkey.basePower.survival);
  assert.ok(monkey.basePower.mobility > clinkz.basePower.mobility);
  assert.ok(slark.basePower.mobility > juggernaut.basePower.mobility);
  assert.ok(troll.basePower.objective > alchemist.basePower.objective);

  assert.deepEqual(alchemist.buildPlans.find((plan) => plan.id === 'alchemist_balanced').items.slice(0, 3).map((item) => item.id), ['item_radiance','item_blink','item_black_king_bar']);
  assert.equal(clinkz.buildPlans.find((plan) => plan.id === 'clinkz_balanced').items[0].id, 'item_orchid');
  assert.ok(juggernaut.buildPlans.find((plan) => plan.id === 'juggernaut_objective').requiredSignals.includes('healing_ward_zone_protectable'));
  assert.ok(monkey.buildPlans.find((plan) => plan.id === 'monkey_king_objective').requiredSignals.includes('constrained_fight_zone_confirmed'));
  assert.ok(slark.buildPlans.find((plan) => plan.id === 'slark_objective').requiredSignals.includes('enemy_vision_removed'));
  assert.ok(troll.buildPlans.find((plan) => plan.id === 'troll_warlord_objective').items.some((item) => item.id === 'item_assault'));

  assert.ok(alchemist.spikes.find((spike) => spike.id === 'alchemist_radiance').actions.FARM > (clinkz.spikes.find((spike) => spike.id === 'clinkz_orchid').actions.FARM ?? 0));
  assert.ok(clinkz.spikes.find((spike) => spike.id === 'clinkz_orchid').actions.FIGHT > juggernaut.spikes.find((spike) => spike.id === 'jugg_manta').actions.FIGHT);
  assert.ok(juggernaut.spikes.find((spike) => spike.id === 'juggernaut_scepter').actions.OBJECTIVE > slark.spikes.find((spike) => spike.id === 'slark_bkb').actions.OBJECTIVE);
  assert.ok(monkey.spikes.find((spike) => spike.id === 'monkey_king_bkb').actions.FIGHT > clinkz.spikes.find((spike) => spike.id === 'clinkz_bkb').actions.FIGHT);
  assert.ok(troll.spikes.find((spike) => spike.id === 'troll_warlord_bkb').actions.OBJECTIVE > monkey.spikes.find((spike) => spike.id === 'monkey_king_bkb').actions.OBJECTIVE);

  assert.ok(clinkz.profileConfidence < juggernaut.profileConfidence);
  assert.ok(monkey.profileConfidence < alchemist.profileConfidence);
  assert.ok(alchemist.telemetryLimitations.includes('greevil_income_not_available'));
  assert.ok(juggernaut.telemetryLimitations.includes('healing_ward_safety_not_available'));
  assert.ok(slark.telemetryLimitations.includes('enemy_vision_state_not_available'));
  assert.ok(troll.telemetryLimitations.includes('battle_trance_target_not_available'));
});
