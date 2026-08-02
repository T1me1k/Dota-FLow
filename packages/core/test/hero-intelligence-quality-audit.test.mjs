import test from 'node:test';
import assert from 'node:assert/strict';
import { listHeroProfiles } from '../src/hero-profiles.mjs';

const SUPPORTED_REQUIREMENTS = new Set(['ultimate_ready', 'min_health_pct', 'min_mana_pct']);
const PLACEHOLDER_PATTERNS = [
  /converts its distinct lane tools/i,
  /low-economy team utility/i,
  /prototype teamfight support calibration/i,
  /prototype .* calibration using only repository role signals/i,
  /generic/i,
  /baseline/i
];
const SYNTHETIC_ARTIFACT_PATTERN = /late_role_breakpoint|late role breakpoint|recovery progression|objective conversion|generic|baseline/i;

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
    roles: [...(profile.roles ?? [])].sort(),
    archetypes: [...(profile.archetypes ?? [])].sort(),
    vulnerabilities: [...(profile.vulnerabilities ?? [])].sort(),
    basePower: profile.basePower,
    stageCurves: profile.stageCurves,
    benchmarks: profile.benchmarks,
    plans: (profile.buildPlans ?? []).map((plan) => ({
      role: plan.role,
      scenarioTags: [...(plan.scenarioTags ?? [])].sort(),
      priority: plan.priority,
      items: (plan.items ?? plan.coreItems ?? []).map((item) => item.id),
      optionalItems: (plan.optionalItems ?? []).map((item) => item.id),
      situationalItems: (plan.situationalItems ?? []).map((item) => item.id),
      avoidWhen: [...(plan.avoidWhen ?? [])].sort(),
      requiredSignals: [...(plan.requiredSignals ?? [])].sort(),
      reasons: plan.reasons
    })),
    spikes: (profile.spikes ?? []).map((spike) => ({
      priority: spike.priority,
      trigger: spike.trigger,
      expectedMinute: spike.expectedMinute,
      earlyToleranceMin: spike.earlyToleranceMin,
      lateToleranceMin: spike.lateToleranceMin,
      activeDurationSec: spike.activeDurationSec,
      fadeDurationSec: spike.fadeDurationSec,
      permanent: spike.permanent,
      window: spike.window,
      actions: spike.actions,
      requires: (spike.requires ?? []).map(({ type, value }) => ({ type, value }))
    }))
  }));
}

function duplicateGroups(entries) {
  const groups = new Map();
  for (const [id, fingerprint] of entries) {
    const ids = groups.get(fingerprint) ?? [];
    ids.push(id);
    groups.set(fingerprint, ids);
  }
  return [...groups.values()].filter((ids) => ids.length > 1);
}

function uniqueItemSequences(profile) {
  return new Set((profile.buildPlans ?? []).map((plan) =>
    (plan.items ?? plan.coreItems ?? []).map((item) => item.id).join('>')
  )).size;
}

function isSyntheticArtifact(value) {
  return Boolean(value?.generic) || SYNTHETIC_ARTIFACT_PATTERN.test(`${value?.id ?? ''} ${value?.name ?? ''}`);
}

test('all 127 hero profiles meet the semantic quality bar', () => {
  const profiles = listHeroProfiles();
  const genericArtifacts = [];
  const placeholderIdentities = [];
  const missingIdentity = [];
  const missingBenchmarkContract = [];
  const weakExplicitCoverage = [];
  const weakPlanDiversity = [];
  const unsupportedRequirements = [];
  const malformedValues = [];
  const suspiciousRoleItems = [];

  const supportCoreRedFlags = new Set([
    'item_bfury', 'item_greater_crit', 'item_satanic', 'item_butterfly', 'item_abyssal_blade'
  ]);

  for (const profile of profiles) {
    const plans = profile.buildPlans ?? [];
    const spikes = profile.spikes ?? [];
    const identity = profile.playstyleIdentity ?? '';

    if (!identity.trim()) missingIdentity.push(profile.id);
    if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(identity))) {
      placeholderIdentities.push({ hero: profile.id, identity });
    }
    if (!profile.benchmarkContract) missingBenchmarkContract.push(profile.id);

    const explicitPlans = plans.filter((plan) => !isSyntheticArtifact(plan));
    const explicitSpikes = spikes.filter((spike) => !isSyntheticArtifact(spike));
    if (explicitPlans.length < 4 || explicitSpikes.length < 4) {
      weakExplicitCoverage.push({
        hero: profile.id,
        plans: plans.length,
        explicitPlans: explicitPlans.length,
        spikes: spikes.length,
        explicitSpikes: explicitSpikes.length
      });
    }

    if (uniqueItemSequences(profile) < 2) {
      weakPlanDiversity.push({ hero: profile.id, uniqueItemSequences: uniqueItemSequences(profile) });
    }

    for (const plan of plans) {
      if (isSyntheticArtifact(plan)) {
        genericArtifacts.push({ hero: profile.id, kind: 'plan', id: plan.id, name: plan.name });
      }
      const items = plan.items ?? plan.coreItems ?? [];
      if (profile.role === 'support') {
        for (const item of items) {
          if (supportCoreRedFlags.has(item.id)) {
            suspiciousRoleItems.push({ hero: profile.id, plan: plan.id, item: item.id });
          }
        }
      }
      if (!Array.isArray(plan.scenarioTags) || plan.scenarioTags.length === 0) {
        malformedValues.push({ hero: profile.id, path: `plan:${plan.id}.scenarioTags`, value: plan.scenarioTags });
      }
    }

    for (const spike of spikes) {
      if (isSyntheticArtifact(spike)) {
        genericArtifacts.push({ hero: profile.id, kind: 'spike', id: spike.id, name: spike.name });
      }
      for (const requirement of spike.requires ?? []) {
        if (!SUPPORTED_REQUIREMENTS.has(requirement.type)) {
          unsupportedRequirements.push({ hero: profile.id, spike: spike.id, type: requirement.type });
        }
      }
      const numericChecks = {
        priority: spike.priority,
        expectedMinute: spike.expectedMinute,
        activeDurationSec: spike.activeDurationSec,
        fadeDurationSec: spike.fadeDurationSec
      };
      for (const [key, value] of Object.entries(numericChecks)) {
        if (!Number.isFinite(value) || value < 0) {
          malformedValues.push({ hero: profile.id, path: `spike:${spike.id}.${key}`, value });
        }
      }
    }

    for (const [dimension, value] of Object.entries(profile.basePower ?? {})) {
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        malformedValues.push({ hero: profile.id, path: `basePower.${dimension}`, value });
      }
    }
  }

  const duplicateSemanticProfiles = duplicateGroups(
    profiles.map((profile) => [profile.id, semanticFingerprint(profile)])
  );

  const summary = {
    profileCount: profiles.length,
    genericArtifacts,
    placeholderIdentities,
    missingIdentity,
    missingBenchmarkContract,
    weakExplicitCoverage,
    weakPlanDiversity,
    duplicateSemanticProfiles,
    unsupportedRequirements,
    malformedValues,
    suspiciousRoleItems,
    confidence: {
      minimum: Math.min(...profiles.map((profile) => profile.profileConfidence ?? 0)),
      maximum: Math.max(...profiles.map((profile) => profile.profileConfidence ?? 0)),
      below070: profiles.filter((profile) => (profile.profileConfidence ?? 0) < 0.7).map((profile) => profile.id)
    }
  };

  console.log(`HERO_INTELLIGENCE_QUALITY_AUDIT=${JSON.stringify(summary)}`);

  assert.equal(profiles.length, 127);
  assert.deepEqual(genericArtifacts, [], 'runtime profiles still contain generic padding');
  assert.deepEqual(placeholderIdentities, [], 'placeholder identities remain');
  assert.deepEqual(missingIdentity, [], 'hero-specific playstyle identities are missing');
  assert.deepEqual(missingBenchmarkContract, [], 'benchmark assumptions are undocumented');
  assert.deepEqual(weakExplicitCoverage, [], 'some heroes do not have four explicit plans and spikes');
  assert.deepEqual(duplicateSemanticProfiles, [], 'two heroes have identical semantic models');
  assert.deepEqual(unsupportedRequirements, [], 'some spike requirements are ignored by the engine');
  assert.deepEqual(malformedValues, [], 'profile values violate the runtime contract');
});
