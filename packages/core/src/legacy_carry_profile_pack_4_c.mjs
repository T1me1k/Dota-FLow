import { SLARK_CALIBRATION, TROLL_CALIBRATION, getItem, makePlan, makeProfile, makeSpike } from './legacy_carry_profile_pack_4_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.slark = makeProfile({
    id: 'slark',
    displayName: 'Slark',
    roles: ['Carry'],
    archetypes: ['vision_hunter', 'attrition_pickoff', 'mobile_survivor'],
    draftTags: ['pickoff', 'mobility', 'vision_control', 'long_fight_scaling'],
    vulnerabilities: ['burst', 'instant_disable', 'break'],
    identity: 'Use missing enemy vision as permission to enter, purge the first control with Dark Pact, accumulate Essence Shift through short repeated contacts, and disengage before the enemy can layer instant disables.',
    basePower: { farm: 63, fight: 79, push: 54, survival: 78, initiation: 76, objective: 58, mobility: 91 },
    stageCurves: {
      early: { fight: 4, survival: 4, farm: -3 },
      mid: { fight: 19, initiation: 18, mobility: 16, survival: 13 },
      late: { fight: 21, survival: 17, objective: 8 }
    },
    benchmarkPoints: [[5,335,5],[10,440,8],[15,525,12],[20,595,16],[30,680,22],[40,725,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Diffusal or Aghanim before enemy supports complete enough save and instant control to deny repeated short contacts',
      defensiveItem: 'BKB before layered disables exceed the Dark Pact purge and Shadow Dance reset window',
      objectiveTiming: 'after one target is forced away and the enemy has lost vision or key control around the pit',
      telemetryCaveat: 'enemy vision, Dark Pact timing, Essence Shift stacks and Shadow Dance detection state are unavailable'
    },
    telemetryLimitations: ['enemy_vision_state_not_available', 'dark_pact_timing_not_available', 'essence_shift_stacks_not_available'],
    calibration: SLARK_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'slark', SLARK_CALIBRATION, { id:'balanced', name:'Diffusal pickoff into double-pounce control', scenarioTags:['balanced'], priority:90, itemKeys:['diffusal','scepter','bkb','basher'], reasons:['balanced_draft'], optional:['skadi'], situational:['abyssal'] }),
      makePlan(ITEMS, 'slark', SLARK_CALIBRATION, { id:'control_response', name:'Protected attrition against instant disable', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['echo_sabre','scepter','bkb','skadi'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['satanic'], situational:['abyssal'] }),
      makePlan(ITEMS, 'slark', SLARK_CALIBRATION, { id:'recovery', name:'Dark Pact lane recovery', scenarioTags:['player_behind'], priority:92, itemKeys:['maelstrom','scepter','bkb','skadi'], reasons:['player_behind'], optional:['diffusal'], situational:['butterfly'], avoidWhen:['enemy_instant_disable_locations_unknown'] }),
      makePlan(ITEMS, 'slark', SLARK_CALIBRATION, { id:'objective', name:'Vision denial objective hunt', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['diffusal','scepter','abyssal','bkb'], reasons:['player_ahead','objective_window'], optional:['skadi'], situational:['satanic'], requiredSignals:['enemy_vision_removed'] })
    ],
    spikes: [
      makeSpike(condition, 'slark', SLARK_CALIBRATION, { id:'level_6', name:'Shadow Dance hunt window', priority:67, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:190, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Shadow Dance must be ready'},{type:'min_health_pct',value:0.55,message:'Do not begin the hunt already inside burst range'}], permanent:{survival:9,initiation:6}, window:{fight:14,connect:12}, actions:{FIGHT:14,CONNECT:12}, recommendation:'Use the regeneration and hidden status to take one short contact, then reset before control can overlap.' }),
      makeSpike(condition, 'slark', SLARK_CALIBRATION, { id:'diffusal', name:'Diffusal pickoff timing', priority:82, trigger:[['item_owned',getItem(ITEMS,'diffusal').id]], expectedMinute:13, earlyToleranceMin:1.8, lateToleranceMin:3.2, activeDurationSec:320, fadeDurationSec:190, permanent:{fight:17,initiation:12,mobility:6}, window:{fight:20,pressure:10}, actions:{FIGHT:20,PRESSURE:10}, recommendation:'Punish an isolated slow target, but leave after the first response instead of extending the chase through vision.' }),
      makeSpike(condition, 'slark', SLARK_CALIBRATION, { id:'aghs', name:'Aghanim double-pounce window', priority:93, trigger:[['item_owned',getItem(ITEMS,'scepter').id]], expectedMinute:20, earlyToleranceMin:2.3, lateToleranceMin:4.2, activeDurationSec:370, fadeDurationSec:225, permanent:{mobility:22,initiation:19,survival:12}, window:{connect:21,fight:20}, actions:{CONNECT:22,FIGHT:20}, recommendation:'Approach from missing vision, use the second pounce as an exit unless the enemy control sequence is already spent.' }),
      makeSpike(condition, 'slark', SLARK_CALIBRATION, { id:'bkb', name:'BKB committed attrition fight', priority:98, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:25, earlyToleranceMin:2.8, lateToleranceMin:5, activeDurationSec:400, fadeDurationSec:250, requires:[{type:'min_health_pct',value:0.65,message:'Start the long fight healthy enough to build Essence Shift stacks'}], permanent:{fight:23,survival:24,objective:9}, window:{fight:26,objective:11}, actions:{FIGHT:27,OBJECTIVE:11}, recommendation:'Force a long fight only after instant disables are identified, and preserve Shadow Dance for the second enemy damage cycle.' })
    ]
  }, benchmark);

  profiles.troll_warlord = makeProfile({
    id: 'troll_warlord',
    displayName: 'Troll Warlord',
    roles: ['Carry'],
    archetypes: ['single_target_lock', 'roshan_specialist', 'sustained_right_click'],
    draftTags: ['objective_damage', 'attack_speed', 'single_target', 'frontline_carry'],
    vulnerabilities: ['kite', 'disarm', 'save'],
    identity: 'Build Fervor on one reachable target, use ranged stance until the commitment is safe, and reserve Battle Trance for a target that cannot kite, disarm or redirect the forced attack sequence.',
    basePower: { farm: 73, fight: 83, push: 69, survival: 72, initiation: 55, objective: 94, mobility: 49 },
    stageCurves: {
      early: { fight: 7, objective: 9, mobility: -4 },
      mid: { farm: 14, fight: 20, objective: 20, survival: 10 },
      late: { fight: 17, objective: 15, survival: 12 }
    },
    benchmarkPoints: [[5,345,5],[10,455,8],[15,545,12],[20,615,16],[30,700,22],[40,740,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Battle Fury or Maelstrom early enough to reach BKB before repeated kite tools decide every engagement',
      defensiveItem: 'BKB or status resistance before Battle Trance can be wasted into control, disarm or an unreachable save target',
      objectiveTiming: 'whenever the enemy cannot contest sustained single-target damage or after a won fight opens Roshan immediately',
      telemetryCaveat: 'current stance, Fervor stacks, Battle Trance target and enemy kite cooldowns are unavailable'
    },
    telemetryLimitations: ['stance_state_not_available', 'fervor_stacks_not_available', 'battle_trance_target_not_available'],
    calibration: TROLL_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'troll_warlord', TROLL_CALIBRATION, { id:'balanced', name:'Battle Fury into protected target lock', scenarioTags:['balanced'], priority:89, itemKeys:['battle_fury','bkb','sange_and_yasha','satanic'], reasons:['balanced_draft'], optional:['basher'], situational:['butterfly'] }),
      makePlan(ITEMS, 'troll_warlord', TROLL_CALIBRATION, { id:'control_response', name:'Fast BKB against kite and disarm', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['maelstrom','bkb','sange_and_yasha','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['basher'], situational:['abyssal'] }),
      makePlan(ITEMS, 'troll_warlord', TROLL_CALIBRATION, { id:'recovery', name:'Accelerated jungle recovery', scenarioTags:['player_behind'], priority:92, itemKeys:['battle_fury','bkb','butterfly','satanic'], reasons:['player_behind'], optional:['sange_and_yasha'], situational:['abyssal'], avoidWhen:['enemy_can_repeatedly_invade_jungle_routes'] }),
      makePlan(ITEMS, 'troll_warlord', TROLL_CALIBRATION, { id:'objective', name:'Roshan target-lock conversion', scenarioTags:['player_ahead','objective_window'], priority:99, itemKeys:['maelstrom','bkb','basher','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['satanic'], situational:['abyssal'], requiredSignals:['objective_contest_route_controlled'] })
    ],
    spikes: [
      makeSpike(condition, 'troll_warlord', TROLL_CALIBRATION, { id:'level_6', name:'First Battle Trance survival window', priority:68, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:185, fadeDurationSec:125, requires:[{type:'ultimate_ready',message:'Battle Trance must be ready'},{type:'min_health_pct',value:0.52,message:'Do not rely on Battle Trance after entering at critical health'}], permanent:{fight:8,survival:7,objective:5}, window:{fight:16,objective:10}, actions:{FIGHT:16,OBJECTIVE:10}, recommendation:'Commit only to a target that cannot immediately disengage or redirect Battle Trance.' }),
      makeSpike(condition, 'troll_warlord', TROLL_CALIBRATION, { id:'battle_fury', name:'Battle Fury acceleration', priority:75, trigger:[['item_owned',getItem(ITEMS,'battle_fury').id]], expectedMinute:14, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:360, fadeDurationSec:210, permanent:{farm:24}, window:{farm:18}, actions:{FARM:22}, recommendation:'Accelerate BKB and the next target-lock item; avoid fights where the target can simply kite the commitment.' }),
      makeSpike(condition, 'troll_warlord', TROLL_CALIBRATION, { id:'bkb', name:'BKB Battle Trance window', priority:97, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:22, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Battle Trance must be ready'},{type:'min_health_pct',value:0.65,message:'Enter the protected target-lock fight with full resources'}], permanent:{fight:26,survival:22,objective:18}, window:{fight:28,objective:21}, actions:{FIGHT:29,OBJECTIVE:21}, recommendation:'Force Roshan or a fight on a reachable core before BKB duration declines and kite items accumulate.' }),
      makeSpike(condition, 'troll_warlord', TROLL_CALIBRATION, { id:'basher', name:'Basher target lock', priority:99, trigger:[['item_owned',getItem(ITEMS,'basher').id]], expectedMinute:27, earlyToleranceMin:3, lateToleranceMin:5.2, activeDurationSec:420, fadeDurationSec:260, permanent:{initiation:17,fight:20,objective:12}, window:{fight:22,objective:17}, actions:{FIGHT:24,OBJECTIVE:17}, recommendation:'Stay on the selected core for the full Fervor and Battle Trance sequence; do not switch targets into a save.' })
    ]
  }, benchmark);

  return profiles;
}
