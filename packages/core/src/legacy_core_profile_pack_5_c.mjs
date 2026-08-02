import {
  MARCI_CALIBRATION,
  DAWNBREAKER_CALIBRATION,
  getItem,
  makePlan,
  makeProfile,
  makeSpike
} from './legacy_core_profile_pack_5_shared.mjs';

export function createProfileGroup({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.marci = makeProfile({
    id: 'marci',
    displayName: 'Marci',
    role: 'carry',
    roles: ['Carry', 'Offlane', 'Support'],
    archetypes: ['rebound_initiator', 'unleash_brawler', 'single_target_lock'],
    draftTags: ['mobility', 'physical_burst', 'ally_reposition', 'target_lock'],
    vulnerabilities: ['kite', 'control', 'disarm'],
    identity: 'Use Rebound through a protected ally to arrive from an unexpected angle, Dispose the target toward follow-up rather than away from it, and spend Unleash only when BKB or allied control prevents the target from escaping the full pulse sequence.',
    basePower: { farm: 56, fight: 81, push: 49, survival: 65, initiation: 78, objective: 62, mobility: 78 },
    stageCurves: {
      early: { fight: 12, initiation: 9, survival: 5 },
      mid: { fight: 23, initiation: 17, mobility: 12, objective: 9 },
      late: { fight: 13, survival: 11, objective: 8 }
    },
    benchmarkPoints: [[5,335,5],[10,435,8],[15,515,12],[20,580,16],[30,665,22],[40,705,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Armlet or BKB before enemy disengage and control can waste the first Unleash sequence',
      defensiveItem: 'BKB before silence, stun chains or disarm can interrupt the full target lock',
      objectiveTiming: 'after Rebound and Dispose isolate one defender or when Unleash can remain on Roshan without being kited',
      telemetryCaveat: 'Rebound partner, Dispose angle, Unleash pulse state and enemy disengage cooldowns are unavailable'
    },
    telemetryLimitations: ['rebound_partner_not_available', 'dispose_angle_not_available', 'unleash_pulse_state_not_available'],
    calibration: MARCI_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'marci', 'carry', MARCI_CALIBRATION, { id:'balanced', name:'Armlet brawl into protected Unleash', scenarioTags:['balanced'], priority:90, itemKeys:['armlet','bkb','basher','satanic'], reasons:['balanced_draft'], optional:['echo_sabre'], situational:['abyssal'] }),
      makePlan(ITEMS, 'marci', 'carry', MARCI_CALIBRATION, { id:'control_response', name:'BKB-first target lock', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['echo_sabre','bkb','basher','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['armlet'], situational:['abyssal'] }),
      makePlan(ITEMS, 'marci', 'carry', MARCI_CALIBRATION, { id:'recovery', name:'Low-risk brawl recovery', scenarioTags:['player_behind'], priority:92, itemKeys:['armlet','bkb','satanic','basher'], reasons:['player_behind'], optional:['echo_sabre'], situational:['abyssal'], avoidWhen:['no_safe_rebound_partner'] }),
      makePlan(ITEMS, 'marci', 'carry', MARCI_CALIBRATION, { id:'objective', name:'Unleash objective lock', scenarioTags:['player_ahead','objective_window'], priority:98, itemKeys:['armlet','bkb','basher','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['satanic'], situational:['abyssal'], requiredSignals:['stable_unleash_target_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'marci', MARCI_CALIBRATION, { id:'level_6', name:'Unleash level 1', priority:68, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.1, lateToleranceMin:2.5, activeDurationSec:185, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Unleash must be ready'},{type:'min_health_pct',value:0.58,message:'Do not begin the Unleash sequence too low to survive the counterattack'}], permanent:{fight:11,initiation:5}, window:{fight:20,connect:13}, actions:{FIGHT:20,CONNECT:13}, recommendation:'Rebound through an ally and commit only when Dispose or allied control keeps the target inside the pulse sequence.' }),
      makeSpike(condition, 'marci', MARCI_CALIBRATION, { id:'bkb', name:'BKB Unleash timing', priority:95, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:18, earlyToleranceMin:2, lateToleranceMin:3.8, activeDurationSec:360, fadeDurationSec:220, requires:[{type:'ultimate_ready',message:'Unleash must be ready'},{type:'min_health_pct',value:0.65,message:'Start the BKB commitment healthy enough to finish the pulse sequence'}], permanent:{survival:25,fight:23}, window:{fight:28,connect:12}, actions:{FIGHT:29,CONNECT:12}, recommendation:'Force a short fight before BKB shortens and keep Rebound available for pursuit or exit.' }),
      makeSpike(condition, 'marci', MARCI_CALIBRATION, { id:'basher', name:'Basher target lock', priority:98, trigger:[['item_owned',getItem(ITEMS,'basher').id]], expectedMinute:24, earlyToleranceMin:2.7, lateToleranceMin:4.8, activeDurationSec:400, fadeDurationSec:240, permanent:{initiation:18,fight:19,objective:7}, window:{fight:22,objective:10}, actions:{FIGHT:24,OBJECTIVE:10}, recommendation:'Choose one core for the full Unleash duration and do not waste pulses changing targets.' }),
      makeSpike(condition, 'marci', MARCI_CALIBRATION, { id:'assault', name:'Assault Cuirass objective brawl', priority:99, trigger:[['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:31, earlyToleranceMin:3.2, lateToleranceMin:5.5, activeDurationSec:450, fadeDurationSec:270, permanent:{fight:22,objective:21,push:12,survival:12}, window:{objective:21,fight:19}, actions:{OBJECTIVE:22,FIGHT:20}, recommendation:'Turn the armor advantage and target lock into Roshan or high ground before the enemy can reset.' })
    ]
  }, benchmark);

  profiles.dawnbreaker = makeProfile({
    id: 'dawnbreaker',
    displayName: 'Dawnbreaker',
    role: 'carry',
    roles: ['Carry', 'Offlane'],
    archetypes: ['global_frontliner', 'starbreaker_brawler', 'sustain_objective_core'],
    draftTags: ['global_connect', 'healing', 'frontline', 'physical_burst'],
    vulnerabilities: ['break', 'kite', 'interrupt'],
    identity: 'Keep farming a side lane while Solar Guardian can turn the next allied engagement, land behind the threatened teammate rather than in the center of enemy control, and use Starbreaker plus Luminosity sustain to convert the global save into a tower or Roshan.',
    basePower: { farm: 61, fight: 76, push: 65, survival: 76, initiation: 70, objective: 72, mobility: 66 },
    stageCurves: {
      early: { fight: 9, survival: 8, objective: 4 },
      mid: { farm: 10, fight: 21, initiation: 16, objective: 16, survival: 10 },
      late: { fight: 12, survival: 13, objective: 11, push: 8 }
    },
    benchmarkPoints: [[5,340,5],[10,445,8],[15,525,12],[20,590,16],[30,675,22],[40,715,26]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Echo Sabre or Desolator before side-lane farming loses the ability to convert a global arrival into a kill',
      defensiveItem: 'BKB before control and Starbreaker interruption can punish the Solar Guardian landing',
      objectiveTiming: 'after Solar Guardian saves an ally or creates a numbers advantage and Luminosity sustain can cover the response',
      telemetryCaveat: 'Solar Guardian landing safety, Luminosity count, Starbreaker interruption risk and allied fight geometry are unavailable'
    },
    telemetryLimitations: ['solar_guardian_landing_not_available', 'luminosity_count_not_available', 'starbreaker_interrupt_risk_not_available'],
    calibration: DAWNBREAKER_CALIBRATION,
    buildPlans: [
      makePlan(ITEMS, 'dawnbreaker', 'carry', DAWNBREAKER_CALIBRATION, { id:'balanced', name:'Echo global conversion into BKB', scenarioTags:['balanced'], priority:89, itemKeys:['echo_sabre','desolator','bkb','assault_cuirass'], reasons:['balanced_draft'], optional:['satanic'], situational:['heart'] }),
      makePlan(ITEMS, 'dawnbreaker', 'carry', DAWNBREAKER_CALIBRATION, { id:'control_response', name:'Protected Solar Guardian landing', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:100, itemKeys:['echo_sabre','bkb','sange_and_yasha','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['desolator'], situational:['heart'] }),
      makePlan(ITEMS, 'dawnbreaker', 'carry', DAWNBREAKER_CALIBRATION, { id:'recovery', name:'Side-lane global recovery', scenarioTags:['player_behind'], priority:93, itemKeys:['echo_sabre','bkb','heart','assault_cuirass'], reasons:['player_behind'], optional:['sange_and_yasha'], situational:['satanic'], avoidWhen:['allied_fights_start_without_landing_space'] }),
      makePlan(ITEMS, 'dawnbreaker', 'carry', DAWNBREAKER_CALIBRATION, { id:'objective', name:'Solar Guardian objective conversion', scenarioTags:['player_ahead','objective_window'], priority:99, itemKeys:['desolator','bkb','assault_cuirass','satanic'], reasons:['player_ahead','objective_window'], optional:['echo_sabre'], situational:['heart'], requiredSignals:['safe_global_landing_confirmed'] })
    ],
    spikes: [
      makeSpike(condition, 'dawnbreaker', DAWNBREAKER_CALIBRATION, { id:'level_6', name:'Solar Guardian global save', priority:70, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.1, lateToleranceMin:2.5, activeDurationSec:190, fadeDurationSec:130, requires:[{type:'ultimate_ready',message:'Solar Guardian must be ready'},{type:'min_health_pct',value:0.58,message:'Land healthy enough to remain in the Starbreaker follow-up'}], permanent:{initiation:16,fight:7,survival:5}, window:{connect:23,fight:13}, actions:{CONNECT:24,FIGHT:13}, recommendation:'Continue farming until an allied engagement offers a safe landing behind the threatened teammate.' }),
      makeSpike(condition, 'dawnbreaker', DAWNBREAKER_CALIBRATION, { id:'desolator', name:'Desolator Starbreaker conversion', priority:87, trigger:[['item_owned',getItem(ITEMS,'desolator').id]], expectedMinute:17, earlyToleranceMin:2, lateToleranceMin:3.6, activeDurationSec:340, fadeDurationSec:210, permanent:{fight:18,objective:16,push:13}, window:{fight:19,objective:14}, actions:{FIGHT:20,OBJECTIVE:14}, recommendation:'After the global arrival, convert the armor reduction into a tower or Roshan instead of chasing across the map.' }),
      makeSpike(condition, 'dawnbreaker', DAWNBREAKER_CALIBRATION, { id:'bkb', name:'BKB global commitment', priority:97, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:23, earlyToleranceMin:2.6, lateToleranceMin:4.5, activeDurationSec:390, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Solar Guardian must be ready for the global commitment'},{type:'min_health_pct',value:0.65,message:'Begin the landing healthy enough to survive after BKB'}], permanent:{survival:26,fight:21,initiation:8}, window:{fight:25,connect:17,objective:13}, actions:{FIGHT:26,CONNECT:17,OBJECTIVE:13}, recommendation:'Land after the first control is shown and use BKB to finish Starbreaker without interruption.' }),
      makeSpike(condition, 'dawnbreaker', DAWNBREAKER_CALIBRATION, { id:'assault', name:'Assault Cuirass global objective chain', priority:99, trigger:[['item_owned',getItem(ITEMS,'assault_cuirass').id]], expectedMinute:31, earlyToleranceMin:3.2, lateToleranceMin:5.5, activeDurationSec:450, fadeDurationSec:270, permanent:{fight:21,objective:23,push:16,survival:12}, window:{objective:23,fight:18}, actions:{OBJECTIVE:24,FIGHT:19}, recommendation:'Use the armor and sustain advantage to chain the saved fight directly into Roshan or high ground.' })
    ]
  }, benchmark);

  return profiles;
}
