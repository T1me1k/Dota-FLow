import { createExplicitProfilePack } from './explicit-profile-pack.mjs';

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-macro-support-b-v2',
  calibrationSource: 'hero-specific macro and teamfight support strategic review; live recordings pending',
  calibrationConfidence: 0.70,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const DEFINITIONS = [
  {
    id: 'elder_titan', displayName: 'Elder Titan', role: 'support', roles: ['Soft Support','Offlane'],
    archetypes: ['setup_support','teamfight_amplifier','counter_initiator'],
    draftTags: ['sleep_setup','armor_reduction','teamfight','counter_initiation'],
    vulnerabilities: ['control','burst','dispel'],
    identity: 'Scout and amplify with Astral Spirit, convert a confirmed Stomp into Earth Splitter, and remain close enough for Natural Order without becoming the first easy target.',
    basePower: { farm:39, fight:80, push:37, survival:61, initiation:75, objective:52, mobility:54 },
    stageCurves: { early:{fight:9,survival:6,initiation:6}, mid:{fight:21,initiation:18,objective:8,mobility:7}, late:{fight:12,initiation:9,objective:5,survival:-2} },
    benchmarkPoints: [[5,190,4],[10,250,7],[20,330,12],[40,410,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Force Staff or Aghanim Scepter before repeated close-range setup', defensiveItem:'BKB or Glimmer when control prevents the Stomp follow-up', objectiveTiming:'after Spirit vision and a confirmed disable create safe access' },
    plans: [
      { id:'spirit_setup', name:'Spirit and Stomp setup', scenarioTags:['balanced','team_lacks_control'], priority:91, items:['arcane_boots','force_staff','scepter','bkb'], reasons:['balanced_draft','team_lacks_control'], optional:['glimmer_cape'] },
      { id:'control_response', name:'Protected counter-initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','glimmer_cape','force_staff','bkb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Low-economy setup utility', scenarioTags:['player_behind'], priority:86, items:['tranquil_boots','drums','force_staff','glimmer_cape'], reasons:['player_behind'], optional:['scepter'] },
      { id:'objective', name:'Natural Order objective control', scenarioTags:['objective_window','player_ahead'], priority:94, items:['arcane_boots','drums','scepter','bkb'], reasons:['objective_window','player_ahead'], optional:['guardian_greaves'] }
    ],
    spikes: [
      { id:'level_6', name:'Earth Splitter conversion window', priority:82, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Earth Splitter must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for Stomp and Earth Splitter'}], permanent:{fight:10,initiation:8}, window:{fight:23,connect:15}, actions:{FIGHT:24,CONNECT:16}, recommendation:'Use Spirit vision to confirm the angle, land Stomp first, and cast Earth Splitter through the disabled formation.' },
      { id:'force_staff', name:'Reliable setup positioning', priority:85, trigger:[['item_owned','force_staff']], expectedMinute:15, requires:[{type:'min_health_pct',value:0.5,message:'Reset before walking into Natural Order range'}], permanent:{survival:11,mobility:13,initiation:7}, window:{fight:15,connect:14}, actions:{FIGHT:16,CONNECT:15}, recommendation:'Use Force Staff to preserve the Stomp angle or rescue the ally holding enemies inside the setup.' },
      { id:'scepter', name:'Protected Astral Spirit commitment', priority:93, trigger:[['item_owned','scepter']], expectedMinute:23, requires:[{type:'min_mana_pct',value:0.55,message:'Refill before the full Spirit and Stomp sequence'}], permanent:{fight:19,survival:17,initiation:12}, window:{fight:25,objective:11}, actions:{FIGHT:26,OBJECTIVE:12}, recommendation:'Cross the dangerous area with the protected Spirit window and keep Natural Order on the highest-value targets.' },
      { id:'scepter_bkb', name:'Uninterrupted teamfight setup', priority:98, trigger:[['item_owned','scepter'],['item_owned','bkb']], expectedMinute:31, requires:[{type:'ultimate_ready',message:'Earth Splitter should be ready for the protected commitment'}], permanent:{fight:22,survival:24,initiation:15,objective:8}, window:{fight:28,objective:16}, actions:{FIGHT:29,OBJECTIVE:17}, recommendation:'Commit through the first control layer, complete Stomp into Earth Splitter, then hold the objective with Natural Order.' }
    ]
  },
  {
    id: 'largo', displayName: 'Largo', role: 'support', roles: ['Soft Support','Hard Support'],
    archetypes: ['buff_support','mobility_enabler','teamfight_conductor'],
    draftTags: ['ally_buffs','movement_speed','teamfight','disengage'],
    vulnerabilities: ['burst','control','silence'],
    identity: 'Sequence team buffs and movement tools before the commitment, then preserve the remaining utility to accelerate allies into a winning chase or extract them from a losing fight.',
    basePower: { farm:34, fight:69, push:44, survival:56, initiation:49, objective:61, mobility:78 },
    stageCurves: { early:{fight:7,mobility:11,survival:3}, mid:{fight:17,mobility:19,objective:13,survival:7}, late:{fight:8,mobility:12,objective:9,survival:-2} },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Drums and Force Staff before repeated team movement windows', defensiveItem:'Glimmer or Lotus when silence and burst stop the second utility cast', objectiveTiming:'after team buffs are active and an exit path remains available' },
    calibration: { calibrationConfidence:0.62, calibrationSource:'conservative Largo support model; exact song state, buff target and tongue interaction telemetry unavailable', telemetryLimitations:['ability_specific_state_not_available','ally_buff_target_not_available'] },
    plans: [
      { id:'team_tempo', name:'Team movement tempo', scenarioTags:['balanced','objective_window'], priority:90, items:['arcane_boots','drums','force_staff','guardian_greaves'], reasons:['balanced_draft','objective_window'], optional:['solar_crest'] },
      { id:'control_response', name:'Protected utility sequence', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','glimmer_cape','force_staff','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['guardian_greaves'] },
      { id:'recovery', name:'Low-economy movement support', scenarioTags:['player_behind'], priority:86, items:['tranquil_boots','drums','force_staff','glimmer_cape'], reasons:['player_behind'], optional:['solar_crest'] },
      { id:'objective', name:'Buffed objective formation', scenarioTags:['objective_window','player_ahead'], priority:94, items:['arcane_boots','drums','solar_crest','guardian_greaves'], reasons:['objective_window','player_ahead'], optional:['pipe'] }
    ],
    spikes: [
      { id:'level_6', name:'First full teamfight performance', priority:76, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'The teamfight performance must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for the complete utility sequence'}], permanent:{fight:8,mobility:9,objective:5}, window:{fight:18,connect:20}, actions:{FIGHT:19,CONNECT:21}, recommendation:'Start the performance before allies commit and keep the final movement tool available for chase or disengage.' },
      { id:'drums', name:'Reliable team movement cycle', priority:84, trigger:[['item_owned','drums']], expectedMinute:14, permanent:{mobility:15,objective:9,fight:8}, window:{connect:20,objective:13}, actions:{CONNECT:21,OBJECTIVE:14}, recommendation:'Group on a known objective route, activate the movement window together, and avoid splitting the buff across separate fights.' },
      { id:'force_staff', name:'Second-position save access', priority:88, trigger:[['item_owned','force_staff']], expectedMinute:18, requires:[{type:'min_health_pct',value:0.48,message:'Do not expose the save item from critical health'}], permanent:{survival:14,mobility:12,initiation:5}, window:{fight:17,connect:13}, actions:{FIGHT:18,CONNECT:14}, recommendation:'Stay behind the first line and use Force Staff on the ally whose reposition preserves the whole formation.' },
      { id:'drums_greaves', name:'Sustained objective performance', priority:95, trigger:[['item_owned','drums'],['item_owned','guardian_greaves']], expectedMinute:28, requires:[{type:'min_mana_pct',value:0.5,message:'Refill before a long objective sequence'}], permanent:{fight:17,survival:20,mobility:12,objective:18}, window:{objective:24,fight:18}, actions:{OBJECTIVE:25,FIGHT:19}, recommendation:'Use the movement buff to establish the area, then hold Greaves for the first meaningful return damage.' }
    ]
  },
  {
    id: 'ogre_magi', displayName: 'Ogre Magi', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['lane_tank','single_target_disabler','carry_buffer'],
    draftTags: ['lane_pressure','stun','ally_buff','frontline_support'],
    vulnerabilities: ['kite','burst','dispel'],
    identity: 'Win the short lane trade with superior durability, keep Bloodlust on the ally converting map pressure, and use Fireblast as reliable first control rather than gambling the fight on Multicast.',
    basePower: { farm:33, fight:68, push:43, survival:79, initiation:59, objective:57, mobility:35 },
    stageCurves: { early:{fight:13,survival:16,initiation:6}, mid:{fight:13,survival:10,objective:12,initiation:8}, late:{fight:2,survival:4,objective:8,mobility:-3} },
    benchmarkPoints: [[5,185,4],[10,245,7],[20,320,12],[40,400,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Drums or Solar Crest before repeated Bloodlust objective cycles', defensiveItem:'Force Staff or Lotus when the frontline position becomes punishable', objectiveTiming:'when Bloodlust and support auras are active on the objective core' },
    plans: [
      { id:'bloodlust_utility', name:'Bloodlust team utility', scenarioTags:['balanced','objective_window'], priority:91, items:['arcane_boots','drums','solar_crest','lotus_orb'], reasons:['balanced_draft','objective_window'], optional:['force_staff'] },
      { id:'control_response', name:'Durable control response', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['arcane_boots','force_staff','glimmer_cape','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['pipe'] },
      { id:'recovery', name:'Low-economy frontline utility', scenarioTags:['player_behind'], priority:85, items:['tranquil_boots','drums','force_staff','glimmer_cape'], reasons:['player_behind'], optional:['solar_crest'] },
      { id:'objective', name:'Buffed core objective support', scenarioTags:['objective_window','player_ahead'], priority:94, items:['arcane_boots','solar_crest','pipe','guardian_greaves'], reasons:['objective_window','player_ahead'], optional:['lotus_orb'] }
    ],
    spikes: [
      { id:'level_6', name:'Multicast control breakpoint', priority:75, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'min_mana_pct',value:0.42,message:'Keep mana for repeated Fireblast and Ignite casts'}], permanent:{fight:8,initiation:7}, window:{fight:17,connect:11}, actions:{FIGHT:18,CONNECT:12}, recommendation:'Start with reliable Fireblast on the target allies can reach; treat Multicast as upside, not as the plan.' },
      { id:'drums', name:'Bloodlust movement pressure', priority:82, trigger:[['item_owned','drums']], expectedMinute:14, permanent:{mobility:8,objective:12,survival:5}, window:{connect:15,objective:16}, actions:{CONNECT:16,OBJECTIVE:17}, recommendation:'Bloodlust the objective core, move as a unit, and keep your stun for the first defender who commits.' },
      { id:'solar_crest', name:'Single-core acceleration', priority:88, trigger:[['item_owned','solar_crest']], expectedMinute:20, permanent:{fight:11,survival:9,objective:15}, window:{objective:20,fight:14}, actions:{OBJECTIVE:21,FIGHT:15}, recommendation:'Stack Bloodlust and Solar Crest on the ally actually hitting the objective instead of spreading buffs across idle heroes.' },
      { id:'lotus_orb', name:'Frontline dispel utility', priority:94, trigger:[['item_owned','lotus_orb']], expectedMinute:27, requires:[{type:'min_health_pct',value:0.55,message:'Enter the frontline with enough health to cast twice'}], permanent:{fight:15,survival:20,initiation:7}, window:{fight:21,objective:12}, actions:{FIGHT:22,OBJECTIVE:13}, recommendation:'Apply Lotus before the key disable lands, then use your own stun to punish the enemy follow-up.' }
    ]
  },
  {
    id: 'undying', displayName: 'Undying', role: 'support', roles: ['Hard Support','Offlane'],
    archetypes: ['lane_dominator','zone_controller','sustain_frontliner'],
    draftTags: ['early_pressure','tombstone','sustain','frontline'],
    vulnerabilities: ['kite','burst','dispel'],
    identity: 'Exploit the early strength gap with Decay, place Tombstone where enemies must either retreat or overcommit, and convert the surviving team into an immediate tower or Roshan area.',
    basePower: { farm:31, fight:77, push:48, survival:82, initiation:47, objective:68, mobility:31 },
    stageCurves: { early:{fight:18,survival:17,objective:12}, mid:{fight:13,survival:12,objective:15}, late:{fight:-7,survival:-3,objective:4,mobility:-4} },
    benchmarkPoints: [[5,190,4],[10,250,7],[20,325,12],[40,400,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Mekansm before the first grouped objective fights', defensiveItem:'Force Staff, Pipe, or Greaves when Tombstone placement requires frontline exposure', objectiveTiming:'immediately after Tombstone wins the contested area' },
    plans: [
      { id:'tombstone_greaves', name:'Tombstone sustain formation', scenarioTags:['balanced','objective_window'], priority:94, items:['arcane_boots','mekansm','guardian_greaves','pipe'], reasons:['balanced_draft','objective_window'], optional:['shivas_guard'] },
      { id:'control_response', name:'Protected Tombstone placement', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','force_staff','lotus_orb','guardian_greaves'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['pipe'] },
      { id:'recovery', name:'Cheap sustain and save utility', scenarioTags:['player_behind'], priority:87, items:['tranquil_boots','mekansm','force_staff','glimmer_cape'], reasons:['player_behind'], optional:['guardian_greaves'] },
      { id:'objective', name:'Area denial objective push', scenarioTags:['objective_window','player_ahead'], priority:96, items:['arcane_boots','mekansm','pipe','shivas_guard'], reasons:['objective_window','player_ahead'], optional:['guardian_greaves'] }
    ],
    spikes: [
      { id:'level_6', name:'Flesh Golem commitment window', priority:84, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Flesh Golem must be ready'},{type:'min_health_pct',value:0.55,message:'Keep enough health to remain inside the fight'}], permanent:{fight:11,survival:10,objective:5}, window:{fight:25,objective:15}, actions:{FIGHT:26,OBJECTIVE:16}, recommendation:'Place Tombstone before entering Flesh Golem range and force the enemy to choose between the structure and your frontline.' },
      { id:'mekansm', name:'Early sustain conversion', priority:88, trigger:[['item_owned','mekansm']], expectedMinute:14, requires:[{type:'min_mana_pct',value:0.4,message:'Keep mana for Mekansm and one more spell cycle'}], permanent:{fight:14,survival:17,objective:11}, window:{fight:20,objective:18}, actions:{FIGHT:21,OBJECTIVE:19}, recommendation:'Group while the sustain advantage is large, protect Tombstone, and take the nearest objective before enemy damage scales.' },
      { id:'guardian_greaves', name:'Frontline reset breakpoint', priority:94, trigger:[['item_owned','guardian_greaves']], expectedMinute:24, permanent:{fight:18,survival:23,objective:14}, window:{fight:23,objective:20}, actions:{FIGHT:24,OBJECTIVE:21}, recommendation:'Absorb the first return burst, use Greaves after meaningful damage, and continue occupying the Tombstone area.' },
      { id:'greaves_pipe', name:'Sustained magic-damage siege', priority:97, trigger:[['item_owned','guardian_greaves'],['item_owned','pipe']], expectedMinute:31, requires:[{type:'min_health_pct',value:0.6,message:'Reset before leading the long objective fight'}], permanent:{fight:20,survival:28,objective:20}, window:{objective:26,fight:22}, actions:{OBJECTIVE:27,FIGHT:23}, recommendation:'Layer Pipe and Greaves instead of overlapping them, keep Tombstone protected, and force the enemy through two sustain cycles.' }
    ]
  },
  {
    id: 'warlock', displayName: 'Warlock', role: 'support', roles: ['Hard Support'],
    archetypes: ['teamfight_ultimate','lane_sustain','objective_summoner'],
    draftTags: ['large_teamfight','sustain','summons','counter_initiation'],
    vulnerabilities: ['burst','control','silence'],
    identity: 'Stabilize the lane with sustain, wait for enemy commitment before Chaotic Offering, and convert every surviving golem window into buildings or Roshan control instead of a low-value chase.',
    basePower: { farm:34, fight:83, push:57, survival:43, initiation:71, objective:70, mobility:27 },
    stageCurves: { early:{fight:4,survival:5,objective:2}, mid:{fight:22,initiation:16,objective:17}, late:{fight:19,objective:18,push:11,survival:-5} },
    benchmarkPoints: [[5,180,4],[10,235,7],[20,310,12],[40,390,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Glimmer or Aghanim Scepter before repeated five-on-five fights', defensiveItem:'Force Staff or Glimmer when enemy jump reaches the backline', objectiveTiming:'while a golem survives after the first decisive teamfight' },
    plans: [
      { id:'golem_teamfight', name:'Protected golem teamfight', scenarioTags:['balanced','teamfight_required'], priority:94, items:['arcane_boots','glimmer_cape','scepter','refresher'], reasons:['balanced_draft','teamfight_required'], optional:['force_staff'] },
      { id:'control_response', name:'Backline survival response', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['arcane_boots','force_staff','glimmer_cape','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['scepter'] },
      { id:'recovery', name:'Low-economy sustain and counter-initiation', scenarioTags:['player_behind'], priority:88, items:['tranquil_boots','glimmer_cape','force_staff','scepter'], reasons:['player_behind'], optional:['guardian_greaves'] },
      { id:'objective', name:'Golem objective conversion', scenarioTags:['objective_window','player_ahead'], priority:97, items:['arcane_boots','scepter','refresher','guardian_greaves'], reasons:['objective_window','player_ahead'], optional:['glimmer_cape'] }
    ],
    spikes: [
      { id:'level_6', name:'Chaotic Offering teamfight window', priority:86, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Chaotic Offering must be ready'},{type:'min_mana_pct',value:0.6,message:'Keep mana for Fatal Bonds and Chaotic Offering'}], permanent:{fight:12,initiation:9,objective:7}, window:{fight:27,objective:17}, actions:{FIGHT:28,OBJECTIVE:18}, recommendation:'Wait for the enemy formation to commit, connect Fatal Bonds, then drop Chaotic Offering where allies can immediately follow.' },
      { id:'glimmer_cape', name:'Protected backline channel', priority:84, trigger:[['item_owned','glimmer_cape']], expectedMinute:15, requires:[{type:'min_health_pct',value:0.45,message:'Do not rely on Glimmer from an already exposed critical position'}], permanent:{survival:16,fight:8}, window:{fight:15,connect:10}, actions:{FIGHT:16,CONNECT:11}, recommendation:'Preserve your casting position through the first jump and keep the ultimate available until the enemy fully commits.' },
      { id:'scepter', name:'Expanded golem pressure', priority:94, trigger:[['item_owned','scepter']], expectedMinute:25, requires:[{type:'ultimate_ready',message:'Chaotic Offering should be ready to convert Scepter'}], permanent:{fight:22,push:13,objective:18}, window:{fight:26,objective:23}, actions:{FIGHT:27,OBJECTIVE:24}, recommendation:'Use the expanded golem threat in a five-on-five fight, then send surviving units directly into the nearest objective.' },
      { id:'scepter_refresher', name:'Double Offering decisive cycle', priority:100, trigger:[['item_owned','scepter'],['item_owned','refresher']], expectedMinute:36, requires:[{type:'ultimate_ready',message:'Chaotic Offering must be ready before refreshing'},{type:'min_mana_pct',value:0.72,message:'Refill enough mana for both full spell sequences'}], permanent:{fight:28,push:20,objective:26,initiation:10}, window:{fight:32,objective:30}, actions:{FIGHT:33,OBJECTIVE:31}, recommendation:'Reserve the second Offering for the enemy re-engagement or buyback wave, then end the fight by converting all surviving golems.' }
    ]
  },
  {
    id: 'winter_wyvern', displayName: 'Winter Wyvern', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['save_support','counter_initiator','high_ground_defender'],
    draftTags: ['save','counter_initiation','percentage_damage','wave_defense'],
    vulnerabilities: ['burst','silence','save'],
    identity: 'Stay outside the first jump, use Cold Embrace only when its physical protection outweighs the positioning cost, and turn clustered enemy commitment into Winter’s Curse rather than forcing a low-information initiation.',
    basePower: { farm:38, fight:79, push:41, survival:49, initiation:73, objective:48, mobility:50 },
    stageCurves: { early:{fight:7,survival:2,initiation:4}, mid:{fight:20,initiation:18,survival:7}, late:{fight:18,initiation:13,push:8,objective:6} },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens or Blink before decisive counter-initiation fights', defensiveItem:'Force Staff, Glimmer, or Lotus when enemy jump reaches the save position', objectiveTiming:'after Winter’s Curse removes the first defender or protects the objective approach' },
    calibration: { calibrationConfidence:0.68, calibrationSource:'hero-specific Winter Wyvern model; exact incoming damage mix, ally save target and enemy cluster geometry unavailable', telemetryLimitations:['incoming_damage_type_not_available','ally_save_target_not_available','enemy_cluster_geometry_not_available'] },
    plans: [
      { id:'save_position', name:'Long-range save position', scenarioTags:['balanced','ally_save_low'], priority:93, items:['arcane_boots','aether_lens','force_staff','glimmer_cape'], reasons:['balanced_draft','ally_save_low'], optional:['lotus_orb'] },
      { id:'control_response', name:'Protected counter-initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['arcane_boots','glimmer_cape','force_staff','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens'] },
      { id:'recovery', name:'Low-economy defensive utility', scenarioTags:['player_behind'], priority:88, items:['tranquil_boots','force_staff','glimmer_cape','aether_lens'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Curse objective control', scenarioTags:['objective_window','player_ahead'], priority:95, items:['arcane_boots','aether_lens','blink','refresher'], reasons:['objective_window','player_ahead'], optional:['glimmer_cape'] }
    ],
    spikes: [
      { id:'level_6', name:'Winter’s Curse counter-initiation', priority:87, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Winter’s Curse must be ready'},{type:'min_mana_pct',value:0.58,message:'Keep mana for Curse and the follow-up save'}], permanent:{fight:12,initiation:11}, window:{fight:27,connect:12}, actions:{FIGHT:28,CONNECT:13}, recommendation:'Wait until enemy commitment creates a valuable cluster, then Curse the target whose allies provide the most damage and control.' },
      { id:'aether_lens', name:'Safe save and Curse range', priority:86, trigger:[['item_owned','aether_lens']], expectedMinute:16, permanent:{fight:10,survival:13,initiation:9}, window:{fight:17,connect:12}, actions:{FIGHT:18,CONNECT:13}, recommendation:'Maintain distance from the first jump and cast the save or setup without entering the enemy initiation radius.' },
      { id:'blink', name:'Hidden counter-initiation angle', priority:94, trigger:[['item_owned','blink']], expectedMinute:23, requires:[{type:'ultimate_ready',message:'Winter’s Curse should be ready before revealing Blink'},{type:'min_health_pct',value:0.48,message:'Do not hold the hidden angle from critical health'}], permanent:{fight:18,initiation:23,mobility:16}, window:{fight:27,objective:11}, actions:{FIGHT:28,OBJECTIVE:12}, recommendation:'Stay unseen until enemies commit around one core, Blink to safe cast range, and Curse without becoming the next target.' },
      { id:'blink_refresher', name:'Double counter-initiation cycle', priority:99, trigger:[['item_owned','blink'],['item_owned','refresher']], expectedMinute:35, requires:[{type:'ultimate_ready',message:'Winter’s Curse must be ready before refreshing'},{type:'min_mana_pct',value:0.72,message:'Refill for two complete control and save sequences'}], permanent:{fight:25,initiation:25,objective:14}, window:{fight:31,objective:22}, actions:{FIGHT:32,OBJECTIVE:23}, recommendation:'Use the first Curse to stop commitment and reserve the refreshed cycle for buybacks, re-engagement, or the objective defense.' }
    ]
  }
];

export const HERO_IDS = Object.freeze(DEFINITIONS.map((entry) => entry.id));
export function createProfilePack(dependencies) {
  return createExplicitProfilePack(DEFINITIONS, dependencies, CALIBRATION);
}
