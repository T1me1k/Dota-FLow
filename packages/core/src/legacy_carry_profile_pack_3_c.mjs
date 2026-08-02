import { GLOBAL_CALIBRATION, TERRORBLADE_CALIBRATION, getItem, makePlan, makeProfile, makeSpike } from './legacy_carry_profile_pack_3_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.spectre = makeProfile({
    id: 'spectre',
    displayName: 'Spectre',
    roles: ['Carry'],
    archetypes: ['global_connector', 'durable_scaler', 'backline_disruptor'],
    draftTags: ['global_presence', 'late_game', 'durable_carry', 'backline_access'],
    vulnerabilities: ['tempo', 'break', 'mana_pressure'],
    identity: 'Remain on the safest economy route until a global entry can finish an isolated target, then use the post-entry numbers advantage rather than beginning an even fight from the front.',
    basePower: { farm: 63, fight: 70, push: 51, survival: 82, initiation: 67, objective: 52, mobility: 78 },
    stageCurves: {
      early: { farm: -6, fight: -8, survival: 3 },
      mid: { farm: 10, fight: 15, initiation: 16, mobility: 13 },
      late: { fight: 24, survival: 18, objective: 9, push: 7 }
    },
    benchmarkPoints: [[5,330,5],[10,425,8],[15,505,12],[20,575,16],[30,665,22],[40,720,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'first farming or durability item without missing a guaranteed global cleanup',
      defensiveItem: 'Manta, Heart or BKB before break and mana pressure prevent a second spell cycle',
      objectiveTiming: 'after a global cleanup creates numbers or while the enemy must protect separated lanes',
      telemetryCaveat: 'global target isolation, ally follow-up and enemy break availability are unavailable'
    },
    telemetryLimitations: ['global_target_quality_not_available', 'ally_followup_not_available', 'enemy_break_state_not_available'],
    calibration: GLOBAL_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'spectre', GLOBAL_CALIBRATION, { id:'balanced', name:'Radiance global scaling', scenarioTags:['balanced'], priority:86, itemKeys:['radiance','manta','heart','abyssal'], reasons:['balanced_draft'], optional:['butterfly'], situational:['skadi'] }),
      makePlan(ITEMS, 'spectre', GLOBAL_CALIBRATION, { id:'control_response', name:'Protected global backline entry', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['blade_mail','manta','bkb','heart'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['skadi'], situational:['abyssal'] }),
      makePlan(ITEMS, 'spectre', GLOBAL_CALIBRATION, { id:'recovery', name:'Global-safe economy recovery', scenarioTags:['player_behind'], priority:92, itemKeys:['blade_mail','manta','heart','butterfly'], reasons:['player_behind'], optional:['radiance'], situational:['bkb'], avoidWhen:['global_entry_has_no_confirmed_cleanup'] }),
      makePlan(ITEMS, 'spectre', GLOBAL_CALIBRATION, { id:'objective', name:'Global cleanup objective conversion', scenarioTags:['player_ahead','objective_window'], priority:96, itemKeys:['radiance','manta','abyssal','heart'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['skadi'], requiredSignals:['isolated_target_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'spectre', GLOBAL_CALIBRATION, { id:'level_6', name:'First global cleanup window', priority:66, trigger:[['level_gte',6]], expectedMinute:8, earlyToleranceMin:1.3, lateToleranceMin:3, activeDurationSec:210, fadeDurationSec:150, requires:[{type:'ultimate_ready',message:'The global ultimate must be ready'},{type:'min_health_pct',value:0.55,message:'Do not globally enter while too low to survive the first response'}], permanent:{initiation:11,fight:6,mobility:7}, window:{connect:22,fight:9}, actions:{CONNECT:22,FIGHT:9}, recommendation:'Keep farming until a low or isolated target offers a high-confidence cleanup; avoid starting an even fight alone.' }),
      makeSpike(condition, 'spectre', GLOBAL_CALIBRATION, { id:'radiance', name:'Radiance map presence', priority:86, trigger:[['item_owned',getItem(ITEMS,'radiance').id]], expectedMinute:19, earlyToleranceMin:2.8, lateToleranceMin:5, activeDurationSec:420, fadeDurationSec:240, permanent:{farm:18,fight:15,push:9}, window:{farm:13,connect:18}, actions:{FARM:13,CONNECT:18}, recommendation:'Accelerate on the safe side of the map and enter globally only after the enemy commits to another target.' }),
      makeSpike(condition, 'spectre', GLOBAL_CALIBRATION, { id:'manta', name:'Manta global pressure', priority:95, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:25, earlyToleranceMin:3, lateToleranceMin:5.5, activeDurationSec:390, fadeDurationSec:250, requires:[{type:'min_health_pct',value:0.62,message:'Reset before the global entry if the real hero is chipped'}], permanent:{push:17,survival:15,fight:14}, window:{pressure:18,fight:17,connect:12}, actions:{PRESSURE:18,FIGHT:17,CONNECT:12}, recommendation:'Stretch the map with illusions and enter the back line after key control is already committed.' }),
      makeSpike(condition, 'spectre', GLOBAL_CALIBRATION, { id:'manta_abyssal', name:'Manta plus Abyssal isolation threat', priority:99, trigger:[['item_owned',getItem(ITEMS,'manta').id],['item_owned',getItem(ITEMS,'abyssal').id]], expectedMinute:33, earlyToleranceMin:4, lateToleranceMin:6.5, activeDurationSec:420, fadeDurationSec:270, requires:[{type:'ultimate_ready',message:'Global entry should be ready for the isolation attempt'},{type:'min_health_pct',value:0.68,message:'Heal before committing to the isolated target'}], permanent:{fight:25,initiation:20,survival:9,objective:8}, window:{fight:25,objective:12,connect:16}, actions:{FIGHT:26,OBJECTIVE:12,CONNECT:16}, recommendation:'Remove the isolated back-line core, then convert the numbers advantage instead of continuing a deep chase.' })
    ]
  }, benchmark);

  profiles.terrorblade = makeProfile({
    id: 'terrorblade',
    displayName: 'Terrorblade',
    roles: ['Carry'],
    archetypes: ['illusion_sieger', 'cooldown_carry', 'ranged_transformation'],
    draftTags: ['illusions', 'tower_damage', 'high_ground', 'late_game'],
    vulnerabilities: ['magic_burst', 'metamorphosis_cooldown', 'control'],
    identity: 'Farm and pressure with illusions while Metamorphosis is unavailable, then group for one ranged objective window with Sunder protected and disengage when the transformation expires.',
    basePower: { farm: 82, fight: 69, push: 91, survival: 63, initiation: 25, objective: 84, mobility: 45 },
    stageCurves: {
      early: { fight: -5, push: 5, farm: 4 },
      mid: { farm: 18, fight: 17, push: 23, objective: 19 },
      late: { fight: 18, push: 17, survival: 13, objective: 16 }
    },
    benchmarkPoints: [[5,350,5],[10,465,8],[15,560,12],[20,635,16],[30,720,22],[40,765,27]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Manta before the first repeated grouped objective cycle',
      defensiveItem: 'BKB or Satanic before magic burst prevents Sunder and sustained ranged damage',
      objectiveTiming: 'during Metamorphosis with healthy illusions and a protected Sunder target',
      telemetryCaveat: 'Metamorphosis state, remaining duration, illusion positions and Sunder target health are unavailable'
    },
    telemetryLimitations: ['metamorphosis_state_not_available', 'illusion_positions_not_available', 'sunder_target_health_not_available'],
    calibration: TERRORBLADE_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'terrorblade', TERRORBLADE_CALIBRATION, { id:'balanced', name:'Manta Skadi siege scaling', scenarioTags:['balanced'], priority:88, itemKeys:['manta','skadi','bkb','butterfly'], reasons:['balanced_draft'], optional:['dragon_lance'], situational:['satanic'] }),
      makePlan(ITEMS, 'terrorblade', TERRORBLADE_CALIBRATION, { id:'control_response', name:'Protected Metamorphosis damage', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['manta','bkb','satanic','skadi'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['dragon_lance'], situational:['butterfly'] }),
      makePlan(ITEMS, 'terrorblade', TERRORBLADE_CALIBRATION, { id:'recovery', name:'Illusion-led transformation recovery', scenarioTags:['player_behind'], priority:91, itemKeys:['dragon_lance','manta','skadi','bkb'], reasons:['player_behind'], optional:['butterfly'], situational:['satanic'], avoidWhen:['enemy_can_force_every_metamorphosis_defensively'] }),
      makePlan(ITEMS, 'terrorblade', TERRORBLADE_CALIBRATION, { id:'objective', name:'Metamorphosis siege conversion', scenarioTags:['player_ahead','objective_window'], priority:99, itemKeys:['manta','skadi','butterfly','satanic'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['daedalus'], requiredSignals:['metamorphosis_ready_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'terrorblade', TERRORBLADE_CALIBRATION, { id:'level_6', name:'First Sunder survival window', priority:64, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.8, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Sunder must be ready before accepting the low-health exchange'},{type:'min_health_pct',value:0.45,message:'Do not deliberately enter a fight already below a safe Sunder threshold'}], permanent:{survival:9,fight:5}, window:{fight:11,pressure:8}, actions:{FIGHT:10,PRESSURE:8}, recommendation:'Use Sunder as protection for a controlled trade, not as permission to take an unprepared fight.' }),
      makeSpike(condition, 'terrorblade', TERRORBLADE_CALIBRATION, { id:'manta', name:'Manta illusion economy', priority:84, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:17, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:390, fadeDurationSec:230, permanent:{farm:19,push:22,survival:8}, window:{pressure:21,farm:11}, actions:{PRESSURE:22,FARM:11}, recommendation:'Pressure lanes with illusions and preserve Metamorphosis for a team action or building rather than routine farm.' }),
      makeSpike(condition, 'terrorblade', TERRORBLADE_CALIBRATION, { id:'skadi', name:'Skadi Metamorphosis fight', priority:95, trigger:[['item_owned',getItem(ITEMS,'skadi').id]], expectedMinute:24, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.65,message:'Heal before grouping for the Metamorphosis fight'}], permanent:{fight:21,survival:15,objective:13}, window:{fight:24,objective:18}, actions:{FIGHT:25,OBJECTIVE:18}, recommendation:'Group for Roshan or a tower during Metamorphosis and disengage before the ranged transformation ends.' }),
      makeSpike(condition, 'terrorblade', TERRORBLADE_CALIBRATION, { id:'bkb', name:'BKB high-ground window', priority:99, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:28, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:360, fadeDurationSec:250, requires:[{type:'ultimate_ready',message:'Sunder should be available for the protected siege'},{type:'min_health_pct',value:0.68,message:'Start the siege at high health'}], permanent:{survival:25,fight:18,push:10,objective:14}, window:{objective:23,fight:20,pressure:13}, actions:{OBJECTIVE:24,FIGHT:20,PRESSURE:13}, recommendation:'Force the structure while BKB and Metamorphosis overlap, then reset instead of fighting after both protections expire.' })
    ]
  }, benchmark);

  return profiles;
}
