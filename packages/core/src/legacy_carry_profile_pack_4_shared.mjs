export const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-legacy-carry-pack-4-v1',
  calibrationSource: 'hero-specific strategic review against the project 7.41 baseline; live recordings pending',
  calibrationConfidence: 0.72,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

export const ALCHEMIST_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-alchemist-economy-conservative-v1',
  calibrationConfidence: 0.69,
  calibrationSource: 'hero-specific strategic review; Greevil gold acceleration, Chemical Rage state and enemy anti-heal readiness are not observable'
});

export const CLINKZ_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-clinkz-pickoff-conservative-v1',
  calibrationConfidence: 0.67,
  calibrationSource: 'hero-specific strategic review; invisibility detection coverage, Death Pact target and safe exit route are not observable'
});

export const JUGGERNAUT_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-juggernaut-commitment-conservative-v1',
  calibrationConfidence: 0.70,
  calibrationSource: 'hero-specific strategic review; Omnislash isolation, Blade Fury state and Healing Ward safety are not observable'
});

export const MONKEY_KING_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-monkey-king-tree-conservative-v1',
  calibrationConfidence: 0.67,
  calibrationSource: 'hero-specific strategic review; tree position, tree-cut threats, Jingu stacks and Wukong zone quality are not observable'
});

export const SLARK_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-slark-vision-conservative-v1',
  calibrationConfidence: 0.68,
  calibrationSource: 'hero-specific strategic review; enemy vision, Dark Pact timing, Essence Shift stacks and Shadow Dance detection state are not observable'
});

export const TROLL_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-troll-target-lock-conservative-v1',
  calibrationConfidence: 0.69,
  calibrationSource: 'hero-specific strategic review; stance, Fervor stacks, Battle Trance target selection and enemy kite cooldowns are not observable'
});

export function getItem(ITEMS, key) {
  const value = ITEMS[key];
  if (!value) throw new Error(`Unknown item key in legacy carry profile pack 4: ${key}`);
  return value;
}

export function makePlan(ITEMS, heroId, calibration, {
  id,
  name,
  scenarioTags,
  priority,
  itemKeys,
  reasons,
  optional = [],
  situational = [],
  avoidWhen = [],
  requiredSignals = []
}) {
  const coreItems = itemKeys.map((key) => getItem(ITEMS, key));
  return {
    id: `${heroId}_${id}`,
    name,
    role: 'carry',
    scenarioTags,
    priority,
    coreItems,
    optionalItems: optional.map((key) => getItem(ITEMS, key)),
    situationalItems: situational.map((key) => getItem(ITEMS, key)),
    avoidWhen,
    reasons,
    requiredSignals,
    confidence: calibration.calibrationConfidence,
    calibrationVersion: calibration.calibrationVersion,
    items: coreItems
  };
}

export function makeSpike(condition, heroId, calibration, {
  id,
  publicId,
  name,
  priority,
  trigger,
  expectedMinute,
  earlyToleranceMin,
  lateToleranceMin,
  activeDurationSec,
  fadeDurationSec,
  permanent,
  window,
  actions,
  recommendation,
  requires = []
}) {
  return {
    id: publicId ?? `${heroId}_${id}`,
    name,
    priority,
    trigger: { all: trigger.map(([type, value]) => condition(type, value)) },
    expectedMinute,
    earlyToleranceMin,
    lateToleranceMin,
    activeDurationSec,
    fadeDurationSec,
    permanent,
    window,
    actions,
    recommendation,
    requires,
    calibrationVersion: calibration.calibrationVersion
  };
}

export function makeProfile({
  id,
  displayName,
  roles,
  archetypes,
  draftTags,
  vulnerabilities,
  identity,
  basePower,
  stageCurves,
  benchmarkPoints,
  benchmarkContract,
  buildPlans,
  spikes,
  telemetryLimitations = [],
  calibration = CALIBRATION
}, benchmark) {
  return {
    id,
    displayName,
    role: 'carry',
    primaryRole: 'carry',
    roles,
    archetypes,
    draftTags,
    vulnerabilities,
    playstyleIdentity: identity,
    basePower,
    stageCurves,
    benchmarks: benchmark(benchmarkPoints),
    benchmarkContract,
    buildPlans,
    spikes,
    telemetryLimitations,
    ...calibration,
    profileConfidence: calibration.calibrationConfidence,
    balanceCalibration: 'prototype calibration'
  };
}
