import {
  WEAVER_CALIBRATION,
  SVEN_CALIBRATION,
  getItem,
  makePlan,
  makeProfile,
  makeSpike
} from './legacy_core_profile_pack_5_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.weaver = makeProfile({
    id: 'weaver',
    displayName: 'Weaver',
    role: 'carry',
    roles: ['Carry', 'Offlane'],
    archetypes: ['shukuchi_skirmisher', 'dangerous_lane_pressure', 'time_lapse_survivor'],
    draftTags: ['mobility', 'armor_reduction', 'backline_access', 'split_pressure'],
    vulnerabilities: ['silence', 'instant_disable', 'detection'],
    identity: 'Use Shukuchi to clear and exit rather than to reveal the only escape route, pressure the dangerous lane while Time Lapse can undo the response, and enter fights after instant disables are shown so Geminate damage reaches the backline.',
    basePower: { farm: 67, fight: 72, push: 64, survival: 66, initiation: 65, objective: 57, mobility: 91 },
    stageCurves: {
      early: { fight: 7, mobility: 7, survival: 4 },
      mid: { farm: 12, fight: 18, push: 13, mobility: 10 },
      late: { fight: 16, survival: 13, push: 10, objective: 7 }
    },
    benchmarkPoints: [[5,340,5],[10,445,8],[15,525,12],[20,595,16],[30,680,22],[40,720,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Maelstrom or Desolator before enemy detection and instant disable fully control the dangerous lane',
      defensiveItem: 'Linken or BKB before silence and targeted lockdown can prevent Time Lapse',
      objectiveTiming: 'after Shukuchi pressure forces a response and the hero can join from a side angle with Time Lapse available',
      telemetryCaveat: 'Shukuchi route, Geminate target, Time Lapse restoration value and enemy detection coverage are unavailable'
    },
    telemetryLimitations: ['shukuchi_route_not_available', 'time_lapse_restore_value_not_available', 'enemy_detection_coverage_not_available'],
    calibration: WEAVER_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'weaver', 'carry', WEAVER_CALIBRATION, { id:'balanced', name:'Maelstrom into Linken lane pressure', scenarioTags:['balanced'], priority:89, itemKeys:['maelstrom','linken','bkb','daedalus'], reasons:['balanced_draft'], optional:['hurricane_pike'], situational:['satanic'] }),
      makePlan(ITEMS, 'weaver', 'carry', WEAVER_CALIBRATION, { id:'control_response', name:'Layered protection for Time Lapse', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['dragon_lance','linken','bkb','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['maelstrom'], situational:['hurricane_pike'] }),
      makePlan(ITEMS, 'weaver', 'carry', WEAVER_CALIBRATION, { id:'recovery', name:'Shukuchi dangerous-lane recovery', scenarioTags:['player_behind'], priority:93, itemKeys:['maelstrom','linken','hurricane_pike','satanic'], reasons:['player_behind'], optional:['bkb'], situational:['daedalus'], avoidWhen:['enemy_detection_covers_all_exit_routes'] }),
      makePlan(ITEMS, 'weaver', 'carry', WEAVER_CALIBRATION, { id:'objective', name:'Desolator side-angle conversion', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['desolator','bkb','daedalus','satanic'], reasons:['player_ahead','objective_window'], optional:['linken'], situational:['hurricane_pike'], requiredSignals:['instant_disable_committed_elsewhere'] })
    ],
    spikes: [
      makeSpike(condition, 'weaver', WEAVER_CALIBRATION, { id:'level_6', name:'Time Lapse dangerous-lane license', priority:65, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.1, lateToleranceMin:2.5, activeDurationSec:190, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Time Lapse must be ready'},{type:'min_mana_pct',value:0.35,message:'Keep enough mana for Shukuchi and Time Lapse'}], permanent:{survival:12,mobility:7}, window:{pressure:13,fight:9}, actions:{PRESSURE:14,FIGHT:9}, recommendation:'Take the dangerous wave only with a clear Shukuchi exit and enough mana to Time Lapse the response.' }),
      makeSpike(condition, 'weaver', WEAVER_CALIBRATION, { id:'maelstrom', name:'Maelstrom lane acceleration', priority:75, trigger:[['item_owned',getItem(ITEMS,'maelstrom').id]], expectedMinute:13, earlyToleranceMin:1.7, lateToleranceMin:3, activeDurationSec:300, fadeDurationSec:190, permanent:{farm:16,push:11}, window:{pressure:12,farm:9}, actions:{FARM:11,PRESSURE:12}, recommendation:'Clear with Shukuchi and leave before the enemy detection and disable package arrives.' }),
      makeSpike(condition, 'weaver', WEAVER_CALIBRATION, { id:'linken', name:"Linken's aggressive map timing", priority:88, trigger:[['item_owned',getItem(ITEMS,'linken').id]], expectedMinute:19, earlyToleranceMin:2.2, lateToleranceMin:3.8, activeDurationSec:340, fadeDurationSec:210, permanent:{survival:23,mobility:8,push:8}, window:{pressure:17,fight:14}, actions:{PRESSURE:18,FIGHT:14}, recommendation:'Pressure a dangerous lane while tracking the cheap spell that can remove Linken before the real disable.' }),
      makeSpike(condition, 'weaver', WEAVER_CALIBRATION, { id:'bkb', name:'BKB backline timing', priority:97, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:24, earlyToleranceMin:2.7, lateToleranceMin:4.8, activeDurationSec:400, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.62,message:'Enter healthy enough that Time Lapse restores meaningful value'}], permanent:{fight:22,survival:25}, window:{fight:24,objective:11}, actions:{FIGHT:26,CONNECT:11,OBJECTIVE:11}, recommendation:'Enter after instant control is committed and preserve Time Lapse until the enemy burst has landed.' })
    ]
  }, benchmark);

  profiles.sven = makeProfile({
    id: 'sven',
    displayName: 'Sven',
    role: 'carry',
    roles: ['Carry'],
    archetypes: ['cleave_flash_farmer', 'gods_strength_burst', 'warcry_frontline'],
    draftTags: ['physical_burst', 'cleave', 'armor_buff', 'blink_initiation'],
    vulnerabilities: ['kite', 'control', 'disarm'],
    identity: "Accelerate through stacked camps with Great Cleave, hide once Blink is close, and commit God's Strength only when Storm Hammer, Warcry and BKB can keep the primary target inside the burst window.",
    basePower: { farm: 78, fight: 70, push: 61, survival: 68, initiation: 66, objective: 73, mobility: 44 },
    stageCurves: {
      early: { farm: 3, fight: 2, survival: 4 },
      mid: { farm: 16, fight: 21, initiation: 18, objective: 14 },
      late: { fight: 18, survival: 12, objective: 12, push: 8 }
    },
    benchmarkPoints: [[5,355,5],[10,475,8],[15,565,12],[20,635,16],[30,720,22],[40,755,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Blink before enemy vision and kite tools can consistently read the Storm Hammer approach',
      defensiveItem: 'BKB before control, disarm or magical burst can consume the short God’s Strength commitment',
      objectiveTiming: 'after a Blink burst removes one target or when God’s Strength plus Warcry can cover the objective response',
      telemetryCaveat: "God's Strength duration, Warcry coverage, cleave geometry and enemy kite cooldowns are unavailable"
    },
    telemetryLimitations: ['gods_strength_duration_not_available', 'warcry_coverage_not_available', 'cleave_geometry_not_available'],
    calibration: SVEN_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'sven', 'carry', SVEN_CALIBRATION, { id:'balanced', name:'Cleave acceleration into Blink BKB', scenarioTags:['balanced'], priority:91, itemKeys:['mask_of_madness','blink','bkb','satanic'], reasons:['balanced_draft'], optional:['daedalus'], situational:['assault_cuirass'] }),
      makePlan(ITEMS, 'sven', 'carry', SVEN_CALIBRATION, { id:'control_response', name:'Protected God’s Strength entry', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['echo_sabre','bkb','blink','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['mask_of_madness'], situational:['daedalus'] }),
      makePlan(ITEMS, 'sven', 'carry', SVEN_CALIBRATION, { id:'recovery', name:'Stacked-camp recovery into survivability', scenarioTags:['player_behind'], priority:92, itemKeys:['mask_of_madness','bkb','satanic','daedalus'], reasons:['player_behind'], optional:['blink'], situational:['assault_cuirass'], avoidWhen:['safe_cleave_stacks_unavailable'] }),
      makePlan(ITEMS, 'sven', 'carry', SVEN_CALIBRATION, { id:'objective', name:'Warcry-protected objective burst', scenarioTags:['player_ahead','objective_window'], priority:99, itemKeys:['mask_of_madness','blink','bkb','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['satanic'], situational:['daedalus'], requiredSignals:['gods_strength_objective_window_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'sven', SVEN_CALIBRATION, { id:'level_6', name:"God's Strength level 1", priority:60, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:"God's Strength must be ready"},{type:'min_mana_pct',value:0.35,message:'Keep enough mana for Storm Hammer and Warcry'}], permanent:{fight:8,farm:5,objective:5}, window:{fight:20,objective:11}, actions:{FIGHT:16,OBJECTIVE:11}, recommendation:"Fight only when God's Strength and Storm Hammer can reach the same target, otherwise use the damage to accelerate the next camp." }),
      makeSpike(condition, 'sven', SVEN_CALIBRATION, { id:'blink', name:'Blink Storm Hammer entry', priority:78, trigger:[['item_owned',getItem(ITEMS,'blink').id]], expectedMinute:16, earlyToleranceMin:2, lateToleranceMin:3.6, activeDurationSec:300, fadeDurationSec:190, requires:[{type:'ultimate_ready',message:"God's Strength must be ready for the full Blink window"}], permanent:{initiation:29,mobility:17,fight:12}, window:{fight:18,connect:21}, actions:{CONNECT:23,FIGHT:20}, recommendation:'Stop showing on lanes and attack from fog only when the team can follow Storm Hammer.' }),
      makeSpike(condition, 'sven', SVEN_CALIBRATION, { id:'bkb', name:'Blink plus BKB God’s Strength window', priority:97, trigger:[['item_owned',getItem(ITEMS,'blink').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:22, earlyToleranceMin:2.5, lateToleranceMin:4.2, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:"God's Strength must be ready"},{type:'min_health_pct',value:0.68,message:'Begin the burst window healthy enough to survive after BKB'}], permanent:{fight:23,survival:26,initiation:9}, window:{fight:27,connect:20,objective:14}, actions:{FIGHT:29,CONNECT:20,OBJECTIVE:14}, recommendation:'Force the key objective fight before BKB shortens and commit to the target fixed by Storm Hammer.' }),
      makeSpike(condition, 'sven', SVEN_CALIBRATION, { id:'assault', name:'Assault Cuirass cleave conversion', priority:99, trigger:[['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:30, earlyToleranceMin:3, lateToleranceMin:5.5, activeDurationSec:450, fadeDurationSec:270, permanent:{fight:24,objective:22,push:16,survival:11}, window:{objective:22,fight:19}, actions:{OBJECTIVE:23,FIGHT:20}, recommendation:'Use Warcry and the armor swing to turn one Blink kill into Roshan or high ground.' })
    ]
  }, benchmark);

  profiles.sven = {
    ...profiles.sven,
    spikeAliases: Object.freeze({
      sven_gods_strength: 'sven_level_6'
    })
  };

  return profiles;
}
