import { ARC_CALIBRATION, MORPH_CALIBRATION, getItem, makePlan, makeProfile, makeSpike } from './legacy_carry_profile_pack_3_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.arc_warden = makeProfile({
    id: 'arc_warden',
    displayName: 'Arc Warden',
    roles: ['Carry', 'Mid'],
    archetypes: ['clone_controller', 'split_pusher', 'ranged_scaler'],
    draftTags: ['global_pressure', 'split_push', 'ranged_damage', 'late_game'],
    vulnerabilities: ['gap_close', 'tempo', 'control'],
    identity: 'Use Tempest Double to create a second economy and pressure lane without exposing the real hero, then teleport into a numbers advantage only after enemy movement is committed.',
    basePower: { farm: 86, fight: 57, push: 88, survival: 43, initiation: 38, objective: 68, mobility: 55 },
    stageCurves: {
      early: { farm: 2, fight: -9, push: -4, survival: -4 },
      mid: { farm: 19, push: 21, mobility: 13, objective: 9 },
      late: { fight: 18, push: 17, objective: 13, survival: 7 }
    },
    benchmarkPoints: [[5,345,5],[10,455,8],[15,550,12],[20,625,16],[30,715,22],[40,760,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Midas or Maelstrom early enough for Tempest Double to accelerate a second safe resource route',
      defensiveItem: 'BKB or Linken before the real hero can be reached through instant gap close',
      objectiveTiming: 'after clone pressure forces a defender away or after a global teleport creates numbers',
      telemetryCaveat: 'Tempest Double state, inventory, position and teleport destination are not available'
    },
    telemetryLimitations: ['tempest_double_state_not_available', 'clone_inventory_not_separate', 'safe_teleport_destination_not_available'],
    calibration: ARC_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'arc_warden', ARC_CALIBRATION, { id:'balanced', name:'Double economy into global pressure', scenarioTags:['balanced'], priority:86, itemKeys:['hand_of_midas','maelstrom','travel_boots','gleipnir'], reasons:['balanced_draft'], optional:['daedalus'], situational:['bkb'] }),
      makePlan(ITEMS, 'arc_warden', ARC_CALIBRATION, { id:'control_response', name:'Protected real-hero positioning', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['maelstrom','bkb','linken','gleipnir'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['travel_boots'], situational:['skadi'] }),
      makePlan(ITEMS, 'arc_warden', ARC_CALIBRATION, { id:'recovery', name:'Clone-led safe economy recovery', scenarioTags:['player_behind'], priority:91, itemKeys:['hand_of_midas','maelstrom','travel_boots','manta'], reasons:['player_behind'], optional:['gleipnir'], situational:['bkb'], avoidWhen:['enemy_can_repeatedly_find_real_hero'] }),
      makePlan(ITEMS, 'arc_warden', ARC_CALIBRATION, { id:'objective', name:'Split reaction objective conversion', scenarioTags:['player_ahead','objective_window'], priority:96, itemKeys:['maelstrom','travel_boots','gleipnir','daedalus'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['butterfly'], requiredSignals:['enemy_reaction_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'arc_warden', ARC_CALIBRATION, { id:'level_6', name:'First Tempest Double economy window', priority:67, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:210, fadeDurationSec:150, requires:[{type:'ultimate_ready',message:'Tempest Double must be ready'},{type:'min_health_pct',value:0.55,message:'Keep the real hero healthy before splitting resources'}], permanent:{farm:9,push:7}, window:{farm:16,pressure:10}, actions:{FARM:17,PRESSURE:10}, recommendation:'Send the clone to the riskier resource while the real hero remains on a protected route.' }),
      makeSpike(condition, 'arc_warden', ARC_CALIBRATION, { id:'midas', name:'Double Midas economy', priority:76, trigger:[['item_owned',getItem(ITEMS,'hand_of_midas').id]], expectedMinute:10.5, earlyToleranceMin:1.8, lateToleranceMin:3, activeDurationSec:360, fadeDurationSec:210, permanent:{farm:23}, window:{farm:21}, actions:{FARM:24}, recommendation:'Use both Midas activations efficiently and avoid grouping without a concrete objective.' }),
      makeSpike(condition, 'arc_warden', ARC_CALIBRATION, { id:'maelstrom', name:'Tempest Double lane pressure', priority:87, trigger:[['item_owned',getItem(ITEMS,'maelstrom').id]], expectedMinute:16, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:360, fadeDurationSec:220, permanent:{farm:17,push:20}, window:{pressure:23,farm:9}, actions:{PRESSURE:24,FARM:9}, recommendation:'Push the dangerous lane with the clone and keep the real hero near safe farm or the next teleport response.' }),
      makeSpike(condition, 'arc_warden', ARC_CALIBRATION, { id:'travel', name:'Global split-map timing', priority:96, trigger:[['item_owned',getItem(ITEMS,'travel_boots').id]], expectedMinute:21, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:420, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Do not teleport the real hero into a fight while chipped'}], permanent:{mobility:25,push:20,objective:9}, window:{pressure:26,objective:13,connect:15}, actions:{PRESSURE:27,OBJECTIVE:13,CONNECT:15}, recommendation:'Force a reaction with the clone, then teleport the real hero only when the destination creates a clear numbers advantage.' })
    ]
  }, benchmark);

  profiles.morphling = makeProfile({
    id: 'morphling',
    displayName: 'Morphling',
    roles: ['Carry', 'Mid'],
    archetypes: ['attribute_carry', 'mobile_burst_core', 'adaptive_scaler'],
    draftTags: ['mobility', 'burst', 'late_game', 'adaptive_damage'],
    vulnerabilities: ['silence', 'instant_disable', 'burst'],
    identity: 'Keep enough strength to survive instant control, use Waveform as an exit or finishing angle rather than automatic entry, and commit agility only after the enemy disable sequence is visible.',
    basePower: { farm: 70, fight: 77, push: 57, survival: 73, initiation: 66, objective: 55, mobility: 82 },
    stageCurves: {
      early: { fight: -7, survival: -4, farm: 1 },
      mid: { farm: 12, fight: 17, mobility: 13, initiation: 9 },
      late: { fight: 21, survival: 17, push: 8, objective: 8 }
    },
    benchmarkPoints: [[5,340,5],[10,445,8],[15,530,12],[20,600,16],[30,690,22],[40,745,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Manta before silences and roots repeatedly prevent Attribute Shift or Waveform exits',
      defensiveItem: 'Linken or BKB before committing high agility into instant disable',
      objectiveTiming: 'after a burst pickoff or when defensive cooldowns remain for the counter-initiation',
      telemetryCaveat: 'current strength/agility distribution, copied hero and Waveform path are unavailable'
    },
    telemetryLimitations: ['attribute_shift_state_not_available', 'morph_target_not_available', 'waveform_path_not_available'],
    calibration: MORPH_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'morphling', MORPH_CALIBRATION, { id:'balanced', name:'Adaptive Manta damage scaling', scenarioTags:['balanced'], priority:87, itemKeys:['manta','linken','daedalus','satanic'], reasons:['balanced_draft'], optional:['butterfly'], situational:['skadi'] }),
      makePlan(ITEMS, 'morphling', MORPH_CALIBRATION, { id:'control_response', name:'Protected Attribute Shift commitment', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['manta','bkb','linken','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['skadi'], situational:['butterfly'] }),
      makePlan(ITEMS, 'morphling', MORPH_CALIBRATION, { id:'recovery', name:'Waveform-safe economy recovery', scenarioTags:['player_behind'], priority:90, itemKeys:['manta','linken','butterfly','satanic'], reasons:['player_behind'], optional:['bkb'], situational:['skadi'], avoidWhen:['instant_disable_is_unaccounted_for'] }),
      makePlan(ITEMS, 'morphling', MORPH_CALIBRATION, { id:'objective', name:'Burst pickoff objective conversion', scenarioTags:['player_ahead','objective_window'], priority:95, itemKeys:['manta','daedalus','satanic','butterfly'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['skadi'], requiredSignals:['priority_disable_used'] })
    ],
    spikes: [
      makeSpike(condition, 'morphling', MORPH_CALIBRATION, { id:'level_6', name:'First Morph adaptation window', priority:63, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.7, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Morph must be ready for the adaptation attempt'},{type:'min_health_pct',value:0.6,message:'Do not copy a target while already vulnerable to burst'}], permanent:{fight:7,initiation:5}, window:{fight:12,connect:9}, actions:{FIGHT:12,CONNECT:9}, recommendation:'Copy only a useful spell set and keep Waveform available to disengage from the first response.' }),
      makeSpike(condition, 'morphling', MORPH_CALIBRATION, { id:'manta', name:'Manta dispel and Waveform pressure', priority:82, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:18, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:330, fadeDurationSec:210, requires:[{type:'min_health_pct',value:0.58,message:'Keep a survivable strength buffer before showing on a dangerous lane'}], permanent:{farm:13,survival:15,push:11}, window:{pressure:14,fight:11}, actions:{PRESSURE:14,CONNECT:11,FIGHT:9}, recommendation:'Pressure a lane only while Manta dispel and a Waveform exit are available.' }),
      makeSpike(condition, 'morphling', MORPH_CALIBRATION, { id:'linken', name:"Linken's Sphere safety window", priority:90, trigger:[['item_owned',getItem(ITEMS,'linken').id]], expectedMinute:23, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:360, fadeDurationSec:230, requires:[{type:'min_health_pct',value:0.62,message:'Linken does not replace a safe strength buffer'}], permanent:{survival:25,fight:11}, window:{fight:17,pressure:11}, actions:{FIGHT:18,PRESSURE:11}, recommendation:'Take the aggressive angle against one key targeted disable, but leave before multiple controls can overlap.' }),
      makeSpike(condition, 'morphling', MORPH_CALIBRATION, { id:'satanic', name:'Satanic full-commit timing', priority:98, trigger:[['item_owned',getItem(ITEMS,'satanic').id]], expectedMinute:32, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:420, fadeDurationSec:260, requires:[{type:'min_health_pct',value:0.65,message:'Enter the decisive fight with enough health to activate Satanic'}], permanent:{fight:26,survival:24,objective:9}, window:{fight:24,objective:12}, actions:{FIGHT:26,OBJECTIVE:12}, recommendation:'Accept a longer fight after instant disable is committed; do not spend Waveform only to begin the engagement.' })
    ]
  }, benchmark);

  return profiles;
}
