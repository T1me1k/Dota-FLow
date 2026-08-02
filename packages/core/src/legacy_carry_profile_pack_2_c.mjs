import { CALIBRATION, getItem, makePlan, makeSpike, makeProfile } from './legacy_carry_profile_pack_2_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.gyrocopter = makeProfile({
    id: 'gyrocopter',
    displayName: 'Gyrocopter',
    roles: ['Carry'],
    archetypes: ['ranged_teamfight_carry', 'flash_farmer', 'aoe_damage_core'],
    draftTags: ['aoe_damage', 'teamfight', 'ranged_damage', 'tempo'],
    vulnerabilities: ['burst', 'range', 'single_target_disable'],
    identity: 'Accelerate with area damage, enter fights after enemy formation compresses, and keep enough defensive uptime to deliver a full Flak Cannon cycle before converting the spread damage into an objective.',
    basePower: { farm: 76, fight: 78, push: 61, survival: 52, initiation: 37, objective: 66, mobility: 47 },
    stageCurves: {
      early: { fight: 7, farm: 4 },
      mid: { farm: 16, fight: 20, objective: 11, push: 8 },
      late: { fight: 15, survival: 10, objective: 9, range: -3 }
    },
    benchmarkPoints: [[5,350,5],[10,460,8],[15,550,12],[20,620,16],[30,705,22],[40,750,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Aghanim or first major damage item before enemy range and saves split the fight',
      defensiveItem: 'BKB before committing to a full Flak Cannon cycle inside layered control',
      objectiveTiming: 'after spread damage wins the first exchange or when Call Down controls the contest area',
      telemetryCaveat: 'enemy formation density and Flak Cannon target count are not observable'
    },
    telemetryLimitations: ['enemy_formation_density_not_available', 'flak_target_count_not_available'],
    buildPlans: [
      makePlan(ITEMS, 'gyrocopter', CALIBRATION, { id:'balanced', name:'Aghanim Flak scaling', scenarioTags:['balanced'], priority:87, itemKeys:['maelstrom','scepter','bkb','satanic'], reasons:['balanced_draft'], optional:['butterfly'], situational:['daedalus'] }),
      makePlan(ITEMS, 'gyrocopter', CALIBRATION, { id:'control_response', name:'Protected Flak delivery', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['dragon_lance','bkb','scepter','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['hurricane_pike'], situational:['linken'] }),
      makePlan(ITEMS, 'gyrocopter', CALIBRATION, { id:'recovery', name:'Maelstrom area-farm recovery', scenarioTags:['player_behind'], priority:89, itemKeys:['maelstrom','scepter','bkb','satanic'], reasons:['player_behind'], optional:['dragon_lance'], situational:['butterfly'], avoidWhen:['enemy_can_invade_all_stacked_areas'] }),
      makePlan(ITEMS, 'gyrocopter', CALIBRATION, { id:'objective', name:'Flak teamfight conversion', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['scepter','bkb','daedalus','satanic'], reasons:['player_ahead','objective_window'], optional:['butterfly'], situational:['hurricane_pike'], requiredSignals:['allies_ready','enemy_grouped'] })
    ],
    spikes: [
      makeSpike(condition, 'gyrocopter', CALIBRATION, { id:'level_6', name:'Call Down first teamfight window', priority:60, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Call Down must be ready'},{type:'min_health_pct',value:0.55,message:'Do not enter the compressed fight while already low'}], permanent:{fight:8,initiation:4}, window:{fight:17,connect:12}, actions:{FIGHT:17,CONNECT:12}, recommendation:'Join a narrow fight where both Call Down waves and Rocket Barrage can affect multiple targets.' }),
      makeSpike(condition, 'gyrocopter', CALIBRATION, { id:'maelstrom', name:'Maelstrom area-farm bridge', priority:77, trigger:[['item_owned',getItem(ITEMS,'maelstrom').id]], expectedMinute:14, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:190, permanent:{farm:17,fight:9,push:6}, window:{farm:14,pressure:8}, actions:{FARM:16,PRESSURE:8,FIGHT:7}, recommendation:'Clear stacked areas and nearby waves, but keep enough health and mana to answer the next grouped fight.' }),
      makeSpike(condition, 'gyrocopter', CALIBRATION, { id:'aghs', name:'Side Gunner sustained damage timing', priority:88, trigger:[['item_owned',getItem(ITEMS,'scepter').id]], expectedMinute:19, earlyToleranceMin:2.5, lateToleranceMin:4.2, activeDurationSec:330, fadeDurationSec:220, permanent:{farm:13,fight:20,objective:9}, window:{fight:19,objective:12}, actions:{FIGHT:20,OBJECTIVE:12,FARM:7}, recommendation:'Group for the first sustained damage window and force a fight where the enemy cannot disengage one target at a time.' }),
      makeSpike(condition, 'gyrocopter', CALIBRATION, { id:'bkb', name:'BKB full Flak cycle', priority:98, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:24, earlyToleranceMin:2.8, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Reset before committing the protected Flak cycle'}], permanent:{fight:24,survival:25,objective:11}, window:{fight:26,objective:15}, actions:{FIGHT:27,OBJECTIVE:15,CONNECT:13}, recommendation:'Force the five-on-five while BKB guarantees one full damage cycle, then take the objective before the enemy resets.' })
    ]
  }, benchmark);

  profiles.bloodseeker = makeProfile({
    id: 'bloodseeker',
    displayName: 'Bloodseeker',
    roles: ['Carry'],
    archetypes: ['tempo_carry', 'anti_mobility_hunter', 'low_health_chaser'],
    draftTags: ['rupture', 'mobility', 'tempo', 'pickoff'],
    vulnerabilities: ['kite', 'save', 'burst'],
    identity: 'Use Rupture to constrain mobile targets, accelerate between cooldowns, and chase only while Thirst information and defensive resources still support a clean exit into an objective.',
    basePower: { farm: 66, fight: 75, push: 56, survival: 58, initiation: 70, objective: 61, mobility: 82 },
    stageCurves: {
      early: { fight: 9, mobility: 7, initiation: 6 },
      mid: { farm: 13, fight: 19, mobility: 16, objective: 8 },
      late: { fight: 8, survival: 8, objective: 7, mobility: 4 }
    },
    benchmarkPoints: [[5,340,5],[10,445,8],[15,525,12],[20,590,16],[30,675,22],[40,720,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Maelstrom or Radiance before Rupture windows become the only source of map pressure',
      defensiveItem: 'BKB before a chase can be stopped by layered control and saves',
      objectiveTiming: 'after Rupture removes a mobile defender or when Thirst creates a safe numbers advantage',
      telemetryCaveat: 'enemy low-health locations, defensive saves and exact Thirst contribution are not observable'
    },
    telemetryLimitations: ['enemy_low_health_locations_not_available', 'enemy_save_cooldowns_not_available', 'thirst_contribution_not_available'],
    buildPlans: [
      makePlan(ITEMS, 'bloodseeker', CALIBRATION, { id:'balanced', name:'Maelstrom tempo chase', scenarioTags:['balanced'], priority:86, itemKeys:['maelstrom','bkb','basher','butterfly'], reasons:['balanced_draft'], optional:['manta'], situational:['satanic'] }),
      makePlan(ITEMS, 'bloodseeker', CALIBRATION, { id:'control_response', name:'Protected Rupture pursuit', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['maelstrom','bkb','manta','abyssal'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['satanic'] }),
      makePlan(ITEMS, 'bloodseeker', CALIBRATION, { id:'recovery', name:'Radiance map recovery', scenarioTags:['player_behind'], priority:88, itemKeys:['radiance','manta','bkb','abyssal'], reasons:['player_behind'], optional:['maelstrom'], situational:['satanic'], avoidWhen:['enemy_can_invade_radiance_route'] }),
      makePlan(ITEMS, 'bloodseeker', CALIBRATION, { id:'objective', name:'Rupture pickoff conversion', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['maelstrom','bkb','abyssal','butterfly'], reasons:['player_ahead','objective_window'], optional:['manta'], situational:['satanic'], requiredSignals:['rupture_ready','target_without_save'] })
    ],
    spikes: [
      makeSpike(condition, 'bloodseeker', CALIBRATION, { id:'level_6', name:'Rupture anti-mobility window', priority:67, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Rupture must be ready'},{type:'min_health_pct',value:0.55,message:'Do not cross the tower line while already low'}], permanent:{fight:7,initiation:11,mobility:4}, window:{fight:19,connect:13}, actions:{FIGHT:19,CONNECT:13}, recommendation:'Rupture the mobile target, control the escape route, and stop the chase if the enemy save arrives.' }),
      makeSpike(condition, 'bloodseeker', CALIBRATION, { id:'maelstrom', name:'Maelstrom tempo farm', priority:77, trigger:[['item_owned',getItem(ITEMS,'maelstrom').id]], expectedMinute:14, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:190, permanent:{farm:16,fight:10,push:5}, window:{farm:12,pressure:10}, actions:{FARM:13,PRESSURE:10,FIGHT:8}, recommendation:'Clear waves and camps between Rupture windows, staying close enough to connect to a low-health target.' }),
      makeSpike(condition, 'bloodseeker', CALIBRATION, { id:'bkb', name:'BKB chase timing', priority:96, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:22, earlyToleranceMin:2.8, lateToleranceMin:4.8, activeDurationSec:360, fadeDurationSec:230, requires:[{type:'ultimate_ready',message:'Rupture should be available for the protected chase'},{type:'min_health_pct',value:0.65,message:'Reset before extending through the back line'}], permanent:{fight:21,survival:24,mobility:8}, window:{fight:24,objective:11}, actions:{FIGHT:25,OBJECTIVE:12,CONNECT:14}, recommendation:'Rupture the mobile core, use BKB only after control is committed, and convert the kill instead of chasing supports.' }),
      makeSpike(condition, 'bloodseeker', CALIBRATION, { id:'abyssal', name:'Abyssal target-lock peak', priority:98, trigger:[['item_owned',getItem(ITEMS,'abyssal').id]], expectedMinute:30, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:420, fadeDurationSec:260, requires:[{type:'min_health_pct',value:0.7,message:'Start the decisive pickoff healthy enough to disengage'}], permanent:{fight:24,initiation:19,objective:12}, window:{fight:22,objective:17,pressure:11}, actions:{FIGHT:23,OBJECTIVE:18,PRESSURE:11}, recommendation:'Lock the priority target inside Rupture pressure, then take Roshan or a lane of buildings before buybacks regroup.' })
    ]
  }, benchmark);

  return profiles;
}
