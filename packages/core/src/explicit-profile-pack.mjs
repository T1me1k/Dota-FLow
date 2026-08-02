const ITEM_CATALOG = Object.freeze({
  phase_boots: { id: 'item_phase_boots', name: 'Phase Boots', cost: 1500 },
  arcane_boots: { id: 'item_arcane_boots', name: 'Arcane Boots', cost: 1300 },
  travel_boots: { id: 'item_travel_boots', name: 'Boots of Travel', cost: 2500 },
  vanguard: { id: 'item_vanguard', name: 'Vanguard', cost: 1700 },
  blink: { id: 'item_blink', name: 'Blink Dagger', cost: 2250 },
  blade_mail: { id: 'item_blade_mail', name: 'Blade Mail', cost: 2300 },
  bkb: { id: 'item_black_king_bar', name: 'Black King Bar', cost: 4050 },
  pipe: { id: 'item_pipe', name: 'Pipe of Insight', cost: 3725 },
  crimson_guard: { id: 'item_crimson_guard', name: 'Crimson Guard', cost: 3725 },
  lotus_orb: { id: 'item_lotus_orb', name: 'Lotus Orb', cost: 3850 },
  shivas_guard: { id: 'item_shivas_guard', name: "Shiva's Guard", cost: 4850 },
  heavens_halberd: { id: 'item_heavens_halberd', name: "Heaven's Halberd", cost: 3550 },
  force_staff: { id: 'item_force_staff', name: 'Force Staff', cost: 2200 },
  euls: { id: 'item_cyclone', name: "Eul's Scepter", cost: 2625 },
  octarine_core: { id: 'item_octarine_core', name: 'Octarine Core', cost: 4800 },
  refresher: { id: 'item_refresher', name: 'Refresher Orb', cost: 5000 },
  scepter: { id: 'item_ultimate_scepter', name: "Aghanim's Scepter", cost: 4200 },
  assault_cuirass: { id: 'item_assault', name: 'Assault Cuirass', cost: 5125 },
  echo_sabre: { id: 'item_echo_sabre', name: 'Echo Sabre', cost: 2700 },
  linken: { id: 'item_sphere', name: "Linken's Sphere", cost: 4800 },
  satanic: { id: 'item_satanic', name: 'Satanic', cost: 5050 },
  helm_dominator: { id: 'item_helm_of_the_dominator', name: 'Helm of the Dominator', cost: 2625 },
  vladmir: { id: 'item_vladmir', name: "Vladmir's Offering", cost: 2200 },
  bloodstone: { id: 'item_bloodstone', name: 'Bloodstone', cost: 4400 },
  guardian_greaves: { id: 'item_guardian_greaves', name: 'Guardian Greaves', cost: 5050 },
  mekansm: { id: 'item_mekansm', name: 'Mekansm', cost: 1775 },
  hand_of_midas: { id: 'item_hand_of_midas', name: 'Hand of Midas', cost: 2200 }
});

function getItem(key) {
  const value = ITEM_CATALOG[key];
  if (!value) throw new Error(`Unknown item key in explicit profile pack: ${key}`);
  return value;
}

function buildPlan(heroId, role, calibration, definition) {
  const coreItems = definition.items.map(getItem);
  return {
    id: `${heroId}_${definition.id}`,
    name: definition.name,
    role,
    scenarioTags: definition.scenarioTags,
    priority: definition.priority,
    coreItems,
    optionalItems: (definition.optional ?? []).map(getItem),
    situationalItems: (definition.situational ?? []).map(getItem),
    avoidWhen: definition.avoidWhen ?? [],
    reasons: definition.reasons,
    requiredSignals: definition.requiredSignals ?? [],
    confidence: calibration.calibrationConfidence,
    calibrationVersion: calibration.calibrationVersion,
    items: coreItems
  };
}

const LIFECYCLE = Object.freeze([
  { earlyToleranceMin: 1.1, lateToleranceMin: 2.5, activeDurationSec: 180, fadeDurationSec: 120 },
  { earlyToleranceMin: 2, lateToleranceMin: 3.8, activeDurationSec: 300, fadeDurationSec: 180 },
  { earlyToleranceMin: 3, lateToleranceMin: 5, activeDurationSec: 360, fadeDurationSec: 240 },
  { earlyToleranceMin: 4, lateToleranceMin: 7, activeDurationSec: 420, fadeDurationSec: 300 }
]);

function buildSpike(heroId, calibration, condition, definition, index) {
  const lifecycle = definition.lifecycle ?? LIFECYCLE[Math.min(index, LIFECYCLE.length - 1)];
  return {
    id: `${heroId}_${definition.id}`,
    name: definition.name,
    priority: definition.priority,
    trigger: {
      all: definition.trigger.map(([type, value]) =>
        condition(type, type === 'item_owned' ? getItem(value).id : value)
      )
    },
    expectedMinute: definition.expectedMinute,
    ...lifecycle,
    permanent: definition.permanent,
    window: definition.window,
    actions: definition.actions,
    recommendation: definition.recommendation,
    requires: definition.requires ?? [],
    calibrationVersion: calibration.calibrationVersion
  };
}

export function createExplicitProfilePack(definitions, { benchmark, condition }, calibration) {
  return Object.fromEntries(definitions.map((definition) => {
    const role = definition.role ?? 'offlane';
    const profileCalibration = { ...calibration, ...(definition.calibration ?? {}) };
    return [definition.id, {
      id: definition.id,
      displayName: definition.displayName,
      role,
      primaryRole: role,
      roles: definition.roles,
      archetypes: definition.archetypes,
      draftTags: definition.draftTags,
      vulnerabilities: definition.vulnerabilities,
      playstyleIdentity: definition.identity,
      basePower: definition.basePower,
      stageCurves: definition.stageCurves,
      benchmarks: benchmark(definition.benchmarkPoints),
      benchmarkContract: definition.benchmarkContract,
      buildPlans: definition.plans.map((plan) => buildPlan(definition.id, role, profileCalibration, plan)),
      spikes: definition.spikes.map((spike, index) => buildSpike(definition.id, profileCalibration, condition, spike, index)),
      ...profileCalibration,
      profileConfidence: profileCalibration.calibrationConfidence,
      balanceCalibration: 'prototype calibration'
    }];
  }));
}
