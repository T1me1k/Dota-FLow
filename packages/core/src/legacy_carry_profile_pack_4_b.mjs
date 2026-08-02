import { JUGGERNAUT_CALIBRATION, MONKEY_KING_CALIBRATION, getItem, makePlan, makeProfile, makeSpike } from './legacy_carry_profile_pack_4_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.juggernaut = makeProfile({
    id: 'juggernaut',
    displayName: 'Juggernaut',
    roles: ['Carry'],
    archetypes: ['magic_immune_tempo', 'isolated_target_finisher', 'sustain_pusher'],
    draftTags: ['spell_immunity', 'pickoff', 'healing', 'objective_sustain'],
    vulnerabilities: ['kite', 'save', 'summons'],
    identity: 'Use Blade Fury to survive or secure a short opening, preserve Omnislash for an isolated target, and keep Healing Ward protected so a won skirmish can become a sustained tower or Roshan attempt.',
    basePower: { farm: 65, fight: 72, push: 69, survival: 73, initiation: 45, objective: 76, mobility: 60 },
    stageCurves: {
      early: { fight: 11, survival: 10, objective: 5 },
      mid: { farm: 10, fight: 16, push: 13, objective: 14 },
      late: { fight: 12, survival: 8, objective: 9 }
    },
    benchmarkPoints: [[5,350,5],[10,465,8],[15,550,12],[20,620,16],[30,705,22],[40,745,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Diffusal or Maelstrom before enemy saves and summon density make the first isolated Omnislash unreliable',
      defensiveItem: 'Manta or BKB before silence and control can prevent Blade Fury or interrupt the approach',
      objectiveTiming: 'after a clean Omnislash pickoff or when Healing Ward can sustain the team through the objective response',
      telemetryCaveat: 'Omnislash isolation, Blade Fury state, Healing Ward position and enemy save readiness are unavailable'
    },
    telemetryLimitations: ['omnislash_isolation_not_available', 'blade_fury_state_not_available', 'healing_ward_safety_not_available'],
    calibration: JUGGERNAUT_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'juggernaut', JUGGERNAUT_CALIBRATION, { id:'balanced', name:'Diffusal tempo into isolated-target pressure', scenarioTags:['balanced'], priority:89, itemKeys:['diffusal','manta','bkb','scepter'], reasons:['balanced_draft'], optional:['abyssal'], situational:['butterfly'] }),
      makePlan(ITEMS, 'juggernaut', JUGGERNAUT_CALIBRATION, { id:'control_response', name:'Protected spin and slash commitment', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['manta','bkb','scepter','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['maelstrom'], situational:['skadi'] }),
      makePlan(ITEMS, 'juggernaut', JUGGERNAUT_CALIBRATION, { id:'recovery', name:'Maelstrom lane recovery with safe dispel', scenarioTags:['player_behind'], priority:92, itemKeys:['maelstrom','manta','bkb','scepter'], reasons:['player_behind'], optional:['satanic'], situational:['abyssal'], avoidWhen:['enemy_can_contest_every_safe_wave'] }),
      makePlan(ITEMS, 'juggernaut', JUGGERNAUT_CALIBRATION, { id:'objective', name:'Healing Ward objective sustain', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['maelstrom','manta','scepter','abyssal'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['butterfly'], requiredSignals:['healing_ward_zone_protectable'] })
    ],
    spikes: [
      makeSpike(condition, 'juggernaut', JUGGERNAUT_CALIBRATION, { id:'level_6', name:'Omnislash level 1', priority:58, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Omnislash must be ready'},{type:'min_health_pct',value:0.55,message:'Do not search for isolation while too low to survive the approach'}], permanent:{fight:6,initiation:4}, window:{fight:21,connect:12}, actions:{FIGHT:20,CONNECT:12}, recommendation:'Look for a low-unit-count target and avoid spending Omnislash into nearby creeps, summons or immediate saves.' }),
      makeSpike(condition, 'juggernaut', JUGGERNAUT_CALIBRATION, { id:'diffusal', name:'Diffusal tempo', priority:75, trigger:[['item_owned',getItem(ITEMS,'diffusal').id]], expectedMinute:13, earlyToleranceMin:1.8, lateToleranceMin:3, activeDurationSec:300, fadeDurationSec:180, permanent:{fight:15,mobility:9,initiation:6}, window:{fight:19,pressure:9}, actions:{FIGHT:20,CONNECT:11,PRESSURE:9}, recommendation:'Use the slow to secure a short kill or outer tower, then return to efficient farm before the response arrives.' }),
      makeSpike(condition, 'juggernaut', JUGGERNAUT_CALIBRATION, { id:'manta', name:'Manta Style', priority:81, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:19, earlyToleranceMin:2.2, lateToleranceMin:3.8, activeDurationSec:300, fadeDurationSec:220, permanent:{farm:13,push:16,survival:13}, window:{pressure:16,fight:12}, actions:{PRESSURE:17,CONNECT:11,FIGHT:10}, recommendation:'Pressure a lane with dispel available and connect only when Omnislash has a credible isolated target.' }),
      makeSpike(condition, 'juggernaut', JUGGERNAUT_CALIBRATION, { id:'scepter', name:'Swift Slash objective chain', priority:97, trigger:[['item_owned',getItem(ITEMS,'scepter').id]], expectedMinute:27, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:420, fadeDurationSec:250, requires:[{type:'min_health_pct',value:0.65,message:'Enter the objective fight healthy enough to protect Healing Ward'}], permanent:{fight:23,objective:16,survival:8}, window:{fight:24,objective:18}, actions:{FIGHT:25,OBJECTIVE:18}, recommendation:'Use the shorter slash to remove or force a save, then sustain the team through Roshan or a tower with Healing Ward.' })
    ]
  }, benchmark);

  profiles.juggernaut = {
    ...profiles.juggernaut,
    spikeAliases: Object.freeze({
      jugg_level_6: 'juggernaut_level_6',
      jugg_diffusal: 'juggernaut_diffusal',
      jugg_manta: 'juggernaut_manta'
    })
  };

  profiles.monkey_king = makeProfile({
    id: 'monkey_king',
    displayName: 'Monkey King',
    roles: ['Carry', 'Mid'],
    archetypes: ['tree_mobile_core', 'zone_fighter', 'lane_duelist'],
    draftTags: ['mobility', 'teamfight_zone', 'lane_pressure', 'physical_burst'],
    vulnerabilities: ['tree_cut', 'burst', 'displacement'],
    identity: 'Use Tree Dance to arrive from an unseen angle, build Jingu only when the target cannot disengage, and place Wukong around a constrained objective rather than casting it in open space.',
    basePower: { farm: 66, fight: 81, push: 61, survival: 58, initiation: 72, objective: 71, mobility: 86 },
    stageCurves: {
      early: { fight: 12, initiation: 7, farm: -2 },
      mid: { fight: 20, initiation: 16, mobility: 15, objective: 14 },
      late: { fight: 15, survival: 8, objective: 10 }
    },
    benchmarkPoints: [[5,340,5],[10,450,8],[15,535,12],[20,605,16],[30,690,22],[40,730,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Echo Sabre or Maelstrom before lane pressure fades and tree approaches become easier to ward',
      defensiveItem: 'BKB before control can remove the hero from Wukong or punish the landing from Tree Dance',
      objectiveTiming: 'when a narrow ramp, pit or tower area keeps enemies inside Wukong and tree-cut threats are accounted for',
      telemetryCaveat: 'tree location, Jingu stacks, Wukong zone quality and enemy tree-cut readiness are unavailable'
    },
    telemetryLimitations: ['tree_position_not_available', 'jingu_stacks_not_available', 'tree_cut_readiness_not_available'],
    calibration: MONKEY_KING_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'monkey_king', MONKEY_KING_CALIBRATION, { id:'balanced', name:'Echo lane lead into Wukong control', scenarioTags:['balanced'], priority:89, itemKeys:['echo_sabre','desolator','bkb','basher'], reasons:['balanced_draft'], optional:['scepter'], situational:['skadi'] }),
      makePlan(ITEMS, 'monkey_king', MONKEY_KING_CALIBRATION, { id:'control_response', name:'Protected Wukong commitment', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['maelstrom','bkb','scepter','skadi'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['basher'], situational:['satanic'] }),
      makePlan(ITEMS, 'monkey_king', MONKEY_KING_CALIBRATION, { id:'recovery', name:'Tree-safe lane recovery', scenarioTags:['player_behind'], priority:91, itemKeys:['maelstrom','scepter','bkb','skadi'], reasons:['player_behind'], optional:['echo_sabre'], situational:['butterfly'], avoidWhen:['tree_routes_are_fully_controlled'] }),
      makePlan(ITEMS, 'monkey_king', MONKEY_KING_CALIBRATION, { id:'objective', name:'Wukong choke-point conversion', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['echo_sabre','desolator','bkb','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['basher'], situational:['satanic'], requiredSignals:['constrained_fight_zone_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'monkey_king', MONKEY_KING_CALIBRATION, { id:'level_6', name:'First Wukong zone-control window', priority:68, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:190, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Wukong Command must be ready'},{type:'min_health_pct',value:0.58,message:'Do not land into the zone already vulnerable to burst'}], permanent:{fight:8,objective:5}, window:{fight:17,objective:10}, actions:{FIGHT:17,OBJECTIVE:10}, recommendation:'Cast Wukong only around a constrained lane or objective where enemies cannot immediately walk out.' }),
      makeSpike(condition, 'monkey_king', MONKEY_KING_CALIBRATION, { id:'echo', name:'Echo Sabre Jingu timing', priority:78, trigger:[['item_owned',getItem(ITEMS,'echo_sabre').id]], expectedMinute:12, earlyToleranceMin:1.7, lateToleranceMin:3, activeDurationSec:300, fadeDurationSec:180, permanent:{fight:17,initiation:9}, window:{fight:19,pressure:9}, actions:{FIGHT:19,PRESSURE:9}, recommendation:'Punish a target that cannot break contact, but keep the tree route hidden until the kill is realistic.' }),
      makeSpike(condition, 'monkey_king', MONKEY_KING_CALIBRATION, { id:'desolator', name:'Desolator Wukong pressure', priority:91, trigger:[['item_owned',getItem(ITEMS,'desolator').id]], expectedMinute:18, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:360, fadeDurationSec:220, requires:[{type:'ultimate_ready',message:'Wukong Command must be ready for the objective fight'}], permanent:{fight:19,objective:16,push:10}, window:{fight:22,objective:15}, actions:{FIGHT:23,OBJECTIVE:15}, recommendation:'Place Wukong around Roshan, a tower ramp or another narrow area and turn the armor reduction into the objective.' }),
      makeSpike(condition, 'monkey_king', MONKEY_KING_CALIBRATION, { id:'bkb', name:'BKB Wukong commitment', priority:98, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:24, earlyToleranceMin:2.7, lateToleranceMin:4.8, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Wukong Command must be ready'},{type:'min_health_pct',value:0.65,message:'Start the committed zone fight with enough health'}], permanent:{survival:25,fight:23}, window:{fight:27,objective:14}, actions:{FIGHT:28,OBJECTIVE:14,CONNECT:11}, recommendation:'Enter from the tree after the first control is shown and remain inside Wukong while BKB protects the commitment.' })
    ]
  }, benchmark);

  return profiles;
}
