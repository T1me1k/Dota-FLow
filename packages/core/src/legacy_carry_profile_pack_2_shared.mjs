export const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-legacy-carry-pack-2-v1',
  calibrationSource: 'hero-specific strategic review against the project 7.41 baseline; live recordings pending',
  calibrationConfidence: 0.73,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

export const POSITIONING_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-drow-positioning-conservative-v1',
  calibrationConfidence: 0.69,
  calibrationSource: 'hero-specific strategic review; enemy gap-close readiness and exact Marksmanship disable distance are not observable'
});

export function getItem(ITEMS, key) {
  const value = ITEMS[key];
  if (!value) throw new Error(`Unknown item key in legacy carry profile pack 2: ${key}`);
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
    id: `${heroId}_${id}`,
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
