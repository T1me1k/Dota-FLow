import {
  MUERTA_CALIBRATION,
  TEMPLAR_ASSASSIN_CALIBRATION,
  getItem,
  makePlan,
  makeProfile,
  makeSpike
} from './legacy_core_profile_pack_5_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.muerta = makeProfile({
    id: 'muerta',
    displayName: 'Muerta',
    role: 'carry',
    roles: ['Carry', 'Mid'],
    archetypes: ['ranged_magic_carry', 'veil_teamfighter', 'dead_shot_controller'],
    draftTags: ['magic_right_click', 'fear_control', 'ranged_damage', 'teamfight_commitment'],
    vulnerabilities: ['gap_close', 'silence', 'physical_control'],
    identity: 'Use Dead Shot and The Calling to shape a protected firing lane, delay Pierce the Veil until physical damage or control threatens the commitment, and turn the immunity window into a decisive objective fight rather than an isolated chase.',
    basePower: { farm: 69, fight: 78, push: 63, survival: 48, initiation: 51, objective: 68, mobility: 42 },
    stageCurves: {
      early: { farm: 2, fight: 6, initiation: 4 },
      mid: { farm: 11, fight: 20, objective: 14, survival: 7 },
      late: { fight: 18, push: 10, objective: 12, survival: 8 }
    },
    benchmarkPoints: [[5,345,5],[10,455,8],[15,540,12],[20,610,16],[30,695,22],[40,735,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Maelstrom or positioning item before enemy gap-close can consistently collapse the firing lane',
      defensiveItem: 'BKB before silence and magical control can stop the full Pierce the Veil damage cycle',
      objectiveTiming: 'after Dead Shot or allied control creates a stable firing lane and the Veil window can cover Roshan or a tower response',
      telemetryCaveat: 'Pierce the Veil state, Gunslinger target selection, The Calling coverage and enemy physical-control cooldowns are unavailable'
    },
    telemetryLimitations: ['pierce_the_veil_state_not_available', 'gunslinger_target_not_available', 'calling_zone_quality_not_available'],
    calibration: MUERTA_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'muerta', 'carry', MUERTA_CALIBRATION, { id:'balanced', name:'Maelstrom firing-line progression', scenarioTags:['balanced'], priority:89, itemKeys:['maelstrom','dragon_lance','bkb','daedalus'], reasons:['balanced_draft'], optional:['hurricane_pike'], situational:['satanic'] }),
      makePlan(ITEMS, 'muerta', 'carry', MUERTA_CALIBRATION, { id:'control_response', name:'Protected Pierce the Veil commitment', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['dragon_lance','bkb','hurricane_pike','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['maelstrom'], situational:['daedalus'] }),
      makePlan(ITEMS, 'muerta', 'carry', MUERTA_CALIBRATION, { id:'recovery', name:'Safe wave-clear recovery', scenarioTags:['player_behind'], priority:92, itemKeys:['maelstrom','dragon_lance','bkb','satanic'], reasons:['player_behind'], optional:['manta'], situational:['hurricane_pike'], avoidWhen:['enemy_can_dive_unseen_firing_lane'] }),
      makePlan(ITEMS, 'muerta', 'carry', MUERTA_CALIBRATION, { id:'objective', name:'Veil-protected objective damage', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['maelstrom','bkb','daedalus','satanic'], reasons:['player_ahead','objective_window'], optional:['hurricane_pike'], situational:['manta'], requiredSignals:['stable_firing_lane_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'muerta', MUERTA_CALIBRATION, { id:'level_6', name:'Pierce the Veil level 1', priority:66, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Pierce the Veil must be ready'},{type:'min_health_pct',value:0.55,message:'Enter the Veil window healthy enough to hold the firing lane'}], permanent:{fight:9,survival:4}, window:{fight:19,objective:8}, actions:{FIGHT:19,CONNECT:10,OBJECTIVE:8}, recommendation:'Use Pierce the Veil after the physical threat commits or allied control fixes targets inside your firing lane.' }),
      makeSpike(condition, 'muerta', MUERTA_CALIBRATION, { id:'maelstrom', name:'Maelstrom Gunslinger acceleration', priority:77, trigger:[['item_owned',getItem(ITEMS,'maelstrom').id]], expectedMinute:14, earlyToleranceMin:1.8, lateToleranceMin:3.2, activeDurationSec:300, fadeDurationSec:190, permanent:{farm:16,push:10,fight:8}, window:{farm:12,pressure:10}, actions:{FARM:13,PRESSURE:10}, recommendation:'Clear the wave from range and move before gap-close heroes can collapse on the revealed lane.' }),
      makeSpike(condition, 'muerta', MUERTA_CALIBRATION, { id:'bkb', name:'BKB Pierce the Veil window', priority:97, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:23, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Pierce the Veil must be ready'},{type:'min_health_pct',value:0.65,message:'Start the committed fight with enough health to use the full window'}], permanent:{survival:25,fight:23}, window:{fight:27,objective:15}, actions:{FIGHT:28,OBJECTIVE:15,CONNECT:11}, recommendation:'Force the objective fight while BKB protects the complete Veil damage cycle.' }),
      makeSpike(condition, 'muerta', MUERTA_CALIBRATION, { id:'daedalus', name:'Daedalus late firing-line conversion', priority:99, trigger:[['item_owned',getItem(ITEMS,'daedalus').id]], expectedMinute:31, earlyToleranceMin:3, lateToleranceMin:5.5, activeDurationSec:450, fadeDurationSec:260, permanent:{fight:28,objective:18,push:12}, window:{fight:24,objective:19}, actions:{FIGHT:25,OBJECTIVE:19}, recommendation:'Hold a protected angle and convert one controlled target into Roshan, a tower or high-ground pressure.' })
    ]
  }, benchmark);

  profiles.templar_assassin = makeProfile({
    id: 'templar_assassin',
    displayName: 'Templar Assassin',
    role: 'mid',
    roles: ['Mid', 'Carry'],
    archetypes: ['physical_tempo_mid', 'trap_map_controller', 'roshan_accelerator'],
    draftTags: ['physical_burst', 'vision_control', 'objective_damage', 'backline_access'],
    vulnerabilities: ['damage_over_time', 'control', 'save'],
    identity: 'Build a trap network before the move, preserve Refraction for the first meaningful damage cycle, and use Desolator plus Meld burst to secure Roshan or a tower before damage-over-time and defensive saves erase the tempo lead.',
    basePower: { farm: 76, fight: 74, push: 72, survival: 54, initiation: 64, objective: 89, mobility: 58 },
    stageCurves: {
      early: { farm: 6, fight: 5, objective: 5 },
      mid: { farm: 12, fight: 21, push: 16, objective: 20, initiation: 11 },
      late: { fight: 10, push: 9, objective: 12, survival: 6 }
    },
    benchmarkPoints: [[5,350,6],[10,460,9],[15,550,13],[20,620,16],[30,700,22],[40,735,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Desolator or Blink before enemy saves and armor items close the first Roshan and pickoff window',
      defensiveItem: 'BKB before damage-over-time and control can remove Refraction and prevent the backline commitment',
      objectiveTiming: 'when traps cover the approach, Refraction is intact and Desolator damage can finish Roshan or a tower before the response',
      telemetryCaveat: 'Refraction charges, Meld angle, trap coverage and enemy damage-over-time readiness are unavailable'
    },
    telemetryLimitations: ['refraction_charges_not_available', 'meld_angle_not_available', 'trap_network_not_available'],
    calibration: TEMPLAR_ASSASSIN_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'templar_assassin', 'mid', TEMPLAR_ASSASSIN_CALIBRATION, { id:'balanced', name:'Desolator tempo into protected Blink', scenarioTags:['balanced'], priority:91, itemKeys:['desolator','blink','bkb','daedalus'], reasons:['balanced_draft'], optional:['hurricane_pike'], situational:['assault_cuirass'] }),
      makePlan(ITEMS, 'templar_assassin', 'mid', TEMPLAR_ASSASSIN_CALIBRATION, { id:'control_response', name:'Refraction-safe backline access', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['dragon_lance','blink','bkb','hurricane_pike'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['desolator'], situational:['daedalus'] }),
      makePlan(ITEMS, 'templar_assassin', 'mid', TEMPLAR_ASSASSIN_CALIBRATION, { id:'recovery', name:'Ancient-stack and lane recovery', scenarioTags:['player_behind'], priority:92, itemKeys:['dragon_lance','desolator','bkb','daedalus'], reasons:['player_behind'], optional:['blink'], situational:['hurricane_pike'], avoidWhen:['ancient_routes_are_contested_without_traps'] }),
      makePlan(ITEMS, 'templar_assassin', 'mid', TEMPLAR_ASSASSIN_CALIBRATION, { id:'objective', name:'Trap-secured Roshan conversion', scenarioTags:['player_ahead','objective_window'], priority:100, itemKeys:['desolator','blink','bkb','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['daedalus'], situational:['hurricane_pike'], requiredSignals:['roshan_approach_trapped'] })
    ],
    spikes: [
      makeSpike(condition, 'templar_assassin', TEMPLAR_ASSASSIN_CALIBRATION, { id:'level_6', name:'Psionic Trap map control', priority:62, trigger:[['level_gte',6]], expectedMinute:6.5, earlyToleranceMin:1, lateToleranceMin:2.3, activeDurationSec:190, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Psionic Trap must be available'}], permanent:{initiation:8,objective:9,mobility:4}, window:{pressure:12,connect:10}, actions:{PRESSURE:13,CONNECT:10}, recommendation:'Place traps on runes, Roshan and retreat routes before leaving the lane.' }),
      makeSpike(condition, 'templar_assassin', TEMPLAR_ASSASSIN_CALIBRATION, { id:'desolator', name:'Desolator objective timing', priority:92, trigger:[['item_owned',getItem(ITEMS,'desolator').id]], expectedMinute:14.5, earlyToleranceMin:1.8, lateToleranceMin:3.3, activeDurationSec:330, fadeDurationSec:200, permanent:{fight:18,push:19,objective:24}, window:{objective:24,pressure:18,fight:14}, actions:{OBJECTIVE:25,PRESSURE:19,FIGHT:14}, recommendation:'Take Roshan or an outer tower before armor and saves remove the first physical-damage window.' }),
      makeSpike(condition, 'templar_assassin', TEMPLAR_ASSASSIN_CALIBRATION, { id:'blink_bkb', name:'Blink plus BKB backline access', priority:98, trigger:[['item_owned',getItem(ITEMS,'blink').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:22, earlyToleranceMin:2.4, lateToleranceMin:4.4, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Begin the backline commitment healthy enough to survive after Refraction breaks'}], permanent:{fight:26,survival:24,initiation:21}, window:{fight:26,objective:16}, actions:{FIGHT:28,OBJECTIVE:16,CONNECT:12}, recommendation:'Enter from a trapped angle, remove the backline target and immediately convert the won fight into Roshan.' }),
      makeSpike(condition, 'templar_assassin', TEMPLAR_ASSASSIN_CALIBRATION, { id:'assault', name:'Assault Cuirass high-ground conversion', priority:99, trigger:[['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:30, earlyToleranceMin:3, lateToleranceMin:5.5, activeDurationSec:450, fadeDurationSec:270, permanent:{fight:22,push:24,objective:22,survival:10}, window:{objective:22,pressure:17}, actions:{OBJECTIVE:23,PRESSURE:17,FIGHT:16}, recommendation:'Use the armor swing to finish Roshan or high ground while traps protect both flanks.' })
    ]
  }, benchmark);

  return profiles;
}
