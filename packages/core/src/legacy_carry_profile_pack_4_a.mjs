import { ALCHEMIST_CALIBRATION, CLINKZ_CALIBRATION, getItem, makePlan, makeProfile, makeSpike } from './legacy_carry_profile_pack_4_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.alchemist = makeProfile({
    id: 'alchemist',
    displayName: 'Alchemist',
    roles: ['Carry', 'Mid'],
    archetypes: ['accelerated_farmer', 'net_worth_converter', 'durable_brawler'],
    draftTags: ['fast_economy', 'tempo_breakpoint', 'frontline', 'objective_conversion'],
    vulnerabilities: ['anti_heal', 'tempo', 'armor_reduction'],
    identity: 'Turn Greevil economy into an item lead, avoid low-value rotations before the lead is complete, then force consecutive fights and objectives before normal cores match the same inventory.',
    basePower: { farm: 92, fight: 66, push: 67, survival: 75, initiation: 58, objective: 78, mobility: 48 },
    stageCurves: {
      early: { farm: 11, fight: -7, survival: -2 },
      mid: { farm: 24, fight: 18, initiation: 13, objective: 17 },
      late: { fight: 7, survival: 8, objective: 6, farm: -5 }
    },
    benchmarkPoints: [[5,390,5],[10,560,8],[15,710,12],[20,810,16],[30,880,22],[40,900,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Radiance or equivalent acceleration early enough to create a two-item lead before grouped enemy pressure',
      defensiveItem: 'BKB or durable status resistance before the economy lead is committed into the first deep fight',
      objectiveTiming: 'immediately after the accelerated second or third item creates a temporary inventory mismatch',
      telemetryCaveat: 'bonus Greevil income, Chemical Rage state and enemy anti-heal readiness are unavailable'
    },
    telemetryLimitations: ['greevil_income_not_available', 'chemical_rage_state_not_available', 'enemy_anti_heal_readiness_not_available'],
    calibration: ALCHEMIST_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'alchemist', ALCHEMIST_CALIBRATION, { id:'balanced', name:'Radiance lead into protected initiation', scenarioTags:['balanced'], priority:89, itemKeys:['radiance','blink','bkb','assault_cuirass'], reasons:['balanced_draft'], optional:['abyssal'], situational:['satanic'] }),
      makePlan(ITEMS, 'alchemist', ALCHEMIST_CALIBRATION, { id:'control_response', name:'Durable lead against layered control', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['radiance','bkb','sange_and_yasha','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['assault_cuirass'], situational:['abyssal'] }),
      makePlan(ITEMS, 'alchemist', ALCHEMIST_CALIBRATION, { id:'recovery', name:'Lane-cut economy rebuild', scenarioTags:['player_behind'], priority:92, itemKeys:['battle_fury','manta','bkb','abyssal'], reasons:['player_behind'], optional:['satanic'], situational:['assault_cuirass'], avoidWhen:['enemy_can_invade_every_resource_route'] }),
      makePlan(ITEMS, 'alchemist', ALCHEMIST_CALIBRATION, { id:'objective', name:'Net-worth lead objective chain', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['radiance','blink','assault_cuirass','abyssal'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['satanic'], requiredSignals:['inventory_lead_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'alchemist', ALCHEMIST_CALIBRATION, { id:'level_6', name:'Chemical Rage sustain window', priority:65, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:190, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Chemical Rage must be ready'},{type:'min_health_pct',value:0.5,message:'Do not start the pressure window already vulnerable to burst'}], permanent:{farm:7,survival:8}, window:{farm:12,pressure:8}, actions:{FARM:13,PRESSURE:8}, recommendation:'Use the sustain to hold an efficient resource loop rather than crossing the map for a low-value fight.' }),
      makeSpike(condition, 'alchemist', ALCHEMIST_CALIBRATION, { id:'radiance', name:'Early Radiance acceleration', priority:88, trigger:[['item_owned',getItem(ITEMS,'radiance').id]], expectedMinute:13, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:390, fadeDurationSec:220, permanent:{farm:27,fight:11,push:8}, window:{farm:21,pressure:12}, actions:{FARM:24,PRESSURE:12}, recommendation:'Complete the next defensive and initiation items quickly; do not spend the lead on repeated empty movement.' }),
      makeSpike(condition, 'alchemist', ALCHEMIST_CALIBRATION, { id:'blink', name:'Blink Chemical Rage entry', priority:93, trigger:[['item_owned',getItem(ITEMS,'blink').id]], expectedMinute:18, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:330, fadeDurationSec:210, requires:[{type:'ultimate_ready',message:'Chemical Rage must be ready before the first committed jump'}], permanent:{initiation:24,fight:15}, window:{connect:22,fight:20}, actions:{CONNECT:23,FIGHT:20}, recommendation:'Use the item lead for a short decisive initiation on a vulnerable core, then convert the kill immediately.' }),
      makeSpike(condition, 'alchemist', ALCHEMIST_CALIBRATION, { id:'bkb', name:'BKB inventory-lead conversion', priority:99, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:22, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:390, fadeDurationSec:250, requires:[{type:'min_health_pct',value:0.65,message:'Enter the lead-conversion fight with full resources'}], permanent:{survival:25,fight:24,objective:15}, window:{fight:27,objective:19}, actions:{FIGHT:28,OBJECTIVE:19}, recommendation:'Force the major fight or Roshan while your accelerated inventory still exceeds the enemy cores.' })
    ]
  }, benchmark);

  profiles.clinkz = makeProfile({
    id: 'clinkz',
    displayName: 'Clinkz',
    roles: ['Carry', 'Mid'],
    archetypes: ['invisible_pickoff', 'backline_hunter', 'tower_converter'],
    draftTags: ['pickoff', 'invisibility', 'physical_burst', 'tower_pressure'],
    vulnerabilities: ['detection', 'control', 'armor'],
    identity: 'Move through unobserved routes, kill a target that lacks dispel or immediate help, and convert the temporary disappearance into tower damage instead of staying visible for a long front-to-back fight.',
    basePower: { farm: 64, fight: 72, push: 74, survival: 52, initiation: 82, objective: 66, mobility: 76 },
    stageCurves: {
      early: { fight: 5, initiation: 8, farm: -3 },
      mid: { fight: 18, initiation: 21, push: 15, objective: 11 },
      late: { fight: 9, push: 12, survival: 6 }
    },
    benchmarkPoints: [[5,335,5],[10,445,8],[15,535,12],[20,600,16],[30,680,22],[40,720,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Orchid before common dispels allow isolated supports and mobile cores to escape the first burst sequence',
      defensiveItem: 'BKB or Linken before detection plus instant control makes every backline approach a trade',
      objectiveTiming: 'after a pickoff removes wave clear or when Desolator can convert the absence into tower damage',
      telemetryCaveat: 'detection coverage, Death Pact target, enemy dispels and safe retreat paths are unavailable'
    },
    telemetryLimitations: ['detection_coverage_not_available', 'death_pact_target_not_available', 'safe_exit_route_not_available'],
    calibration: CLINKZ_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'clinkz', CLINKZ_CALIBRATION, { id:'balanced', name:'Orchid pickoff into tower conversion', scenarioTags:['balanced'], priority:89, itemKeys:['orchid','desolator','bkb','bloodthorn'], reasons:['balanced_draft'], optional:['daedalus'], situational:['linken'] }),
      makePlan(ITEMS, 'clinkz', CLINKZ_CALIBRATION, { id:'control_response', name:'Protected backline access', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['maelstrom','bkb','linken','daedalus'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['orchid'], situational:['satanic'] }),
      makePlan(ITEMS, 'clinkz', CLINKZ_CALIBRATION, { id:'recovery', name:'Skeleton-led lane recovery', scenarioTags:['player_behind'], priority:91, itemKeys:['maelstrom','orchid','bkb','daedalus'], reasons:['player_behind'], optional:['desolator'], situational:['linken'], avoidWhen:['enemy_detection_control_is_unmapped'] }),
      makePlan(ITEMS, 'clinkz', CLINKZ_CALIBRATION, { id:'objective', name:'Pickoff into armor-reduction objective', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['orchid','desolator','bkb','daedalus'], reasons:['player_ahead','objective_window'], optional:['bloodthorn'], situational:['butterfly'], requiredSignals:['wave_clear_target_removed'] })
    ],
    spikes: [
      makeSpike(condition, 'clinkz', CLINKZ_CALIBRATION, { id:'level_6', name:'Death Pact map-hunt window', priority:64, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:190, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Death Pact must be ready'},{type:'min_health_pct',value:0.55,message:'Do not enter an unknown detection zone while chipped'}], permanent:{fight:7,survival:5}, window:{connect:12,fight:10}, actions:{CONNECT:12,FIGHT:10}, recommendation:'Use the first durable Death Pact window to threaten an isolated lane, not to remain visible in a crowded area.' }),
      makeSpike(condition, 'clinkz', CLINKZ_CALIBRATION, { id:'orchid', name:'Orchid solo-kill timing', priority:84, trigger:[['item_owned',getItem(ITEMS,'orchid').id]], expectedMinute:14, earlyToleranceMin:1.8, lateToleranceMin:3.2, activeDurationSec:330, fadeDurationSec:190, permanent:{initiation:19,fight:15}, window:{fight:22,pressure:9}, actions:{FIGHT:22,PRESSURE:9}, recommendation:'Attack a target without dispel only after identifying a retreat route and likely detection response.' }),
      makeSpike(condition, 'clinkz', CLINKZ_CALIBRATION, { id:'desolator', name:'Desolator tower conversion', priority:92, trigger:[['item_owned',getItem(ITEMS,'desolator').id]], expectedMinute:19, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:360, fadeDurationSec:220, permanent:{push:20,objective:16,fight:13}, window:{objective:19,pressure:16}, actions:{OBJECTIVE:20,PRESSURE:16}, recommendation:'After the pickoff, hit the nearest safe tower or Roshan before the missing hero returns.' }),
      makeSpike(condition, 'clinkz', CLINKZ_CALIBRATION, { id:'bkb', name:'BKB backline dive', priority:98, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:24, earlyToleranceMin:2.7, lateToleranceMin:4.8, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Start the backline dive with enough health to survive detection'}], permanent:{survival:24,fight:20,initiation:8}, window:{fight:24,connect:13}, actions:{FIGHT:25,CONNECT:13}, recommendation:'Enter after vision and first control are revealed, eliminate the backline target, then leave before BKB expires.' })
    ]
  }, benchmark);

  return profiles;
}
