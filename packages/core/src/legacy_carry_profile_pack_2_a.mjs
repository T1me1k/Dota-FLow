import { CALIBRATION, POSITIONING_CALIBRATION, getItem, makePlan, makeSpike, makeProfile } from './legacy_carry_profile_pack_2_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.drow_ranger = makeProfile({
    id: 'drow_ranger',
    displayName: 'Drow Ranger',
    roles: ['Carry'],
    archetypes: ['ranged_carry', 'backline_siege', 'positioning_core'],
    draftTags: ['ranged_damage', 'silence', 'siege', 'late_game'],
    vulnerabilities: ['gap_close', 'burst', 'control'],
    identity: 'Win fights by preserving Marksmanship distance: pressure lanes from range, force the enemy to spend gap-close tools, then commit defensive items only after the first jump is visible.',
    basePower: { farm: 68, fight: 70, push: 79, survival: 39, initiation: 25, objective: 68, mobility: 41 },
    stageCurves: {
      early: { fight: -2, survival: -6, push: 4 },
      mid: { farm: 11, fight: 15, push: 16, objective: 10 },
      late: { fight: 20, push: 14, objective: 12, survival: 5 }
    },
    benchmarkPoints: [[5,345,5],[10,455,8],[15,540,12],[20,610,16],[30,705,22],[40,750,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Dragon Lance or Manta before enemy initiators can repeatedly reach the back line',
      defensiveItem: 'Hurricane Pike or BKB before committing to grouped objective fights',
      objectiveTiming: 'after the first gap-close spell is spent or while allied vision protects a long firing lane',
      telemetryCaveat: 'enemy mobility cooldowns and exact Marksmanship disable distance are not observable'
    },
    telemetryLimitations: ['enemy_gap_close_cooldowns_not_available', 'marksmanship_distance_not_observed'],
    calibration: POSITIONING_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'drow_ranger', POSITIONING_CALIBRATION, { id:'balanced', name:'Long-range Manta positioning', scenarioTags:['balanced'], priority:86, itemKeys:['dragon_lance','manta','hurricane_pike','butterfly'], reasons:['balanced_draft'], optional:['daedalus'], situational:['bkb'] }),
      makePlan(ITEMS, 'drow_ranger', POSITIONING_CALIBRATION, { id:'control_response', name:'Protected backline firing window', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['dragon_lance','bkb','hurricane_pike','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['manta'], situational:['linken'] }),
      makePlan(ITEMS, 'drow_ranger', POSITIONING_CALIBRATION, { id:'recovery', name:'Safe ranged economy recovery', scenarioTags:['player_behind'], priority:88, itemKeys:['dragon_lance','manta','hurricane_pike','butterfly'], reasons:['player_behind'], optional:['bkb'], situational:['satanic'], avoidWhen:['enemy_controls_all_long_firing_lanes'] }),
      makePlan(ITEMS, 'drow_ranger', POSITIONING_CALIBRATION, { id:'objective', name:'Protected high-ground siege', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['dragon_lance','hurricane_pike','bkb','daedalus'], reasons:['player_ahead','objective_window'], optional:['butterfly'], situational:['satanic'], requiredSignals:['frontline_ready','vision_ready'] })
    ],
    spikes: [
      makeSpike(condition, 'drow_ranger', POSITIONING_CALIBRATION, { id:'level_6', name:'First Marksmanship lane pressure', priority:58, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Marksmanship must be skilled and active'},{type:'min_health_pct',value:0.55,message:'Do not pressure while already vulnerable to a jump'}], permanent:{fight:7,farm:5,push:6}, window:{pressure:12,fight:8}, actions:{PRESSURE:12,FARM:6,FIGHT:7}, recommendation:'Use the range advantage to chip the tower and disengage before the enemy closes the distance.' }),
      makeSpike(condition, 'drow_ranger', POSITIONING_CALIBRATION, { id:'manta', name:'Manta lane-control timing', priority:80, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:18, earlyToleranceMin:2.2, lateToleranceMin:3.8, activeDurationSec:300, fadeDurationSec:210, permanent:{farm:11,push:16,survival:13}, window:{pressure:17,fight:10}, actions:{PRESSURE:18,FARM:10,CONNECT:9}, recommendation:'Use illusions to expose defenders while the real hero stays behind the protected firing line.' }),
      makeSpike(condition, 'drow_ranger', POSITIONING_CALIBRATION, { id:'pike_bkb', name:'Pike plus BKB positioning window', priority:96, trigger:[['item_owned',getItem(ITEMS,'hurricane_pike').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:27, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Reset before the decisive backline fight'}], permanent:{fight:23,survival:25,push:8}, window:{fight:24,objective:14}, actions:{FIGHT:25,OBJECTIVE:14,CONNECT:12}, recommendation:'Force the objective while both defensive repositioning tools are fresh, and save Pike for the first committed jump.' }),
      makeSpike(condition, 'drow_ranger', POSITIONING_CALIBRATION, { id:'daedalus', name:'Daedalus protected siege peak', priority:98, trigger:[['item_owned',getItem(ITEMS,'daedalus').id]], expectedMinute:32, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:420, fadeDurationSec:260, permanent:{fight:25,push:18,objective:16}, window:{fight:20,pressure:20,objective:17}, actions:{FIGHT:22,PRESSURE:21,OBJECTIVE:18}, recommendation:'Stand behind vision and frontline, remove the closest target, then convert the damage advantage into buildings.' })
    ]
  }, benchmark);

  profiles.lifestealer = makeProfile({
    id: 'lifestealer',
    displayName: 'Lifestealer',
    roles: ['Carry'],
    archetypes: ['durable_carry', 'anti_frontline', 'infest_initiator'],
    draftTags: ['spell_immunity', 'sustain', 'frontline_damage', 'pickoff'],
    vulnerabilities: ['kite', 'armor', 'disengage'],
    identity: 'Attack durable frontliners only when Rage or an Infest delivery closes the distance, then convert the protected contact into Roshan or towers before the enemy can reset and kite again.',
    basePower: { farm: 61, fight: 76, push: 58, survival: 84, initiation: 55, objective: 73, mobility: 43 },
    stageCurves: {
      early: { fight: 8, survival: 10, farm: -2 },
      mid: { fight: 18, survival: 14, objective: 12, initiation: 9 },
      late: { fight: 10, survival: 9, objective: 8, mobility: -3 }
    },
    benchmarkPoints: [[5,340,5],[10,440,8],[15,520,12],[20,585,16],[30,670,22],[40,715,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Armlet or Radiance before the enemy can permanently kite every Rage window',
      defensiveItem: 'BKB, Manta or Linken only when Rage alone cannot cover layered control',
      objectiveTiming: 'after a successful Infest entry or when Rage lets Lifestealer stay on Roshan through contest',
      telemetryCaveat: 'Infest host position and enemy defensive dispels are not observable'
    },
    telemetryLimitations: ['infest_host_position_not_available', 'enemy_defensive_dispels_not_available'],
    buildPlans: [
      makePlan(ITEMS, 'lifestealer', CALIBRATION, { id:'balanced', name:'Armlet frontline pressure', scenarioTags:['balanced'], priority:87, itemKeys:['armlet','desolator','basher','satanic'], reasons:['balanced_draft'], optional:['bkb'], situational:['assault_cuirass'] }),
      makePlan(ITEMS, 'lifestealer', CALIBRATION, { id:'control_response', name:'Layered-control survival route', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, itemKeys:['armlet','bkb','manta','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['basher'] }),
      makePlan(ITEMS, 'lifestealer', CALIBRATION, { id:'recovery', name:'Radiance split recovery', scenarioTags:['player_behind'], priority:89, itemKeys:['radiance','manta','basher','satanic'], reasons:['player_behind'], optional:['bkb'], situational:['assault_cuirass'], avoidWhen:['enemy_has_early_radiance_punish'] }),
      makePlan(ITEMS, 'lifestealer', CALIBRATION, { id:'objective', name:'Desolator Roshan conversion', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['armlet','desolator','basher','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['satanic'], requiredSignals:['infest_delivery_or_frontline_contact'] })
    ],
    spikes: [
      makeSpike(condition, 'lifestealer', CALIBRATION, { id:'level_6', name:'First Infest delivery window', priority:66, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Infest must be ready'},{type:'min_health_pct',value:0.55,message:'Do not start the delivery while already low'}], permanent:{fight:6,initiation:8,survival:5}, window:{fight:16,connect:14}, actions:{FIGHT:16,CONNECT:14}, recommendation:'Use Infest with a reliable delivery hero or as a reset; do not walk through vision into a kite composition.' }),
      makeSpike(condition, 'lifestealer', CALIBRATION, { id:'armlet', name:'Armlet lane-break timing', priority:74, trigger:[['item_owned',getItem(ITEMS,'armlet').id]], expectedMinute:11, earlyToleranceMin:1.5, lateToleranceMin:3, activeDurationSec:270, fadeDurationSec:180, requires:[{type:'min_health_pct',value:0.55,message:'Stabilize health before toggling into a long chase'}], permanent:{fight:15,survival:11,objective:5}, window:{fight:17,pressure:9}, actions:{FIGHT:17,PRESSURE:9}, recommendation:'Force short contact on a reachable target, then hit the nearby tower instead of extending into a kite path.' }),
      makeSpike(condition, 'lifestealer', CALIBRATION, { id:'desolator', name:'Desolator objective timing', priority:88, trigger:[['item_owned',getItem(ITEMS,'desolator').id]], expectedMinute:17, earlyToleranceMin:2, lateToleranceMin:3.8, activeDurationSec:330, fadeDurationSec:210, permanent:{fight:16,push:13,objective:21}, window:{objective:22,fight:15}, actions:{OBJECTIVE:23,FIGHT:15,PRESSURE:10}, recommendation:'Convert Rage-protected damage into Roshan or outer towers before armor items reduce the timing.' }),
      makeSpike(condition, 'lifestealer', CALIBRATION, { id:'bkb', name:'Rage plus BKB sustained contact', priority:97, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:23, earlyToleranceMin:2.8, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Heal before the protected commitment'}], permanent:{fight:21,survival:27,objective:10}, window:{fight:24,objective:14}, actions:{FIGHT:25,OBJECTIVE:15,CONNECT:13}, recommendation:'Use the double protection to stay on the priority core, then immediately convert the won contact into an objective.' })
    ]
  }, benchmark);

  return profiles;
}
