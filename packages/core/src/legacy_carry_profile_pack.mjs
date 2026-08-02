const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-legacy-carry-pack-1-v2',
  calibrationSource: 'hero-specific strategic review against the project 7.41 baseline; live recordings pending',
  calibrationConfidence: 0.74,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const VOID_CALIBRATION = Object.freeze({
  ...CALIBRATION,
  calibrationVersion: 'prototype-7.41-faceless-void-conservative-v2',
  calibrationConfidence: 0.70,
  calibrationSource: 'hero-specific strategic review; Chronosphere target geometry and ally damage availability are not observable in current telemetry'
});

export const HERO_IDS = Object.freeze([
  'anti_mage',
  'faceless_void',
  'medusa',
  'phantom_assassin',
  'luna',
  'ursa'
]);

function getItem(ITEMS, key) {
  const value = ITEMS[key];
  if (!value) throw new Error(`Unknown item key in legacy carry profile pack: ${key}`);
  return value;
}

function makePlan(ITEMS, heroId, calibration, {
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

function makeSpike(condition, heroId, calibration, {
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

function makeProfile({
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

export function createProfilePack({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.anti_mage = makeProfile({
    id: 'anti_mage',
    displayName: 'Anti-Mage',
    roles: ['Carry'],
    archetypes: ['flash_farmer', 'split_pusher', 'mana_punisher'],
    draftTags: ['mobility', 'split_push', 'late_game', 'anti_mage'],
    vulnerabilities: ['control', 'tempo', 'physical_burst'],
    identity: 'Protect the Battle Fury and Manta acceleration curve, stretch the map with Blink and illusions, then punish isolated mana-dependent cores without becoming the first visible target.',
    basePower: { farm: 82, fight: 45, push: 72, survival: 55, initiation: 35, objective: 56, mobility: 86 },
    stageCurves: {
      early: { farm: -7, fight: -13, push: -5, survival: -5 },
      mid: { farm: 18, push: 15, mobility: 11, fight: 6 },
      late: { fight: 21, push: 16, survival: 12, objective: 10 }
    },
    benchmarkPoints: [[5,350,5],[10,470,8],[15,570,12],[20,650,16],[30,735,22],[40,780,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Battle Fury before the enemy can permanently occupy both safe farming quadrants',
      defensiveItem: 'Manta or BKB before committing into layered silence and instant control',
      objectiveTiming: 'after split pressure reveals multiple defenders or after a clean pickoff',
      telemetryCaveat: 'enemy mana values and safe Blink routes are not available to the current runtime'
    },
    telemetryLimitations: ['enemy_mana_not_available', 'safe_blink_route_not_observed'],
    buildPlans: [
      makePlan(ITEMS, 'anti_mage', CALIBRATION, { id:'balanced', name:'Battle Fury split acceleration', scenarioTags:['balanced'], priority:86, itemKeys:['battle_fury','manta','butterfly','abyssal'], reasons:['balanced_draft'], optional:['skadi'], situational:['bkb'] }),
      makePlan(ITEMS, 'anti_mage', CALIBRATION, { id:'control_response', name:'Protected Blink commitment', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['battle_fury','manta','bkb','abyssal'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['satanic'] }),
      makePlan(ITEMS, 'anti_mage', CALIBRATION, { id:'recovery', name:'Safe quadrant recovery', scenarioTags:['player_behind'], priority:92, itemKeys:['battle_fury','manta','linken','butterfly'], reasons:['player_behind'], optional:['bkb'], situational:['abyssal'], avoidWhen:['enemy_controls_both_safe_quadrants'] }),
      makePlan(ITEMS, 'anti_mage', CALIBRATION, { id:'objective', name:'Split-push numbers conversion', scenarioTags:['player_ahead','objective_window'], priority:96, itemKeys:['battle_fury','manta','abyssal','butterfly'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['skadi'] })
    ],
    spikes: [
      makeSpike(condition, 'anti_mage', CALIBRATION, { id:'level_6', name:'Mana Void punish window', priority:52, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:150, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Mana Void must be ready'},{type:'min_health_pct',value:0.55,message:'Do not Blink into the first Mana Void attempt while already low'}], permanent:{fight:5,initiation:4}, window:{fight:11,connect:8}, actions:{FIGHT:10,CONNECT:8}, recommendation:'Join only for a depleted, reachable target; otherwise preserve the farming route.' }),
      makeSpike(condition, 'anti_mage', CALIBRATION, { id:'battle_fury', name:'Battle Fury acceleration', priority:74, trigger:[['item_owned',getItem(ITEMS,'battle_fury').id]], expectedMinute:14, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:330, fadeDurationSec:210, permanent:{farm:25,push:9}, window:{farm:21,pressure:7}, actions:{FARM:25,PRESSURE:7}, recommendation:'Cycle through safe waves and camps; do not spend the acceleration timing on low-value grouped movement.' }),
      makeSpike(condition, 'anti_mage', CALIBRATION, { id:'manta', name:'Manta split-push breakpoint', priority:88, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:21, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:390, fadeDurationSec:240, permanent:{farm:13,push:25,survival:11,mobility:6}, window:{pressure:24,farm:10}, actions:{PRESSURE:25,FARM:10,CONNECT:7}, recommendation:'Send illusions into the dangerous lane and keep the real hero on a route that preserves Blink escape.' }),
      makeSpike(condition, 'anti_mage', CALIBRATION, { id:'manta_abyssal', name:'Manta plus Abyssal isolation threat', priority:98, trigger:[['item_owned',getItem(ITEMS,'manta').id],['item_owned',getItem(ITEMS,'abyssal').id]], expectedMinute:31, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:420, fadeDurationSec:260, requires:[{type:'min_health_pct',value:0.65,message:'Reset before committing to the isolated core'}], permanent:{fight:25,initiation:18,survival:8,objective:9}, window:{fight:24,pressure:16,objective:12}, actions:{FIGHT:25,PRESSURE:16,OBJECTIVE:12}, recommendation:'Remove one isolated core, save Blink for the exit, and convert the numbers advantage instead of chasing supports.' })
    ]
  }, benchmark);

  profiles.faceless_void = makeProfile({
    id: 'faceless_void',
    displayName: 'Faceless Void',
    roles: ['Carry'],
    archetypes: ['cooldown_carry', 'teamfight_initiator', 'scaling_core'],
    draftTags: ['teamfight', 'initiation', 'late_game', 'mobility'],
    vulnerabilities: ['cooldown_dependency', 'silence', 'save'],
    identity: 'Treat Chronosphere as a limited team resource: farm and pressure between cooldowns, then disappear from vision and force one decisive fight when allied damage can reach the trapped targets.',
    basePower: { farm: 68, fight: 80, push: 50, survival: 66, initiation: 78, objective: 57, mobility: 73 },
    stageCurves: {
      early: { fight: 4, initiation: 7, farm: -4 },
      mid: { farm: 11, fight: 18, initiation: 17, survival: 8 },
      late: { fight: 20, survival: 13, objective: 9, push: 6 }
    },
    benchmarkPoints: [[5,340,5],[10,445,8],[15,530,12],[20,605,16],[30,690,22],[40,745,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'first attack-speed farming item without missing a high-value Chronosphere opportunity',
      defensiveItem: 'BKB before silence or control prevents Time Walk and follow-up attacks',
      objectiveTiming: 'after a successful Chronosphere or while the enemy avoids fighting into its availability',
      telemetryCaveat: 'Chronosphere geometry, trapped target count and allied damage reach are not observable'
    },
    telemetryLimitations: ['chronosphere_geometry_not_available', 'allied_damage_reach_not_available'],
    calibration: VOID_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'faceless_void', VOID_CALIBRATION, { id:'balanced', name:'Attack-speed Chronosphere scaling', scenarioTags:['balanced'], priority:87, itemKeys:['mask_of_madness','maelstrom','bkb','butterfly'], reasons:['balanced_draft'], optional:['mjollnir'], situational:['satanic'] }),
      makePlan(ITEMS, 'faceless_void', VOID_CALIBRATION, { id:'control_response', name:'Protected Time Walk follow-through', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['maelstrom','bkb','manta','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['butterfly'] }),
      makePlan(ITEMS, 'faceless_void', VOID_CALIBRATION, { id:'recovery', name:'Cooldown-safe farm recovery', scenarioTags:['player_behind'], priority:90, itemKeys:['maelstrom','manta','bkb','butterfly'], reasons:['player_behind'], optional:['mjollnir'], situational:['satanic'] }),
      makePlan(ITEMS, 'faceless_void', VOID_CALIBRATION, { id:'objective', name:'Chronosphere objective conversion', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['maelstrom','bkb','daedalus','butterfly'], reasons:['player_ahead','objective_window'], optional:['mjollnir'], situational:['satanic'], requiredSignals:['allies_ready'] })
    ],
    spikes: [
      makeSpike(condition, 'faceless_void', VOID_CALIBRATION, { id:'chrono_1', name:'Chronosphere level 1', priority:70, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Chronosphere must be ready'},{type:'min_health_pct',value:0.55,message:'Reset before taking the first Chronosphere fight'}], permanent:{fight:7,initiation:11}, window:{fight:21,connect:18}, actions:{FIGHT:21,CONNECT:18}, recommendation:'Use Chronosphere only when allies can immediately damage the trapped priority target.' }),
      makeSpike(condition, 'faceless_void', VOID_CALIBRATION, { id:'maelstrom', name:'Maelstrom farm-to-fight bridge', priority:78, trigger:[['item_owned',getItem(ITEMS,'maelstrom').id]], expectedMinute:15, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:190, permanent:{farm:16,fight:9}, window:{farm:13,fight:8}, actions:{FARM:15,FIGHT:8}, recommendation:'Accelerate while Chronosphere is unavailable and arrive to the next cooldown with full resources.' }),
      makeSpike(condition, 'faceless_void', VOID_CALIBRATION, { id:'mjollnir', name:'Mjollnir Chronosphere damage spike', priority:86, trigger:[['item_owned',getItem(ITEMS,'mjollnir').id]], expectedMinute:21, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:330, fadeDurationSec:220, requires:[{type:'ultimate_ready',message:'Chronosphere should be ready for the damage timing'}], permanent:{farm:14,fight:18}, window:{fight:18,farm:8}, actions:{FIGHT:19,FARM:8}, recommendation:'Force a smoke or objective fight during the first full-damage Chronosphere window.' }),
      makeSpike(condition, 'faceless_void', VOID_CALIBRATION, { id:'bkb', name:'BKB Chronosphere commitment', priority:98, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:25, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:330, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Chronosphere must be available for the protected commitment'},{type:'min_health_pct',value:0.65,message:'Heal before the decisive fight'}], permanent:{survival:25,fight:18,initiation:7}, window:{fight:26,objective:12}, actions:{FIGHT:28,OBJECTIVE:12,CONNECT:16}, recommendation:'Disappear from lanes and force the decisive fight before the protected window loses value.' })
    ]
  }, benchmark);

  profiles.medusa = makeProfile({
    id: 'medusa',
    displayName: 'Medusa',
    roles: ['Carry', 'Mid'],
    archetypes: ['ranged_hypercarry', 'frontline_siege', 'flash_farmer'],
    draftTags: ['late_game', 'ranged_damage', 'siege', 'teamfight'],
    vulnerabilities: ['mana_burn', 'tempo', 'backline_access'],
    identity: 'Turn mana and farm into an immovable ranged formation: clear multiple lanes, stand where allies can protect the flanks, and use Stone Gaze to punish enemies that must walk into the objective area.',
    basePower: { farm: 81, fight: 67, push: 69, survival: 82, initiation: 24, objective: 72, mobility: 25 },
    stageCurves: {
      early: { farm: -2, fight: -11, survival: -5, mobility: -5 },
      mid: { farm: 17, fight: 11, push: 12, survival: 12 },
      late: { fight: 24, push: 16, survival: 19, objective: 17 }
    },
    benchmarkPoints: [[5,350,5],[10,465,8],[15,555,12],[20,630,16],[30,715,22],[40,765,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Manta before grouped map pressure closes the outer farming lanes',
      defensiveItem: 'Skadi, Butterfly or BKB according to whether the threat is sustain, physical damage or control',
      objectiveTiming: 'when the formation can hold one entrance and Stone Gaze covers the enemy approach',
      telemetryCaveat: 'current mana amount is visible, but incoming mana burn and enemy flank geometry are not predicted'
    },
    telemetryLimitations: ['incoming_mana_burn_not_predicted', 'enemy_flank_geometry_not_available'],
    buildPlans: [
      makePlan(ITEMS, 'medusa', CALIBRATION, { id:'balanced', name:'Manta Skadi formation', scenarioTags:['balanced'], priority:88, itemKeys:['manta','skadi','butterfly','daedalus'], reasons:['balanced_draft'], optional:['satanic'], situational:['bkb'] }),
      makePlan(ITEMS, 'medusa', CALIBRATION, { id:'control_response', name:'Protected ranged frontline', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['manta','bkb','skadi','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['butterfly'], situational:['linken'] }),
      makePlan(ITEMS, 'medusa', CALIBRATION, { id:'recovery', name:'Two-lane recovery formation', scenarioTags:['player_behind'], priority:91, itemKeys:['manta','butterfly','skadi','satanic'], reasons:['player_behind'], optional:['bkb'], situational:['daedalus'] }),
      makePlan(ITEMS, 'medusa', CALIBRATION, { id:'objective', name:'Skadi siege conversion', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['manta','skadi','butterfly','daedalus'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['satanic'], requiredSignals:['allies_ready'] })
    ],
    spikes: [
      makeSpike(condition, 'medusa', CALIBRATION, { id:'level_6', name:'Stone Gaze defensive formation', priority:56, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:160, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Stone Gaze must be ready'},{type:'min_mana_pct',value:0.45,message:'Restore mana before holding the formation'}], permanent:{fight:5,survival:7}, window:{fight:12,pressure:7}, actions:{FIGHT:10,PRESSURE:7}, recommendation:'Use Stone Gaze to disengage or protect a controlled objective area, not to chase mobile targets.' }),
      makeSpike(condition, 'medusa', CALIBRATION, { id:'manta', name:'Manta farming breakpoint', priority:80, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:17, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:360, fadeDurationSec:220, requires:[{type:'min_mana_pct',value:0.5,message:'Do not occupy the dangerous lane with a depleted mana shield'}], permanent:{farm:19,push:15,survival:9}, window:{farm:17,pressure:11}, actions:{FARM:19,PRESSURE:11}, recommendation:'Use illusions to cover the second lane while the real hero farms toward the durable frontline timing.' }),
      makeSpike(condition, 'medusa', CALIBRATION, { id:'skadi', name:'Eye of Skadi frontline timing', priority:91, trigger:[['item_owned',getItem(ITEMS,'skadi').id]], expectedMinute:24, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_mana_pct',value:0.6,message:'Fill mana before standing at the front of the objective'}], permanent:{fight:19,survival:18,objective:10}, window:{fight:19,objective:13}, actions:{FIGHT:20,OBJECTIVE:13}, recommendation:'Stand with the team, force the enemy to enter Stone Gaze range, and convert the won formation into Roshan or a tower.' }),
      makeSpike(condition, 'medusa', CALIBRATION, { id:'butterfly', name:'Butterfly ranged carry peak', priority:97, trigger:[['item_owned',getItem(ITEMS,'butterfly').id]], expectedMinute:31, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:420, fadeDurationSec:260, requires:[{type:'min_mana_pct',value:0.65,message:'Reset mana before the decisive siege'}], permanent:{fight:25,survival:19,push:11,objective:10}, window:{fight:22,pressure:14,objective:14}, actions:{FIGHT:23,PRESSURE:14,OBJECTIVE:14}, recommendation:'Force a major objective before the enemy completes the clean physical answer to the evasion timing.' })
    ]
  }, benchmark);

  profiles.phantom_assassin = makeProfile({
    id: 'phantom_assassin',
    displayName: 'Phantom Assassin',
    roles: ['Carry'],
    archetypes: ['backline_diver', 'physical_burst_carry', 'evasion_core'],
    draftTags: ['physical_burst', 'backline_access', 'late_game', 'pickoff'],
    vulnerabilities: ['control', 'break', 'armor', 'save'],
    identity: 'Farm toward one protected backline jump, reveal as late as possible, and spend BKB on the priority damage source rather than opening the fight into layered control.',
    basePower: { farm: 66, fight: 77, push: 47, survival: 58, initiation: 69, objective: 55, mobility: 68 },
    stageCurves: {
      early: { farm: -4, fight: -7, survival: -5 },
      mid: { farm: 12, fight: 19, initiation: 17, objective: 7 },
      late: { fight: 22, survival: 12, initiation: 8, objective: 9 }
    },
    benchmarkPoints: [[5,340,5],[10,450,8],[15,535,12],[20,610,16],[30,690,22],[40,735,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Battle Fury or direct Desolator route chosen before the lane phase ends',
      defensiveItem: 'BKB before jumping into reliable control, break or save chains',
      objectiveTiming: 'after the backline target dies or when Roshan can be taken without showing first',
      telemetryCaveat: 'enemy armor, break readiness and exact save cooldowns are not observed'
    },
    telemetryLimitations: ['enemy_break_readiness_not_available', 'enemy_save_cooldowns_not_available'],
    buildPlans: [
      makePlan(ITEMS, 'phantom_assassin', CALIBRATION, { id:'balanced', name:'Battle Fury Desolator burst curve', scenarioTags:['balanced'], priority:87, itemKeys:['battle_fury','desolator','bkb','satanic'], reasons:['balanced_draft'], optional:['abyssal'], situational:['butterfly'] }),
      makePlan(ITEMS, 'phantom_assassin', CALIBRATION, { id:'control_response', name:'Early protected backline access', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['battle_fury','bkb','desolator','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['abyssal'] }),
      makePlan(ITEMS, 'phantom_assassin', CALIBRATION, { id:'recovery', name:'Blur-side economy recovery', scenarioTags:['player_behind'], priority:91, itemKeys:['battle_fury','bkb','satanic','abyssal'], reasons:['player_behind'], optional:['desolator'], situational:['butterfly'], avoidWhen:['enemy_controls_safe_farm'] }),
      makePlan(ITEMS, 'phantom_assassin', CALIBRATION, { id:'objective', name:'Desolator pickoff conversion', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['desolator','bkb','abyssal','satanic'], reasons:['player_ahead','objective_window'], optional:['battle_fury'], situational:['butterfly'] })
    ],
    spikes: [
      makeSpike(condition, 'phantom_assassin', CALIBRATION, { id:'level_6', name:'Coup de Grace lane threat', priority:51, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:150, fadeDurationSec:120, requires:[{type:'min_health_pct',value:0.55,message:'Do not rely on a critical hit while too low to survive the trade'}], permanent:{fight:6,farm:3}, window:{fight:10,pressure:5}, actions:{FIGHT:9,PRESSURE:5}, recommendation:'Use the threat to secure the lane or finish a controlled target; do not force an unsupported jump.' }),
      makeSpike(condition, 'phantom_assassin', CALIBRATION, { id:'battle_fury', name:'Battle Fury acceleration', priority:71, trigger:[['item_owned',getItem(ITEMS,'battle_fury').id]], expectedMinute:15, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:330, fadeDurationSec:210, permanent:{farm:24,push:6}, window:{farm:20}, actions:{FARM:28}, recommendation:'Accelerate through safe camps and waves; this is not yet permission to start the five-on-five fight.' }),
      makeSpike(condition, 'phantom_assassin', CALIBRATION, { id:'desolator', name:'Battle Fury plus Desolator burst timing', priority:82, trigger:[['item_owned',getItem(ITEMS,'battle_fury').id],['item_owned',getItem(ITEMS,'desolator').id]], expectedMinute:21, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:270, fadeDurationSec:190, permanent:{fight:19,objective:15,initiation:6}, window:{fight:18,pressure:8}, actions:{FIGHT:14,CONNECT:10,OBJECTIVE:9}, recommendation:'Hunt a soft backline target, but stay out until the first control layer is committed.' }),
      makeSpike(condition, 'phantom_assassin', CALIBRATION, { id:'bkb_combo', name:'Desolator plus BKB protected jump', priority:99, trigger:[['item_owned',getItem(ITEMS,'desolator').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:25, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:330, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Heal before the protected backline jump'}], permanent:{fight:27,survival:29,initiation:10,objective:11}, window:{fight:25,connect:19,objective:11}, actions:{FIGHT:30,CONNECT:20,OBJECTIVE:11}, recommendation:'Wait for the first disables, jump the priority damage source, and convert the kill into the nearby objective.' })
    ]
  }, benchmark);

  profiles.luna = makeProfile({
    id: 'luna',
    displayName: 'Luna',
    roles: ['Carry'],
    archetypes: ['flash_farmer', 'illusion_pusher', 'grouped_damage_carry'],
    draftTags: ['flash_farm', 'tower_damage', 'teamfight', 'ranged_damage'],
    vulnerabilities: ['control', 'burst', 'backline_access'],
    identity: 'Use glaive acceleration and Manta illusions to compress the map, group only when Eclipse has a clean target environment, and turn every won fight into rapid building damage.',
    basePower: { farm: 79, fight: 58, push: 76, survival: 49, initiation: 20, objective: 70, mobility: 39 },
    stageCurves: {
      early: { farm: -5, fight: -6, push: -3 },
      mid: { farm: 18, fight: 13, push: 18, objective: 12 },
      late: { fight: 18, push: 15, survival: 10, objective: 14 }
    },
    benchmarkPoints: [[5,360,5],[10,480,8],[15,575,12],[20,645,16],[30,725,22],[40,765,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Manta before the enemy can lock every safe lane with grouped pressure',
      defensiveItem: 'BKB before committing Eclipse into reliable control or burst',
      objectiveTiming: 'after a won grouped fight or while illusions force a defender away',
      telemetryCaveat: 'enemy unit density around Eclipse targets and illusion lane assignments are not observed'
    },
    telemetryLimitations: ['eclipse_target_density_not_available', 'illusion_lane_assignment_not_observed'],
    buildPlans: [
      makePlan(ITEMS, 'luna', CALIBRATION, { id:'balanced', name:'Manta grouped acceleration', scenarioTags:['balanced'], priority:88, itemKeys:['mask_of_madness','manta','bkb','satanic'], reasons:['balanced_draft'], optional:['butterfly'], situational:['skadi'] }),
      makePlan(ITEMS, 'luna', CALIBRATION, { id:'control_response', name:'Protected Eclipse formation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['manta','bkb','satanic','butterfly'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['skadi'] }),
      makePlan(ITEMS, 'luna', CALIBRATION, { id:'recovery', name:'Illusion lane recovery', scenarioTags:['player_behind'], priority:91, itemKeys:['mask_of_madness','manta','butterfly','bkb'], reasons:['player_behind'], optional:['satanic'], situational:['skadi'] }),
      makePlan(ITEMS, 'luna', CALIBRATION, { id:'objective', name:'Manta building conversion', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['manta','bkb','butterfly','satanic'], reasons:['player_ahead','objective_window'], optional:['skadi'], situational:['daedalus'], requiredSignals:['allies_ready'] })
    ],
    spikes: [
      makeSpike(condition, 'luna', CALIBRATION, { id:'level_6', name:'Eclipse level 1', priority:47, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:150, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Eclipse must be ready'},{type:'min_health_pct',value:0.55,message:'Do not enter Eclipse range while already low'}], permanent:{fight:5}, window:{fight:15,connect:14}, actions:{FIGHT:12,CONNECT:14}, recommendation:'Use Eclipse with allied control and a clean target area; otherwise keep accelerating.' }),
      makeSpike(condition, 'luna', CALIBRATION, { id:'manta', name:'Manta Style map compression', priority:82, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:17, earlyToleranceMin:2.2, lateToleranceMin:3.8, activeDurationSec:300, fadeDurationSec:220, permanent:{farm:19,push:21,survival:8,mobility:5}, window:{pressure:21,connect:8,fight:6}, actions:{FARM:9,PRESSURE:23,CONNECT:8}, recommendation:'Push the dangerous lane with illusions and move the real hero toward the next safe objective area.' }),
      makeSpike(condition, 'luna', CALIBRATION, { id:'bkb', name:'BKB grouped damage window', priority:91, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:22, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:300, fadeDurationSec:230, requires:[{type:'ultimate_ready',message:'Eclipse should be ready for the protected fight'},{type:'min_health_pct',value:0.6,message:'Reset before grouping around the BKB timing'}], permanent:{fight:18,survival:23,objective:8}, window:{fight:21,connect:17,objective:13}, actions:{FIGHT:23,CONNECT:18,OBJECTIVE:13}, recommendation:'Group around the fresh defensive timing and force one controlled fight near a tower or Roshan.' }),
      makeSpike(condition, 'luna', CALIBRATION, { id:'bkb_combo', name:'Manta plus BKB conversion peak', priority:98, trigger:[['item_owned',getItem(ITEMS,'manta').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:23, earlyToleranceMin:2.8, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:250, requires:[{type:'min_health_pct',value:0.65,message:'Heal before the decisive grouped conversion'}], permanent:{fight:20,push:16,survival:24,objective:16}, window:{fight:23,pressure:17,objective:18}, actions:{FIGHT:25,PRESSURE:17,OBJECTIVE:19}, recommendation:'Force the fight, then immediately use glaives and illusions on the nearest high-value structure.' })
    ]
  }, benchmark);

  profiles.ursa = makeProfile({
    id: 'ursa',
    displayName: 'Ursa',
    roles: ['Carry'],
    archetypes: ['fighting_carry', 'roshan_specialist', 'single_target_hunter'],
    draftTags: ['roshan', 'early_fight', 'single_target', 'objective'],
    vulnerabilities: ['kite', 'control', 'save'],
    identity: 'Use Fury Swipes and Enrage to threaten early Roshan and one reachable target, then buy mobility and protection so the first commitment ends in a kill instead of a prolonged chase.',
    basePower: { farm: 51, fight: 82, push: 43, survival: 73, initiation: 48, objective: 91, mobility: 43 },
    stageCurves: {
      early: { fight: 13, objective: 16, survival: 7 },
      mid: { fight: 20, objective: 19, initiation: 15, survival: 9 },
      late: { fight: 5, objective: 6, survival: 9, mobility: -3 }
    },
    benchmarkPoints: [[5,330,5],[10,425,8],[15,510,12],[20,575,16],[30,650,22],[40,690,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Blink before ranged cores can permanently kite the first commitment',
      defensiveItem: 'BKB or Linken before control or saves invalidate the Enrage window',
      objectiveTiming: 'early Roshan when the enemy cannot contest the pit and after every clean single-target pickoff',
      telemetryCaveat: 'Fury Swipes stacks, enemy save readiness and safe Roshan entry are not observable'
    },
    telemetryLimitations: ['fury_swipes_stacks_not_available', 'enemy_save_cooldowns_not_available', 'roshan_entry_safety_not_observed'],
    buildPlans: [
      makePlan(ITEMS, 'ursa', CALIBRATION, { id:'balanced', name:'Diffusal Blink target access', scenarioTags:['balanced'], priority:89, itemKeys:['diffusal','blink','bkb','basher'], reasons:['balanced_draft'], optional:['abyssal'], situational:['satanic'] }),
      makePlan(ITEMS, 'ursa', CALIBRATION, { id:'control_response', name:'Protected Enrage commitment', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['blink','bkb','basher','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['abyssal'] }),
      makePlan(ITEMS, 'ursa', CALIBRATION, { id:'recovery', name:'Pickoff-based Roshan recovery', scenarioTags:['player_behind'], priority:90, itemKeys:['diffusal','blink','bkb','satanic'], reasons:['player_behind'], optional:['basher'], situational:['linken'], requiredSignals:['roshan_available'] }),
      makePlan(ITEMS, 'ursa', CALIBRATION, { id:'objective', name:'Roshan control conversion', scenarioTags:['player_ahead','objective_window'], priority:99, itemKeys:['blink','basher','bkb','abyssal'], reasons:['player_ahead','objective_window'], optional:['satanic'], situational:['linken'], requiredSignals:['roshan_available','allies_ready'] })
    ],
    spikes: [
      makeSpike(condition, 'ursa', CALIBRATION, { id:'level_6', name:'Enrage Roshan permission', priority:68, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Enrage must be ready'},{type:'min_health_pct',value:0.6,message:'Do not start the objective while already low'}], permanent:{fight:8,survival:8,objective:12}, window:{fight:15,objective:20}, actions:{FIGHT:14,OBJECTIVE:21}, recommendation:'Threaten Roshan or a short single-target fight; avoid a long chase that outlasts Enrage.' }),
      makeSpike(condition, 'ursa', CALIBRATION, { id:'blink', name:'Blink target-access timing', priority:86, trigger:[['item_owned',getItem(ITEMS,'blink').id]], expectedMinute:14, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:190, requires:[{type:'ultimate_ready',message:'Enrage should be ready for the Blink commitment'}], permanent:{initiation:31,mobility:18,fight:12}, window:{fight:22,objective:19,connect:17}, actions:{FIGHT:22,OBJECTIVE:19,CONNECT:17}, recommendation:'Disappear from the lane, jump the reachable priority target, and move directly to Roshan or a tower after the kill.' }),
      makeSpike(condition, 'ursa', CALIBRATION, { id:'bkb', name:'BKB Enrage commitment', priority:95, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:310, fadeDurationSec:230, requires:[{type:'ultimate_ready',message:'Enrage must be available for the protected fight'},{type:'min_health_pct',value:0.65,message:'Reset before committing BKB and Enrage'}], permanent:{fight:21,survival:25,objective:10}, window:{fight:24,objective:18}, actions:{FIGHT:25,OBJECTIVE:19}, recommendation:'Force one high-value fight while the enemy cannot kite or control the first commitment.' }),
      makeSpike(condition, 'ursa', CALIBRATION, { id:'blink_basher', name:'Blink plus Basher target lock', priority:99, trigger:[['item_owned',getItem(ITEMS,'blink').id],['item_owned',getItem(ITEMS,'basher').id]], expectedMinute:24, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Enrage must be ready for the decisive target lock'}], permanent:{fight:24,initiation:18,objective:13}, window:{fight:26,objective:23,connect:16}, actions:{FIGHT:27,OBJECTIVE:24,CONNECT:16}, recommendation:'Lock one core before saves arrive, then immediately convert the kill into Roshan or high ground.' })
    ]
  }, benchmark);

  return profiles;
}
