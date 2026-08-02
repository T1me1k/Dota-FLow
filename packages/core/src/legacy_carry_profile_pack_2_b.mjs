import { CALIBRATION, getItem, makePlan, makeSpike, makeProfile } from './legacy_carry_profile_pack_2_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.wraith_king = makeProfile({
    id: 'wraith_king',
    displayName: 'Wraith King',
    roles: ['Carry'],
    archetypes: ['two_life_frontliner', 'skeleton_pusher', 'blink_initiator'],
    draftTags: ['frontline', 'second_life', 'tower_pressure', 'initiation'],
    vulnerabilities: ['mana_burn', 'kite', 'break'],
    identity: 'Spend the first life to occupy dangerous space only when Reincarnation is secured, use skeleton pressure to force reactions, and Blink on the target whose death converts the second life into an objective.',
    basePower: { farm: 60, fight: 72, push: 69, survival: 88, initiation: 63, objective: 76, mobility: 36 },
    stageCurves: {
      early: { survival: 13, fight: 5, push: 4 },
      mid: { fight: 17, survival: 15, initiation: 14, objective: 12 },
      late: { fight: 12, push: 10, objective: 11, mobility: -2 }
    },
    benchmarkPoints: [[5,335,5],[10,435,8],[15,515,12],[20,580,16],[30,665,22],[40,710,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Radiance or Desolator before the enemy can ignore skeleton pressure and kite both lives',
      defensiveItem: 'BKB before Reincarnation respawn can be immediately controlled again',
      objectiveTiming: 'while Reincarnation is ready and skeletons or a pickoff create sustained building pressure',
      telemetryCaveat: 'exact Reincarnation mana availability and skeleton charge count are not observable'
    },
    telemetryLimitations: ['reincarnation_mana_exactness_not_available', 'skeleton_charge_count_not_available'],
    buildPlans: [
      makePlan(ITEMS, 'wraith_king', CALIBRATION, { id:'balanced', name:'Radiance two-life pressure', scenarioTags:['balanced'], priority:86, itemKeys:['armlet','radiance','blink','assault_cuirass'], reasons:['balanced_draft'], optional:['bkb'], situational:['satanic'] }),
      makePlan(ITEMS, 'wraith_king', CALIBRATION, { id:'control_response', name:'Protected second-life initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['armlet','blink','bkb','assault_cuirass'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['satanic'] }),
      makePlan(ITEMS, 'wraith_king', CALIBRATION, { id:'recovery', name:'Skeleton economy recovery', scenarioTags:['player_behind'], priority:87, itemKeys:['armlet','radiance','blink','bkb'], reasons:['player_behind'], optional:['assault_cuirass'], situational:['satanic'], avoidWhen:['enemy_can_invade_radiance_route'] }),
      makePlan(ITEMS, 'wraith_king', CALIBRATION, { id:'objective', name:'Desolator skeleton conversion', scenarioTags:['player_ahead','objective_window'], priority:97, itemKeys:['armlet','desolator','blink','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['satanic'], requiredSignals:['reincarnation_ready'] })
    ],
    spikes: [
      makeSpike(condition, 'wraith_king', CALIBRATION, { id:'level_6', name:'Reincarnation first-life occupation', priority:68, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Reincarnation must be ready'},{type:'min_mana_pct',value:0.35,message:'Preserve enough mana for Reincarnation'}], permanent:{survival:18,fight:7}, window:{fight:16,pressure:9}, actions:{FIGHT:16,PRESSURE:9}, recommendation:'Stand in front only when the second life is secured and allies can punish the enemy commitment.' }),
      makeSpike(condition, 'wraith_king', CALIBRATION, { id:'radiance', name:'Radiance skeleton map pressure', priority:86, trigger:[['item_owned',getItem(ITEMS,'radiance').id]], expectedMinute:18, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:360, fadeDurationSec:220, permanent:{farm:17,fight:15,push:13}, window:{pressure:17,fight:14}, actions:{PRESSURE:18,FIGHT:14,FARM:8}, recommendation:'Push one lane with skeletons, show the hero only where Reincarnation makes the enemy response inefficient.' }),
      makeSpike(condition, 'wraith_king', CALIBRATION, { id:'blink', name:'Blink stun initiation timing', priority:94, trigger:[['item_owned',getItem(ITEMS,'blink').id]], expectedMinute:23, earlyToleranceMin:2.8, lateToleranceMin:5, activeDurationSec:330, fadeDurationSec:220, requires:[{type:'ultimate_ready',message:'Reincarnation should be ready for the Blink entry'},{type:'min_mana_pct',value:0.4,message:'Keep mana for stun and Reincarnation'}], permanent:{initiation:24,fight:15,mobility:11}, window:{connect:21,fight:20}, actions:{CONNECT:22,FIGHT:20}, recommendation:'Disappear from the wave, stun the target that unlocks the objective, and force the enemy to spend cooldowns on the first life.' }),
      makeSpike(condition, 'wraith_king', CALIBRATION, { id:'blink_assault', name:'Blink plus Assault frontline peak', priority:98, trigger:[['item_owned',getItem(ITEMS,'blink').id],['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:30, earlyToleranceMin:3.5, lateToleranceMin:6, activeDurationSec:420, fadeDurationSec:260, requires:[{type:'ultimate_ready',message:'Reincarnation must be ready for the decisive objective'}], permanent:{fight:22,push:17,survival:17,objective:19}, window:{fight:22,objective:21}, actions:{FIGHT:23,OBJECTIVE:22,PRESSURE:14}, recommendation:'Initiate near the objective, absorb the first response, and let the armor advantage carry the second life through the conversion.' })
    ]
  }, benchmark);

  profiles.chaos_knight = makeProfile({
    id: 'chaos_knight',
    displayName: 'Chaos Knight',
    roles: ['Carry'],
    archetypes: ['illusion_burst_carry', 'single_target_initiator', 'frontline_core'],
    draftTags: ['illusions', 'burst', 'reality_rift', 'tower_damage'],
    vulnerabilities: ['aoe_clear', 'kite', 'mana_pressure'],
    identity: 'Use Reality Rift and Phantasm for short, overwhelming single-target fights, then turn surviving illusions into tower damage before area clear and long-range kiting can reset the engagement.',
    basePower: { farm: 52, fight: 81, push: 74, survival: 76, initiation: 67, objective: 70, mobility: 45 },
    stageCurves: {
      early: { fight: 10, survival: 7, farm: -6 },
      mid: { fight: 21, push: 18, initiation: 13, objective: 12 },
      late: { fight: 14, push: 11, survival: 10, farm: 3 }
    },
    benchmarkPoints: [[5,330,5],[10,425,8],[15,505,12],[20,570,16],[30,650,22],[40,700,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Armlet and Manta before enemy area clear scales past the first Phantasm objective cycle',
      defensiveItem: 'BKB before Reality Rift follow-through is stopped by layered control',
      objectiveTiming: 'after Phantasm removes one core or when enemy area damage is unavailable',
      telemetryCaveat: 'enemy area-damage cooldowns and surviving illusion count are not observable'
    },
    telemetryLimitations: ['enemy_aoe_cooldowns_not_available', 'surviving_illusion_count_not_available'],
    buildPlans: [
      makePlan(ITEMS, 'chaos_knight', CALIBRATION, { id:'balanced', name:'Armlet Manta burst core', scenarioTags:['balanced'], priority:88, itemKeys:['armlet','manta','heart','assault_cuirass'], reasons:['balanced_draft'], optional:['bkb'], situational:['basher'] }),
      makePlan(ITEMS, 'chaos_knight', CALIBRATION, { id:'control_response', name:'Protected Reality Rift burst', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['echo_sabre','bkb','manta','heart'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['assault_cuirass'] }),
      makePlan(ITEMS, 'chaos_knight', CALIBRATION, { id:'recovery', name:'Manta illusion recovery', scenarioTags:['player_behind'], priority:86, itemKeys:['armlet','manta','heart','assault_cuirass'], reasons:['player_behind'], optional:['bkb'], situational:['satanic'], avoidWhen:['enemy_aoe_clear_controls_every_wave'] }),
      makePlan(ITEMS, 'chaos_knight', CALIBRATION, { id:'objective', name:'Phantasm tower collapse', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['armlet','manta','assault_cuirass','heart'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['basher'], requiredSignals:['phantasm_ready','enemy_aoe_spent'] })
    ],
    spikes: [
      makeSpike(condition, 'chaos_knight', CALIBRATION, { id:'level_6', name:'First Phantasm isolation window', priority:69, trigger:[['level_gte',6]], expectedMinute:7.5, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Phantasm must be ready'},{type:'min_health_pct',value:0.6,message:'Do not start the first illusion fight while chipped'}], permanent:{fight:9,push:6,initiation:5}, window:{fight:18,objective:9}, actions:{FIGHT:18,OBJECTIVE:9,CONNECT:8}, recommendation:'Rift one reachable target, use Phantasm for the kill, and hit the nearest tower before the illusions expire.' }),
      makeSpike(condition, 'chaos_knight', CALIBRATION, { id:'armlet', name:'Armlet burst timing', priority:76, trigger:[['item_owned',getItem(ITEMS,'armlet').id]], expectedMinute:11, earlyToleranceMin:1.5, lateToleranceMin:3, activeDurationSec:270, fadeDurationSec:180, permanent:{fight:17,survival:9}, window:{fight:19,pressure:9}, actions:{FIGHT:19,PRESSURE:9}, recommendation:'Take short Reality Rift trades and leave before area damage turns the fight into a long reset.' }),
      makeSpike(condition, 'chaos_knight', CALIBRATION, { id:'manta', name:'Manta Phantasm pressure', priority:90, trigger:[['item_owned',getItem(ITEMS,'manta').id]], expectedMinute:18, earlyToleranceMin:2.2, lateToleranceMin:4, activeDurationSec:330, fadeDurationSec:210, requires:[{type:'ultimate_ready',message:'Phantasm should be ready for the Manta timing'}], permanent:{fight:16,push:20,survival:11}, window:{fight:19,pressure:18,objective:13}, actions:{FIGHT:20,PRESSURE:18,OBJECTIVE:13}, recommendation:'Overwhelm one target with both illusion sources and convert surviving units into tower damage.' }),
      makeSpike(condition, 'chaos_knight', CALIBRATION, { id:'heart', name:'Heart illusion frontline peak', priority:98, trigger:[['item_owned',getItem(ITEMS,'heart').id]], expectedMinute:27, earlyToleranceMin:3.2, lateToleranceMin:5.5, activeDurationSec:420, fadeDurationSec:250, requires:[{type:'min_health_pct',value:0.7,message:'Start the long fight with full illusion durability'}], permanent:{fight:24,push:15,survival:28,objective:14}, window:{fight:23,objective:16}, actions:{FIGHT:24,OBJECTIVE:17,PRESSURE:13}, recommendation:'Absorb the first area-damage cycle, then re-enter with durable illusions and finish the objective.' })
    ]
  }, benchmark);

  return profiles;
}
