const EXTRA_ITEMS = Object.freeze({
  helm_dominator: { id: 'item_helm_of_the_dominator', name: 'Helm of the Dominator', cost: 2625 },
  nullifier: { id: 'item_nullifier', name: 'Nullifier', cost: 4375 },
  shadow_blade: { id: 'item_invis_sword', name: 'Shadow Blade', cost: 3000 },
  solar_crest: { id: 'item_solar_crest', name: 'Solar Crest', cost: 2600 }
});

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-flex-core-v2',
  calibrationSource: 'hero-specific strategic review against the current 7.41 era; live recordings pending',
  calibrationConfidence: 0.72,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const KEZ_CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-kez-conservative-v2',
  calibrationSource: 'conservative repository role signals plus official Valve hero identity; ability-specific live calibration pending',
  calibrationConfidence: 0.60,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

export const HERO_IDS = Object.freeze([
  'lone_druid',
  'lycan',
  'natures_prophet',
  'visage',
  'kez',
  'windranger'
]);

function getItem(ITEMS, key) {
  const value = ITEMS[key] ?? EXTRA_ITEMS[key];
  if (!value) throw new Error(`Unknown item key in flex-core profile pack: ${key}`);
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
    role: 'core',
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
    role: 'core',
    primaryRole: 'core',
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

  profiles.lone_druid = makeProfile({
    id: 'lone_druid',
    displayName: 'Lone Druid',
    roles: ['Carry', 'Mid'],
    archetypes: ['dual_unit_core', 'tower_sieger', 'frontline_scaler'],
    draftTags: ['summons', 'split_push', 'tower_damage', 'durable_core'],
    vulnerabilities: ['control', 'burst', 'kite'],
    identity: 'Build the Spirit Bear into a durable siege unit, force defenders to answer side-lane pressure, and join only when the hero can survive the first commit.',
    basePower: { farm: 78, fight: 66, push: 88, survival: 61, initiation: 22, objective: 82, mobility: 48 },
    stageCurves: {
      early: { farm: 9, push: 12, objective: 7, fight: 2 },
      mid: { fight: 15, push: 18, objective: 17, survival: 8 },
      late: { fight: 9, push: 14, survival: 10, objective: 11 }
    },
    benchmarkPoints: [[5,350,5],[10,455,8],[15,540,12],[20,610,16],[30,675,22],[40,710,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'first Spirit Bear damage item before grouped tower defense begins',
      defensiveItem: 'hero survivability before committing both units to the same fight',
      objectiveTiming: 'tower or Roshan after the enemy shows on the opposite side',
      telemetryCaveat: 'current inventory telemetry may not distinguish hero items from Spirit Bear items'
    },
    telemetryLimitations: ['inventory_does_not_distinguish_spirit_bear'],
    buildPlans: [
      makePlan(ITEMS, 'lone_druid', CALIBRATION, { id:'balanced', name:'Spirit Bear damage tempo', scenarioTags:['balanced'], priority:84, itemKeys:['mask_of_madness','desolator','assault_cuirass','basher'], reasons:['balanced_draft'], optional:['bkb'], situational:['satanic'] }),
      makePlan(ITEMS, 'lone_druid', CALIBRATION, { id:'control_response', name:'Protected dual-unit siege', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, itemKeys:['mask_of_madness','bkb','assault_cuirass','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['desolator'], situational:['linken'] }),
      makePlan(ITEMS, 'lone_druid', CALIBRATION, { id:'recovery', name:'Bear-led economy recovery', scenarioTags:['player_behind'], priority:86, itemKeys:['hand_of_midas','mask_of_madness','desolator','bkb'], reasons:['player_behind'], optional:['assault_cuirass'], situational:['satanic'] }),
      makePlan(ITEMS, 'lone_druid', CALIBRATION, { id:'objective', name:'Spirit Bear building conversion', scenarioTags:['player_ahead','objective_window'], priority:96, itemKeys:['desolator','assault_cuirass','basher'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['satanic'] })
    ],
    spikes: [
      makeSpike(condition, 'lone_druid', CALIBRATION, { id:'level_6', name:'True Form survival window', priority:70, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'True Form must be ready before the enemy commits'},{type:'min_health_pct',value:0.55,message:'Do not start the siege while the hero is already chipped'}], permanent:{survival:9,fight:5}, window:{fight:12,objective:8}, actions:{FIGHT:11,OBJECTIVE:8,PRESSURE:8}, recommendation:'Use True Form to survive the first response while the Spirit Bear keeps hitting the priority target.' }),
      makeSpike(condition, 'lone_druid', CALIBRATION, { id:'level_12', name:'Second dual-unit scaling window', priority:78, trigger:[['level_gte',12]], expectedMinute:15, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, requires:[{type:'min_health_pct',value:0.6,message:'Reset the hero before committing both units'}], permanent:{fight:11,push:12,survival:8,objective:10}, window:{pressure:16,objective:13}, actions:{PRESSURE:17,OBJECTIVE:14,FIGHT:9}, recommendation:'Occupy one side of the map and force multiple heroes to answer before moving both units to the objective.' }),
      makeSpike(condition, 'lone_druid', CALIBRATION, { id:'desolator', name:'Spirit Bear armor-break timing', priority:89, trigger:[['item_owned',getItem(ITEMS,'desolator').id]], expectedMinute:16, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:330, fadeDurationSec:210, permanent:{push:18,objective:15,fight:8}, window:{pressure:22,objective:18}, actions:{PRESSURE:23,OBJECTIVE:19,FIGHT:8}, recommendation:'Hit buildings or Roshan while the enemy formation is split; avoid wasting the armor-break timing on a low-value chase.' }),
      makeSpike(condition, 'lone_druid', CALIBRATION, { id:'desolator_assault', name:'Desolator plus Assault siege peak', priority:98, trigger:[['item_owned',getItem(ITEMS,'desolator').id],['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:25, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:420, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Heal before starting the decisive siege'}], permanent:{fight:16,push:24,survival:14,objective:22}, window:{pressure:26,objective:24}, actions:{PRESSURE:27,OBJECTIVE:25,FIGHT:12}, recommendation:'Force a tower or Roshan immediately; keep the hero behind the bear and disengage if the enemy reaches the back line.' })
    ]
  }, benchmark);

  profiles.lycan = makeProfile({
    id: 'lycan',
    displayName: 'Lycan',
    roles: ['Offlane', 'Carry'],
    archetypes: ['summon_pusher', 'transformation_fighter', 'objective_core'],
    draftTags: ['summons', 'tower_damage', 'roshan', 'tempo'],
    vulnerabilities: ['control', 'kite', 'burst'],
    identity: 'Synchronize Shapeshift with controlled units to overwhelm one target, then convert the temporary movement and damage advantage into towers or Roshan.',
    basePower: { farm: 64, fight: 72, push: 86, survival: 58, initiation: 47, objective: 88, mobility: 68 },
    stageCurves: {
      early: { fight: 8, push: 10, objective: 9 },
      mid: { fight: 19, push: 19, objective: 21, mobility: 11 },
      late: { fight: -4, push: 8, objective: 7, survival: -3 }
    },
    benchmarkPoints: [[5,335,5],[10,430,8],[15,510,12],[20,575,16],[30,635,21],[40,670,25]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Helm of the Dominator before the first grouped objective', defensiveItem: 'BKB or Linken before Shapeshift can be chain-disabled', objectiveTiming: 'during Shapeshift with a controlled unit and a healthy wave' },
    buildPlans: [
      makePlan(ITEMS, 'lycan', CALIBRATION, { id:'balanced', name:'Helm transformation tempo', scenarioTags:['balanced'], priority:86, itemKeys:['helm_dominator','bkb','assault_cuirass'], reasons:['balanced_draft'], optional:['basher'], situational:['nullifier'] }),
      makePlan(ITEMS, 'lycan', CALIBRATION, { id:'control_response', name:'Protected Shapeshift access', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['helm_dominator','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['assault_cuirass'], situational:['nullifier'] }),
      makePlan(ITEMS, 'lycan', CALIBRATION, { id:'recovery', name:'Controlled-unit recovery', scenarioTags:['player_behind'], priority:84, itemKeys:['helm_dominator','sange_and_yasha','bkb'], reasons:['player_behind'], optional:['assault_cuirass'], situational:['basher'] }),
      makePlan(ITEMS, 'lycan', CALIBRATION, { id:'objective', name:'Summon-driven objective collapse', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['helm_dominator','assault_cuirass','nullifier'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['basher'] })
    ],
    spikes: [
      makeSpike(condition, 'lycan', CALIBRATION, { id:'level_6', name:'First Shapeshift hunt', priority:76, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1, lateToleranceMin:2.2, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Shapeshift must be ready'},{type:'min_health_pct',value:0.6,message:'Do not start the transformation window while low'}], permanent:{fight:8,mobility:8,initiation:5}, window:{fight:20,objective:11}, actions:{FIGHT:19,OBJECTIVE:11,CONNECT:10}, recommendation:'Use Shapeshift to remove a reachable core or support, then immediately hit the nearest objective.' }),
      makeSpike(condition, 'lycan', CALIBRATION, { id:'helm_dominator', name:'Controlled-unit map pressure', priority:86, trigger:[['item_owned',getItem(ITEMS,'helm_dominator').id]], expectedMinute:11, earlyToleranceMin:1.8, lateToleranceMin:3.2, activeDurationSec:330, fadeDurationSec:180, permanent:{farm:9,push:15,objective:14}, window:{pressure:18,objective:18}, actions:{PRESSURE:19,OBJECTIVE:19,FARM:7}, recommendation:'Keep the controlled unit alive, pressure a side lane, and arrive at the objective with the full pack.' }),
      makeSpike(condition, 'lycan', CALIBRATION, { id:'bkb', name:'Protected transformation timing', priority:93, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:19, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:220, requires:[{type:'ultimate_ready',message:'Shapeshift should be ready for the BKB fight'},{type:'min_health_pct',value:0.65,message:'Reset before the protected transformation'}], permanent:{fight:17,survival:22,mobility:5}, window:{fight:22,objective:16}, actions:{FIGHT:23,OBJECTIVE:17}, recommendation:'Use BKB to stay on the priority target through control and convert the kill before Shapeshift expires.' }),
      makeSpike(condition, 'lycan', CALIBRATION, { id:'helm_assault', name:'Helm plus Assault objective peak', priority:99, trigger:[['item_owned',getItem(ITEMS,'helm_dominator').id],['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:23, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Shapeshift must be available for the decisive objective'}], permanent:{fight:18,push:23,survival:12,objective:24}, window:{pressure:24,objective:27}, actions:{PRESSURE:24,OBJECTIVE:28,FIGHT:16}, recommendation:'Group the summons, activate Shapeshift, and force Roshan or a tower before the enemy can split your units.' })
    ]
  }, benchmark);

  profiles.natures_prophet = makeProfile({
    id: 'natures_prophet',
    displayName: "Nature's Prophet",
    roles: ['Offlane', 'Carry', 'Support'],
    archetypes: ['global_core', 'split_pusher', 'pickoff_connector'],
    draftTags: ['global', 'split_push', 'summons', 'pickoff'],
    vulnerabilities: ['control', 'burst', 'catch'],
    identity: 'Create a numbers advantage with global movement, pressure the lane farthest from the next objective, and teleport only after the enemy response becomes visible.',
    basePower: { farm: 76, fight: 59, push: 83, survival: 43, initiation: 45, objective: 71, mobility: 94 },
    stageCurves: {
      early: { farm: 8, push: 9, mobility: 13, fight: 3 },
      mid: { farm: 13, push: 16, mobility: 15, objective: 11, fight: 9 },
      late: { fight: 13, push: 13, objective: 10, survival: -3 }
    },
    benchmarkPoints: [[5,345,5],[10,460,8],[15,545,12],[20,615,16],[30,690,22],[40,735,26]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'first catch item before global rotations become grouped', defensiveItem: 'BKB or Linken before teleporting into visible control', objectiveTiming: 'after forcing a response on the opposite side of the map' },
    buildPlans: [
      makePlan(ITEMS, 'natures_prophet', CALIBRATION, { id:'balanced', name:'Global catch and wave pressure', scenarioTags:['balanced'], priority:84, itemKeys:['maelstrom','orchid','bkb'], reasons:['balanced_draft'], optional:['gleipnir'], situational:['bloodthorn'] }),
      makePlan(ITEMS, 'natures_prophet', CALIBRATION, { id:'control_response', name:'Safe teleport response', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, itemKeys:['maelstrom','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['hurricane_pike'], situational:['shadow_blade'] }),
      makePlan(ITEMS, 'natures_prophet', CALIBRATION, { id:'recovery', name:'Remote-lane recovery', scenarioTags:['player_behind'], priority:86, itemKeys:['maelstrom','shadow_blade','bkb'], reasons:['player_behind'], optional:['gleipnir'], situational:['linken'] }),
      makePlan(ITEMS, 'natures_prophet', CALIBRATION, { id:'objective', name:'Forced-response objective conversion', scenarioTags:['player_ahead','objective_window'], priority:96, itemKeys:['orchid','assault_cuirass','bkb'], reasons:['player_ahead','objective_window'], optional:['bloodthorn'], situational:['nullifier'] })
    ],
    spikes: [
      makeSpike(condition, 'natures_prophet', CALIBRATION, { id:'level_6', name:'First global damage window', priority:70, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'The global ultimate must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep enough mana for the global spell and teleport response'}], permanent:{fight:6,farm:5,objective:3}, window:{connect:15,pressure:10}, actions:{CONNECT:16,PRESSURE:10,FIGHT:8}, recommendation:'Use the global damage only when it enables a real rotation, lane shove, or objective instead of consuming it for empty farm.' }),
      makeSpike(condition, 'natures_prophet', CALIBRATION, { id:'orchid', name:'Teleport plus Orchid pickoff', priority:87, trigger:[['item_owned',getItem(ITEMS,'orchid').id]], expectedMinute:14, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, requires:[{type:'min_mana_pct',value:0.5,message:'Reserve mana for both teleport and the full pickoff sequence'}], permanent:{fight:11,initiation:13,mobility:5}, window:{connect:21,pressure:14}, actions:{CONNECT:22,FIGHT:15,PRESSURE:13}, recommendation:'Show in the remote lane, wait for a defender to isolate, then teleport to a confirmed Orchid target.' }),
      makeSpike(condition, 'natures_prophet', CALIBRATION, { id:'bkb', name:'Protected global arrival', priority:92, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:220, requires:[{type:'min_health_pct',value:0.65,message:'Do not teleport into the fight while already damaged'}], permanent:{fight:15,survival:22,mobility:4}, window:{fight:19,connect:18,objective:12}, actions:{FIGHT:19,CONNECT:19,OBJECTIVE:12}, recommendation:'Arrive after the first enemy spells are shown, use BKB to finish the priority target, and leave one lane pressured.' }),
      makeSpike(condition, 'natures_prophet', CALIBRATION, { id:'orchid_assault', name:'Global pickoff into armor objective', priority:98, trigger:[['item_owned',getItem(ITEMS,'orchid').id],['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:27, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.7,message:'Reset before forcing the high-value global conversion'}], permanent:{fight:19,push:22,survival:12,objective:20}, window:{pressure:24,objective:22,connect:17}, actions:{PRESSURE:25,OBJECTIVE:23,CONNECT:17}, recommendation:'Force a side-lane response, take the isolated kill, and convert the armor advantage into Roshan or high ground.' })
    ]
  }, benchmark);

  profiles.visage = makeProfile({
    id: 'visage',
    displayName: 'Visage',
    roles: ['Mid', 'Offlane', 'Support'],
    archetypes: ['familiar_controller', 'tower_pusher', 'durable_burst_core'],
    draftTags: ['summons', 'burst', 'tower_damage', 'teamfight'],
    vulnerabilities: ['control', 'kite', 'burst'],
    identity: 'Use Familiars to create repeated stun and tower-pressure cycles while preserving Gravekeeper protection before the enemy commits.',
    basePower: { farm: 58, fight: 75, push: 81, survival: 70, initiation: 49, objective: 78, mobility: 40 },
    stageCurves: {
      early: { fight: 8, push: 6, survival: 9 },
      mid: { fight: 19, push: 17, objective: 18, survival: 10, initiation: 7 },
      late: { fight: 6, push: 8, objective: 7, survival: 4 }
    },
    benchmarkPoints: [[5,320,5],[10,405,8],[15,480,12],[20,535,16],[30,595,21],[40,630,25]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'first Familiar-enhancing utility item before the enemy groups', defensiveItem: 'BKB or positioning tool before repeated area control', objectiveTiming: 'with Familiars alive and enough health to preserve Gravekeeper protection' },
    buildPlans: [
      makePlan(ITEMS, 'visage', CALIBRATION, { id:'balanced', name:'Familiar utility tempo', scenarioTags:['balanced'], priority:86, itemKeys:['solar_crest','scepter','assault_cuirass'], reasons:['balanced_draft'], optional:['orchid'], situational:['bkb'] }),
      makePlan(ITEMS, 'visage', CALIBRATION, { id:'control_response', name:'Protected Familiar cycle', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['solar_crest','bkb','scepter'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['assault_cuirass'], situational:['linken'] }),
      makePlan(ITEMS, 'visage', CALIBRATION, { id:'recovery', name:'Low-risk Familiar recovery', scenarioTags:['player_behind'], priority:85, itemKeys:['solar_crest','orchid','bkb'], reasons:['player_behind'], optional:['scepter'], situational:['linken'] }),
      makePlan(ITEMS, 'visage', CALIBRATION, { id:'objective', name:'Familiar tower collapse', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['solar_crest','assault_cuirass','nullifier'], reasons:['player_ahead','objective_window'], optional:['scepter'], situational:['bkb'] })
    ],
    spikes: [
      makeSpike(condition, 'visage', CALIBRATION, { id:'level_6', name:'First Familiar control window', priority:78, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1, lateToleranceMin:2.2, activeDurationSec:210, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Familiars must be available'},{type:'min_mana_pct',value:0.4,message:'Keep enough mana for the first burst and control cycle'}], permanent:{fight:10,push:9,initiation:7,objective:7}, window:{fight:19,pressure:14}, actions:{FIGHT:18,PRESSURE:14,OBJECTIVE:9}, recommendation:'Use the first Familiar cycle to secure a kill or remove the lane defender, then damage the tower before the response arrives.' }),
      makeSpike(condition, 'visage', CALIBRATION, { id:'solar_crest', name:'Solar Crest Familiar acceleration', priority:86, trigger:[['item_owned',getItem(ITEMS,'solar_crest').id]], expectedMinute:12, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:330, fadeDurationSec:180, permanent:{fight:9,push:14,objective:13,survival:5}, window:{pressure:19,objective:18}, actions:{PRESSURE:20,OBJECTIVE:19,FIGHT:9}, recommendation:'Buff the unit or ally that will remain on the objective and preserve the Familiar stun for the enemy response.' }),
      makeSpike(condition, 'visage', CALIBRATION, { id:'scepter', name:'Scepter access and pickoff timing', priority:91, trigger:[['item_owned',getItem(ITEMS,'scepter').id]], expectedMinute:18, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:330, fadeDurationSec:210, requires:[{type:'min_mana_pct',value:0.5,message:'Do not start the pickoff route without spell mana'}], permanent:{fight:16,initiation:13,mobility:12}, window:{connect:20,fight:18}, actions:{CONNECT:21,FIGHT:18,PRESSURE:8}, recommendation:'Approach from an unseen angle, land the first control cycle, and leave before the enemy can remove Gravekeeper protection.' }),
      makeSpike(condition, 'visage', CALIBRATION, { id:'solar_assault', name:'Solar Crest plus Assault siege peak', priority:99, trigger:[['item_owned',getItem(ITEMS,'solar_crest').id],['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:25, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:420, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.7,message:'Preserve health before the decisive Familiar siege'}], permanent:{fight:18,push:24,survival:16,objective:23}, window:{pressure:26,objective:26}, actions:{PRESSURE:27,OBJECTIVE:27,FIGHT:13}, recommendation:'Take Roshan or a tower with Familiars alive, then reset before their deaths turn the advantage into downtime.' })
    ]
  }, benchmark);

  profiles.kez = makeProfile({
    id: 'kez',
    displayName: 'Kez',
    roles: ['Carry', 'Mid'],
    archetypes: ['mobile_flex_core', 'single_target_skirmisher', 'item_timing_core'],
    draftTags: ['mobility', 'right_click', 'pickoff', 'tempo'],
    vulnerabilities: ['control', 'burst', 'kite'],
    identity: 'Use mobility and flexible combat sequencing to finish a reachable target, then disengage before the enemy can layer control; ability-specific advice remains deliberately conservative.',
    basePower: { farm: 68, fight: 73, push: 55, survival: 49, initiation: 66, objective: 55, mobility: 79 },
    stageCurves: {
      early: { fight: 9, mobility: 9, initiation: 5 },
      mid: { fight: 17, initiation: 13, mobility: 11, objective: 7 },
      late: { fight: 10, survival: 7, push: 5 }
    },
    benchmarkPoints: [[5,345,5],[10,455,8],[15,540,12],[20,610,16],[30,680,22],[40,720,26]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'first reliable target-control item before grouped fights', defensiveItem: 'BKB or Linken before entering layered disables', objectiveTiming: 'after a confirmed pickoff rather than through an unverified ability interaction', calibrationBoundary: 'do not infer stance- or ability-specific mechanics until live data confirms them' },
    calibration: KEZ_CALIBRATION,
    telemetryLimitations: ['ability_specific_state_not_available'],
    buildPlans: [
      makePlan(ITEMS, 'kez', KEZ_CALIBRATION, { id:'balanced', name:'Conservative control-to-damage tempo', scenarioTags:['balanced'], priority:82, itemKeys:['diffusal','bkb','basher'], reasons:['balanced_draft'], optional:['satanic'], situational:['nullifier'] }),
      makePlan(ITEMS, 'kez', KEZ_CALIBRATION, { id:'control_response', name:'Protected target access', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, itemKeys:['diffusal','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['sange_and_yasha'], situational:['satanic'] }),
      makePlan(ITEMS, 'kez', KEZ_CALIBRATION, { id:'recovery', name:'Wave-clear recovery into defense', scenarioTags:['player_behind'], priority:85, itemKeys:['maelstrom','bkb','satanic'], reasons:['player_behind'], optional:['gleipnir'], situational:['linken'] }),
      makePlan(ITEMS, 'kez', KEZ_CALIBRATION, { id:'objective', name:'Pickoff-to-objective conversion', scenarioTags:['player_ahead','objective_window'], priority:94, itemKeys:['diffusal','nullifier','bkb'], reasons:['player_ahead','objective_window'], optional:['basher'], situational:['satanic'] })
    ],
    spikes: [
      makeSpike(condition, 'kez', KEZ_CALIBRATION, { id:'level_6', name:'First ultimate-level combat window', priority:68, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'The ultimate-level combat option must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep enough mana for the full disengage sequence'}], permanent:{fight:7,initiation:6,mobility:5}, window:{fight:15,connect:11}, actions:{FIGHT:14,CONNECT:12}, recommendation:'Commit only to a reachable isolated target and preserve a disengage route; do not assume unverified ability interactions.' }),
      makeSpike(condition, 'kez', KEZ_CALIBRATION, { id:'diffusal', name:'First reliable target-control item', priority:82, trigger:[['item_owned',getItem(ITEMS,'diffusal').id]], expectedMinute:13, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, requires:[{type:'min_health_pct',value:0.6,message:'Do not start the pickoff while too low to exit'}], permanent:{fight:12,initiation:12,mobility:5}, window:{fight:18,connect:17}, actions:{FIGHT:18,CONNECT:18,PRESSURE:7}, recommendation:'Use the item slow to confirm target access, finish one hero, and leave before secondary disables arrive.' }),
      makeSpike(condition, 'kez', KEZ_CALIBRATION, { id:'bkb', name:'Protected skirmish timing', priority:91, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:220, requires:[{type:'min_health_pct',value:0.65,message:'Reset before the protected fight'}], permanent:{fight:17,survival:23,initiation:5}, window:{fight:21,objective:11}, actions:{FIGHT:22,OBJECTIVE:11}, recommendation:'Use BKB to complete one high-value kill, then convert the numbers advantage instead of extending into uncertain mechanics.' }),
      makeSpike(condition, 'kez', KEZ_CALIBRATION, { id:'diffusal_bkb', name:'Control plus protection breakpoint', priority:96, trigger:[['item_owned',getItem(ITEMS,'diffusal').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:22, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.7,message:'Start the two-item timing from healthy resources'}], permanent:{fight:20,survival:18,initiation:15,objective:9}, window:{fight:24,connect:20,objective:14}, actions:{FIGHT:24,CONNECT:20,OBJECTIVE:14}, recommendation:'Take a controlled skirmish around vision, eliminate the first target, and stop before the fight becomes an unverified extended sequence.' })
    ]
  }, benchmark);

  profiles.windranger = makeProfile({
    id: 'windranger',
    displayName: 'Windranger',
    roles: ['Mid', 'Offlane', 'Support'],
    archetypes: ['mobile_pickoff_core', 'single_target_damage', 'ranged_initiator'],
    draftTags: ['pickoff', 'ranged_core', 'mobility', 'control'],
    vulnerabilities: ['control', 'burst', 'save'],
    identity: 'Create a clean Shackleshot or allied-control entry, use Focus Fire on one confirmed target, and reposition before the enemy can trade onto the back line.',
    basePower: { farm: 67, fight: 76, push: 62, survival: 59, initiation: 58, objective: 60, mobility: 83 },
    stageCurves: {
      early: { fight: 7, mobility: 10, initiation: 5 },
      mid: { fight: 19, initiation: 13, mobility: 12, objective: 8 },
      late: { fight: 13, push: 9, survival: 7, objective: 7 }
    },
    benchmarkPoints: [[5,345,5],[10,455,8],[15,540,12],[20,605,16],[30,675,22],[40,715,26]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Maelstrom or first control item before grouped skirmishes', defensiveItem: 'BKB or Linken before committing Focus Fire into reliable disables', objectiveTiming: 'after removing one defender with Focus Fire' },
    buildPlans: [
      makePlan(ITEMS, 'windranger', CALIBRATION, { id:'balanced', name:'Maelstrom pickoff tempo', scenarioTags:['balanced'], priority:85, itemKeys:['maelstrom','gleipnir','bkb'], reasons:['balanced_draft'], optional:['scepter'], situational:['daedalus'] }),
      makePlan(ITEMS, 'windranger', CALIBRATION, { id:'control_response', name:'Protected Focus Fire access', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['maelstrom','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['hurricane_pike'], situational:['scepter'] }),
      makePlan(ITEMS, 'windranger', CALIBRATION, { id:'recovery', name:'Safe wave and pickoff recovery', scenarioTags:['player_behind'], priority:85, itemKeys:['maelstrom','blink','bkb'], reasons:['player_behind'], optional:['gleipnir'], situational:['linken'] }),
      makePlan(ITEMS, 'windranger', CALIBRATION, { id:'objective', name:'Rooted target objective conversion', scenarioTags:['player_ahead','objective_window'], priority:96, itemKeys:['gleipnir','bkb','daedalus'], reasons:['player_ahead','objective_window'], optional:['scepter'], situational:['hurricane_pike'] })
    ],
    spikes: [
      makeSpike(condition, 'windranger', CALIBRATION, { id:'level_6', name:'First Focus Fire kill window', priority:74, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.1, lateToleranceMin:2.4, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Focus Fire must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep enough mana for control, damage, and escape'}], permanent:{fight:8,objective:4}, window:{fight:19,connect:11}, actions:{FIGHT:18,CONNECT:11,PRESSURE:7}, recommendation:'Use Focus Fire only after the target is controlled or committed; preserve mobility for the exit.' }),
      makeSpike(condition, 'windranger', CALIBRATION, { id:'maelstrom', name:'Maelstrom Focus Fire damage timing', priority:84, trigger:[['item_owned',getItem(ITEMS,'maelstrom').id]], expectedMinute:12, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, requires:[{type:'ultimate_ready',message:'Focus Fire should be ready for the item timing'},{type:'min_mana_pct',value:0.5,message:'Refill mana before starting the pickoff'}], permanent:{farm:9,fight:12,push:7}, window:{fight:19,pressure:10}, actions:{FIGHT:19,CONNECT:13,PRESSURE:9}, recommendation:'Convert Maelstrom into a confirmed Focus Fire kill, then clear the next wave instead of chasing deep.' }),
      makeSpike(condition, 'windranger', CALIBRATION, { id:'gleipnir', name:'Gleipnir setup breakpoint', priority:91, trigger:[['item_owned',getItem(ITEMS,'gleipnir').id]], expectedMinute:18, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:330, fadeDurationSec:210, requires:[{type:'ultimate_ready',message:'Focus Fire must be ready for the root setup'}], permanent:{fight:16,initiation:16,push:8}, window:{fight:22,connect:18,objective:10}, actions:{FIGHT:22,CONNECT:19,OBJECTIVE:10}, recommendation:'Root the target before Focus Fire, keep the fight narrow, and convert the first kill into vision or an objective.' }),
      makeSpike(condition, 'windranger', CALIBRATION, { id:'gleipnir_bkb', name:'Gleipnir plus BKB execution peak', priority:98, trigger:[['item_owned',getItem(ITEMS,'gleipnir').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:24, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Focus Fire must be ready for the decisive target'},{type:'min_health_pct',value:0.65,message:'Do not start the execution window while chipped'}], permanent:{fight:22,survival:21,initiation:17,objective:12}, window:{fight:25,connect:20,objective:17}, actions:{FIGHT:26,CONNECT:20,OBJECTIVE:17}, recommendation:'Lock one high-value target, use BKB to finish the channel of damage, and immediately turn the numbers lead into Roshan or a tower.' })
    ]
  }, benchmark);

  return profiles;
}
