import { ILLUSION_CALIBRATION, getItem, makePlan, makeProfile, makeSpike } from './legacy_carry_profile_pack_3_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.naga_siren = makeProfile({
    id: 'naga_siren',
    displayName: 'Naga Siren',
    roles: ['Carry'],
    archetypes: ['illusion_economy', 'map_controller', 'reset_carry'],
    draftTags: ['illusions', 'split_push', 'teamfight_reset', 'late_game'],
    vulnerabilities: ['aoe_clear', 'silence', 'tempo'],
    identity: 'Distribute illusions across lanes and camps while hiding the real hero, preserve Song of the Siren as a reset or setup tool, and join only when the enemy area clear cannot erase every unit at once.',
    basePower: { farm: 87, fight: 54, push: 89, survival: 66, initiation: 52, objective: 70, mobility: 61 },
    stageCurves: {
      early: { farm: 3, fight: -9, push: 2 },
      mid: { farm: 22, push: 23, survival: 8, objective: 9 },
      late: { fight: 17, push: 18, survival: 14, objective: 12 }
    },
    benchmarkPoints: [[5,350,5],[10,465,8],[15,565,12],[20,640,16],[30,730,22],[40,775,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Manta before the enemy can permanently occupy the safe illusion routes',
      defensiveItem: 'Heart or BKB before the real hero must remain in prolonged area damage',
      objectiveTiming: 'after split pressure reveals area-clear heroes or Song safely resets the first response',
      telemetryCaveat: 'real-hero identity, illusion distribution and Song target geometry are unavailable'
    },
    telemetryLimitations: ['real_hero_identity_not_available', 'illusion_distribution_not_available', 'song_geometry_not_available'],
    calibration: ILLUSION_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'naga_siren', ILLUSION_CALIBRATION, { id:'balanced', name:'Manta illusion map compression', scenarioTags:['balanced'], priority:87, itemKeys:['manta','heart','butterfly','skadi'], reasons:['balanced_draft'], optional:['diffusal'], situational:['bkb'] }),
      makePlan(ITEMS, 'naga_siren', ILLUSION_CALIBRATION, { id:'control_response', name:'Protected real-hero reset', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['manta','bkb','heart','skadi'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['butterfly'], situational:['diffusal'] }),
      makePlan(ITEMS, 'naga_siren', ILLUSION_CALIBRATION, { id:'recovery', name:'Hidden illusion economy recovery', scenarioTags:['player_behind'], priority:92, itemKeys:['manta','diffusal','heart','butterfly'], reasons:['player_behind'], optional:['skadi'], situational:['bkb'], avoidWhen:['all_safe_illusion_routes_are_controlled'] }),
      makePlan(ITEMS, 'naga_siren', ILLUSION_CALIBRATION, { id:'objective', name:'Song-secured objective collapse', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['manta','heart','skadi','butterfly'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['diffusal'], requiredSignals:['area_clear_location_known'] })
    ],
    spikes: [
      makeSpike(condition, 'naga_siren', ILLUSION_CALIBRATION, { id:'level_6', name:'First Song reset window', priority:65, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.7, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Song of the Siren must be ready'},{type:'min_health_pct',value:0.55,message:'Do not rely on Song after the real hero is already critically low'}], permanent:{survival:7,initiation:5}, window:{connect:12,fight:8}, actions:{CONNECT:12,FIGHT:8}, recommendation:'Use Song to disengage a losing response or synchronize one controlled re-entry; do not spend it for an unconfirmed chase.' }),
      makeSpike(condition, 'naga_siren', ILLUSION_CALIBRATION, { id:'manta', name:'Manta map acceleration', priority:86, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:16, earlyToleranceMin:2, lateToleranceMin:3.7, activeDurationSec:390, fadeDurationSec:230, permanent:{farm:23,push:25,survival:7}, window:{pressure:25,farm:13}, actions:{PRESSURE:26,FARM:13}, recommendation:'Split illusions between lanes and camps while keeping the real hero outside the first enemy response.' }),
      makeSpike(condition, 'naga_siren', ILLUSION_CALIBRATION, { id:'heart', name:'Heart illusion sustain', priority:94, trigger:[['item_owned',getItem(ITEMS,'heart').id]], expectedMinute:24, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:420, fadeDurationSec:250, requires:[{type:'min_health_pct',value:0.6,message:'Reset the real hero before beginning sustained pressure'}], permanent:{survival:23,push:21,fight:11}, window:{pressure:22,objective:12}, actions:{PRESSURE:24,OBJECTIVE:12}, recommendation:'Maintain continuous lane pressure and preserve Song for the enemy attempt to collapse on the real hero.' }),
      makeSpike(condition, 'naga_siren', ILLUSION_CALIBRATION, { id:'butterfly', name:'Butterfly high-ground window', priority:99, trigger:[['item_owned',getItem(ITEMS,'butterfly').id]], expectedMinute:30, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:420, fadeDurationSec:260, requires:[{type:'ultimate_ready',message:'Song should be available to reset the decisive objective'},{type:'min_health_pct',value:0.65,message:'Heal before the high-ground or Roshan attempt'}], permanent:{fight:23,survival:19,push:16,objective:13}, window:{fight:20,objective:17,pressure:16}, actions:{FIGHT:20,OBJECTIVE:18,PRESSURE:16}, recommendation:'Force Roshan or structures before the enemy completes a reliable answer to the illusion army.' })
    ]
  }, benchmark);

  profiles.phantom_lancer = makeProfile({
    id: 'phantom_lancer',
    displayName: 'Phantom Lancer',
    roles: ['Carry'],
    archetypes: ['illusion_attrition', 'mana_pressure', 'mobile_scaler'],
    draftTags: ['illusions', 'mana_burn', 'late_game', 'split_push'],
    vulnerabilities: ['aoe_clear', 'early_pressure', 'break'],
    identity: 'Use Doppelganger to dodge the first answer, reveal enemy area clear with low-risk illusions, and commit the real hero only when Diffusal pressure can keep one target inside a long attrition fight.',
    basePower: { farm: 76, fight: 68, push: 80, survival: 72, initiation: 43, objective: 58, mobility: 78 },
    stageCurves: {
      early: { fight: -8, farm: -2, survival: -3 },
      mid: { farm: 15, fight: 16, push: 17, mobility: 9 },
      late: { fight: 23, survival: 18, push: 16, objective: 8 }
    },
    benchmarkPoints: [[5,340,5],[10,450,8],[15,540,12],[20,615,16],[30,705,22],[40,755,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Diffusal early enough to punish low-mobility targets before area clear fully scales',
      defensiveItem: 'Manta or Heart before prolonged area damage identifies and kills the real hero',
      objectiveTiming: 'after enemy area-clear cooldowns are used or a mana-starved core is removed',
      telemetryCaveat: 'real-hero identity, illusion count and enemy area-clear cooldowns are unavailable'
    },
    telemetryLimitations: ['real_hero_identity_not_available', 'illusion_count_not_available', 'enemy_aoe_cooldowns_not_available'],
    calibration: ILLUSION_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'phantom_lancer', ILLUSION_CALIBRATION, { id:'balanced', name:'Diffusal attrition scaling', scenarioTags:['balanced'], priority:88, itemKeys:['diffusal','manta','heart','butterfly'], reasons:['balanced_draft'], optional:['skadi'], situational:['abyssal'] }),
      makePlan(ITEMS, 'phantom_lancer', ILLUSION_CALIBRATION, { id:'control_response', name:'Protected Doppelganger commitment', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['diffusal','manta','bkb','heart'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['skadi'], situational:['butterfly'] }),
      makePlan(ITEMS, 'phantom_lancer', ILLUSION_CALIBRATION, { id:'recovery', name:'Illusion-screened economy recovery', scenarioTags:['player_behind'], priority:91, itemKeys:['manta','diffusal','heart','butterfly'], reasons:['player_behind'], optional:['skadi'], situational:['bkb'], avoidWhen:['enemy_area_clear_controls_every_wave'] }),
      makePlan(ITEMS, 'phantom_lancer', ILLUSION_CALIBRATION, { id:'objective', name:'Attrition-to-objective conversion', scenarioTags:['player_ahead','objective_window'], priority:96, itemKeys:['diffusal','manta','skadi','heart'], reasons:['player_ahead','objective_window'], optional:['butterfly'], situational:['abyssal'], requiredSignals:['major_aoe_used'] })
    ],
    spikes: [
      makeSpike(condition, 'phantom_lancer', ILLUSION_CALIBRATION, { id:'level_6', name:'Juxtapose attrition breakpoint', priority:61, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.8, activeDurationSec:210, fadeDurationSec:140, requires:[{type:'min_health_pct',value:0.55,message:'Preserve enough health for Doppelganger to remain a real escape'}], permanent:{farm:6,fight:6,push:5}, window:{farm:11,pressure:8}, actions:{FARM:11,PRESSURE:8}, recommendation:'Build illusion count on safe targets and avoid revealing the real hero into unused area damage.' }),
      makeSpike(condition, 'phantom_lancer', ILLUSION_CALIBRATION, { id:'diffusal', name:'Diffusal kill pressure', priority:82, trigger:[['item_owned',getItem(ITEMS,'diffusal').id]], expectedMinute:14, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:330, fadeDurationSec:200, requires:[{type:'min_health_pct',value:0.6,message:'Do not trade safe farm for a chase while already low'}], permanent:{fight:16,farm:8,initiation:5}, window:{fight:18,pressure:13}, actions:{FIGHT:18,PRESSURE:13}, recommendation:'Punish a slow target whose escape depends on mana, then leave before the enemy area-clear rotation arrives.' }),
      makeSpike(condition, 'phantom_lancer', ILLUSION_CALIBRATION, { id:'manta', name:'Manta split pressure', priority:90, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:390, fadeDurationSec:230, permanent:{farm:15,push:22,survival:13}, window:{pressure:23,farm:9}, actions:{PRESSURE:24,FARM:9}, recommendation:'Stretch lanes with illusions and force the enemy to reveal which area-clear cooldown is protecting each route.' }),
      makeSpike(condition, 'phantom_lancer', ILLUSION_CALIBRATION, { id:'heart', name:'Heart attrition timing', priority:98, trigger:[['item_owned',getItem(ITEMS,'heart').id]], expectedMinute:28, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:420, fadeDurationSec:260, requires:[{type:'min_health_pct',value:0.65,message:'Start the attrition fight with the real hero healthy'}], permanent:{fight:25,survival:26,push:11,objective:8}, window:{fight:22,objective:12,pressure:13}, actions:{FIGHT:24,OBJECTIVE:12,PRESSURE:13}, recommendation:'Enter after the first area-clear spell is spent and keep the same target under sustained Diffusal pressure.' })
    ]
  }, benchmark);

  return profiles;
}
