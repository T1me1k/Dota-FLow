export const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-legacy-core-pack-5-v1',
  calibrationSource: 'hero-specific strategic review against the project 7.41 baseline; live recordings pending',
  calibrationConfidence: 0.70,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

export const MUERTA_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-muerta-veil-positioning-conservative-v1',
  calibrationConfidence: 0.68,
  calibrationSource: 'hero-specific strategic review; Pierce the Veil state, Gunslinger target selection and enemy physical-control cooldowns are not observable'
});

export const TEMPLAR_ASSASSIN_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-templar-assassin-trap-objective-conservative-v1',
  calibrationConfidence: 0.70,
  calibrationSource: 'hero-specific strategic review; Refraction charges, Meld angle, trap coverage and enemy damage-over-time readiness are not observable'
});

export const WEAVER_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-weaver-shukuchi-lapse-conservative-v1',
  calibrationConfidence: 0.67,
  calibrationSource: 'hero-specific strategic review; Shukuchi route, Geminate target, Time Lapse restoration value and enemy detection coverage are not observable'
});

export const SVEN_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-sven-gods-strength-commitment-conservative-v1',
  calibrationConfidence: 0.71,
  calibrationSource: "hero-specific strategic review; God's Strength duration, Warcry coverage, cleave geometry and enemy kite cooldowns are not observable"
});

export const MARCI_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-marci-unleash-target-lock-conservative-v1',
  calibrationConfidence: 0.68,
  calibrationSource: 'hero-specific strategic review; Rebound partner, Dispose angle, Unleash pulse state and enemy disengage cooldowns are not observable'
});

export const DAWNBREAKER_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-dawnbreaker-global-conversion-conservative-v1',
  calibrationConfidence: 0.69,
  calibrationSource: 'hero-specific strategic review; Solar Guardian landing safety, Luminosity count, Starbreaker interruption risk and allied fight geometry are not observable'
});

export const LEGACY_SPIKE_ALIASES = Object.freeze({
  sven_gods_strength: 'sven_level_6'
});

export function getItem(ITEMS, key) {
  const value = ITEMS[key];
  if (!value) throw new Error(`Unknown item key in legacy core profile pack 5: ${key}`);
  return value;
}

export function makePlan(ITEMS, heroId, role, calibration, {
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
    role,
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
  role,
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
    role,
    primaryRole: role,
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
