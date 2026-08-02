import { createExplicitProfilePack } from './explicit-profile-pack.mjs';

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-macro-offlane-v2',
  calibrationSource: 'hero-specific macro offlane strategic review; live recordings pending',
  calibrationConfidence: 0.72,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const DEFINITIONS = [
  {
    id: 'beastmaster', displayName: 'Beastmaster', roles: ['Offlane'],
    archetypes: ['summon_controller','vision_initiator','objective_captain'],
    draftTags: ['summons','vision','single_target_control','objective'],
    vulnerabilities: ['wave_clear','summon_feed','dispel'],
    identity: 'Use controlled units to reveal safe lanes and enemy movement, isolate one target with Primal Roar, and convert every pickoff into tower or Roshan pressure.',
    basePower: { farm:55, fight:71, push:82, survival:58, initiation:80, objective:88, mobility:42 },
    stageCurves: { early:{farm:7,push:10,objective:6}, mid:{fight:15,push:20,objective:24,initiation:15}, late:{fight:2,push:7,objective:8,survival:-5} },
    benchmarkPoints: [[5,315,5],[10,410,8],[20,535,15],[40,625,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Helm of the Dominator before first coordinated tower cycle', defensiveItem:'BKB or Pipe when Roar follow-up is interrupted', objectiveTiming:'immediately after Roar creates a numbers advantage' },
    plans: [
      { id:'dominator_map_control', name:'Dominator vision and tower control', scenarioTags:['balanced','objective_window'], priority:91, items:['phase_boots','helm_dominator','vladmir','assault_cuirass'], reasons:['balanced_draft','objective_window'], optional:['blink'] },
      { id:'control_response', name:'Protected Roar conversion', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['phase_boots','helm_dominator','pipe','bkb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['blink'] },
      { id:'recovery', name:'Low-risk summon recovery', scenarioTags:['player_behind'], priority:84, items:['phase_boots','helm_dominator','vladmir','pipe'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Summon aura objective siege', scenarioTags:['player_ahead','objective_window'], priority:96, items:['helm_dominator','vladmir','assault_cuirass','blink'], reasons:['player_ahead','objective_window'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'Primal Roar pickoff window', priority:79, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Primal Roar must be ready'},{type:'min_mana_pct',value:0.4,message:'Keep enough mana for Roar and follow-up'}], permanent:{fight:7,initiation:10}, window:{fight:18,connect:15,objective:10}, actions:{FIGHT:19,CONNECT:16,OBJECTIVE:11}, recommendation:'Roar a target your team can reach immediately, then move summons toward the nearest objective.' },
      { id:'helm_dominator', name:'Controlled-unit map pressure', priority:84, trigger:[['item_owned','helm_dominator']], expectedMinute:11, permanent:{farm:10,push:18,objective:15}, window:{pressure:19,objective:15}, actions:{PRESSURE:20,OBJECTIVE:16,FARM:8}, recommendation:'Use the controlled unit for vision and lane pressure without feeding it into unconfirmed enemy positions.' },
      { id:'vladmir', name:'Summon aura siege timing', priority:91, trigger:[['item_owned','helm_dominator'],['item_owned','vladmir']], expectedMinute:17, permanent:{push:19,objective:20,fight:8}, window:{pressure:22,objective:22}, actions:{PRESSURE:23,OBJECTIVE:23}, recommendation:'Group controlled units and allies around the safest tower or Roshan entry while Roar protects the formation.' },
      { id:'assault_cuirass', name:'High-ground armor conversion', priority:97, trigger:[['item_owned','assault_cuirass']], expectedMinute:29, permanent:{push:22,objective:24,fight:14}, window:{objective:26,pressure:22}, actions:{OBJECTIVE:27,PRESSURE:23}, recommendation:'Use the armor swing to take structures after a pickoff instead of returning to passive farming.' }
    ]
  },
  {
    id: 'brewmaster', displayName: 'Brewmaster', roles: ['Offlane'],
    archetypes: ['teamfight_disruptor','ultimate_cycle_core','aura_frontliner'],
    draftTags: ['teamfight','dispel','frontline','save_disruption'],
    vulnerabilities: ['ultimate_downtime','silence','burst_before_split'],
    identity: 'Trade resources before committing Primal Split, use the split to disrupt saves and isolate priority targets, then disengage when the ultimate cycle ends.',
    basePower: { farm:48, fight:82, push:52, survival:74, initiation:72, objective:56, mobility:50 },
    stageCurves: { early:{fight:7,survival:8}, mid:{fight:23,initiation:15,survival:12,objective:9}, late:{fight:8,survival:4,objective:3,push:-2} },
    benchmarkPoints: [[5,300,5],[10,390,8],[20,505,14],[40,590,23]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aura or Scepter before repeated Split fights', defensiveItem:'BKB when silence or burst prevents Split', objectiveTiming:'after Primal Split removes saves or wins the first exchange' },
    plans: [
      { id:'split_aura', name:'Primal Split aura frontline', scenarioTags:['balanced','team_lacks_frontline'], priority:89, items:['phase_boots','vladmir','scepter','blink'], reasons:['balanced_draft','team_lacks_frontline'], optional:['pipe'] },
      { id:'control_response', name:'Guaranteed Split activation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['phase_boots','bkb','blink','scepter'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Aura-first recovery', scenarioTags:['player_behind'], priority:84, items:['phase_boots','vladmir','pipe','scepter'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Repeated Split objective fights', scenarioTags:['player_ahead','objective_window'], priority:94, items:['vladmir','scepter','blink','refresher'], reasons:['player_ahead','objective_window'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'First Primal Split cycle', priority:82, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Primal Split must be ready'},{type:'min_health_pct',value:0.4,message:'Do not wait until lethal burst prevents Split'},{type:'min_mana_pct',value:0.35,message:'Keep mana for Primal Split'}], permanent:{fight:9,survival:7}, window:{fight:23,connect:12}, actions:{FIGHT:24,CONNECT:13}, recommendation:'Commit Split before being chain-controlled and use the duration to remove saves from the main fight.' },
      { id:'vladmir', name:'Aura-backed skirmish timing', priority:78, trigger:[['item_owned','vladmir']], expectedMinute:12, permanent:{fight:9,survival:8,objective:6}, window:{fight:15,objective:10}, actions:{FIGHT:16,OBJECTIVE:11}, recommendation:'Group for a controlled skirmish while the aura improves team sustain, but keep Split for a meaningful target.' },
      { id:'scepter', name:'Expanded Split control', priority:93, trigger:[['item_owned','scepter']], expectedMinute:21, requires:[{type:'ultimate_ready',message:'Primal Split must be ready for the item window'}], permanent:{fight:20,initiation:11,survival:12}, window:{fight:25,objective:13}, actions:{FIGHT:26,OBJECTIVE:14}, recommendation:'Use the stronger Split cycle to disrupt multiple enemy roles instead of chasing one low-value support.' },
      { id:'refresher', name:'Double teamfight cycle', priority:99, trigger:[['item_owned','refresher']], expectedMinute:34, requires:[{type:'ultimate_ready',message:'Primal Split must be available before the double cycle'},{type:'min_mana_pct',value:0.65,message:'Preserve enough mana for both commitments'}], permanent:{fight:24,survival:16,objective:12}, window:{fight:29,objective:19}, actions:{FIGHT:30,OBJECTIVE:20}, recommendation:'Plan two separate disruption cycles and take the major objective before the enemy cooldowns recover.' }
    ]
  },
  {
    id: 'bristleback', displayName: 'Bristleback', roles: ['Offlane','Carry'],
    archetypes: ['sustained_frontliner','attrition_core','space_creator'],
    draftTags: ['frontline','sustain','anti_physical','extended_fight'],
    vulnerabilities: ['break','healing_reduction','mana_pressure'],
    identity: 'Occupy contested space, build repeated Quill Spray pressure, and force enemies to spend resources turning onto a durable frontliner before allies commit.',
    basePower: { farm:61, fight:79, push:54, survival:91, initiation:38, objective:63, mobility:34 },
    stageCurves: { early:{survival:15,fight:7,farm:3}, mid:{fight:20,survival:22,objective:12}, late:{fight:7,survival:8,objective:4,initiation:-4} },
    benchmarkPoints: [[5,320,5],[10,420,8],[20,560,15],[40,670,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Vanguard into sustain before prolonged fights', defensiveItem:'Pipe, Lotus, or BKB against break and control', objectiveTiming:'when enemies cannot burst through the first resource cycle' },
    plans: [
      { id:'sustain_frontline', name:'Sustained frontline pressure', scenarioTags:['balanced','enemy_physical_dps_high'], priority:90, items:['phase_boots','vanguard','bloodstone','shivas_guard'], reasons:['balanced_draft','enemy_physical_dps_high'], optional:['heavens_halberd'] },
      { id:'control_response', name:'Break and magic protection', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['phase_boots','vanguard','pipe','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['bkb'] },
      { id:'recovery', name:'Durability-first recovery', scenarioTags:['player_behind'], priority:85, items:['phase_boots','vanguard','pipe','bloodstone'], reasons:['player_behind'], optional:['heavens_halberd'] },
      { id:'objective', name:'Sustain into objective occupation', scenarioTags:['player_ahead','objective_window'], priority:94, items:['vanguard','bloodstone','assault_cuirass','shivas_guard'], reasons:['player_ahead','objective_window'], optional:['satanic'] }
    ],
    spikes: [
      { id:'level_6', name:'Warpath attrition window', priority:72, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'min_health_pct',value:0.55,message:'Enter with enough health to survive the first focus'}], permanent:{fight:7,survival:6}, window:{fight:14,pressure:12}, actions:{FIGHT:15,PRESSURE:13}, recommendation:'Build spell stacks while facing away from the main damage and avoid chasing beyond allied follow-up.' },
      { id:'vanguard', name:'Physical lane occupation', priority:77, trigger:[['item_owned','vanguard']], expectedMinute:9, permanent:{survival:20,farm:7,pressure:6}, window:{pressure:17,farm:10}, actions:{PRESSURE:18,FARM:10}, recommendation:'Hold the dangerous lane and force multiple heroes to remove you instead of abandoning pressure for low-value jungle camps.' },
      { id:'bloodstone', name:'Extended-fight sustain breakpoint', priority:92, trigger:[['item_owned','bloodstone']], expectedMinute:20, requires:[{type:'min_health_pct',value:0.5,message:'Start the fight before entering burst range'}], permanent:{fight:20,survival:22,objective:9}, window:{fight:24,objective:14}, actions:{FIGHT:25,OBJECTIVE:15}, recommendation:'Take a long fight around an objective where repeated spell damage can sustain you through the second enemy cooldown cycle.' },
      { id:'shivas_guard', name:'Anti-heal frontline conversion', priority:97, trigger:[['item_owned','shivas_guard']], expectedMinute:28, permanent:{fight:17,survival:18,objective:12}, window:{fight:21,objective:18}, actions:{FIGHT:22,OBJECTIVE:19}, recommendation:'Occupy the center of the fight, reduce enemy sustain, and keep opponents inside allied damage rather than chasing alone.' }
    ]
  },
  {
    id: 'dark_seer', displayName: 'Dark Seer', roles: ['Offlane'],
    archetypes: ['combo_enabler','aura_carrier','wave_accelerator'],
    draftTags: ['teamfight_combo','wave_pressure','aura','forced_movement'],
    vulnerabilities: ['dispel','split_formation','cooldown_downtime'],
    identity: 'Accelerate safe waves, preserve team resources through auras, and combine Vacuum plus Wall only when allies can immediately exploit the clustered formation.',
    basePower: { farm:68, fight:76, push:69, survival:70, initiation:71, objective:61, mobility:62 },
    stageCurves: { early:{farm:12,push:8,survival:5}, mid:{fight:20,initiation:18,push:14,objective:11}, late:{fight:10,initiation:7,push:6,survival:3} },
    benchmarkPoints: [[5,325,5],[10,430,8],[20,555,15],[40,640,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Greaves or Blink before coordinated combo fights', defensiveItem:'Pipe or Lotus when the team cannot survive the first burst', objectiveTiming:'after Vacuum-Wall wins formation control' },
    plans: [
      { id:'greaves_combo', name:'Greaves-backed combo control', scenarioTags:['balanced','team_lacks_frontline'], priority:90, items:['arcane_boots','mekansm','guardian_greaves','blink'], reasons:['balanced_draft','team_lacks_frontline'], optional:['pipe'] },
      { id:'control_response', name:'Aura protection before combo', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['arcane_boots','guardian_greaves','pipe','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['blink'] },
      { id:'recovery', name:'Wave and aura recovery', scenarioTags:['player_behind'], priority:85, items:['arcane_boots','mekansm','pipe','guardian_greaves'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Vacuum-Wall objective formation', scenarioTags:['player_ahead','objective_window'], priority:95, items:['guardian_greaves','blink','pipe','refresher'], reasons:['player_ahead','objective_window'], optional:['shivas_guard'] }
    ],
    spikes: [
      { id:'level_6', name:'Wall formation threat', priority:75, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Wall of Replica must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep mana for the full combo'}], permanent:{fight:7,push:5}, window:{fight:17,connect:11}, actions:{FIGHT:18,CONNECT:12}, recommendation:'Use Wall only when allied control or damage can punish the enemy formation instead of casting it on a retreating edge.' },
      { id:'mekansm', name:'First team sustain timing', priority:79, trigger:[['item_owned','mekansm']], expectedMinute:12, permanent:{survival:13,fight:9,objective:6}, window:{fight:15,objective:11}, actions:{FIGHT:16,OBJECTIVE:12}, recommendation:'Group for a controlled fight where the heal preserves allies long enough to execute Vacuum follow-up.' },
      { id:'guardian_greaves', name:'Greaves aura breakpoint', priority:91, trigger:[['item_owned','guardian_greaves']], expectedMinute:19, permanent:{survival:22,fight:14,objective:10}, window:{fight:21,objective:16}, actions:{FIGHT:22,OBJECTIVE:17}, recommendation:'Take a five-hero fight around an objective while Greaves offsets the first enemy spell cycle.' },
      { id:'blink_refresher', name:'Repeated Vacuum-Wall control', priority:99, trigger:[['item_owned','blink'],['item_owned','refresher']], expectedMinute:34, requires:[{type:'ultimate_ready',message:'Wall must be available for the double combo'},{type:'min_mana_pct',value:0.65,message:'Preserve mana for both control cycles'}], permanent:{fight:25,initiation:20,objective:15}, window:{fight:29,objective:21}, actions:{FIGHT:30,OBJECTIVE:22}, recommendation:'Create two separate formation collapses and secure the objective before enemy defensive cooldowns return.' }
    ]
  },
  {
    id: 'doom', displayName: 'Doom', roles: ['Offlane','Mid'],
    archetypes: ['target_removal','economy_converter','frontline_controller'],
    draftTags: ['silence','single_target_control','anti_save','economy'],
    vulnerabilities: ['dispel','linkens','low_tempo_greed'],
    identity: 'Use accelerated economy to reach a protected initiation, remove the most important spell or save hero with Doom, and convert the temporary five-versus-four immediately.',
    basePower: { farm:70, fight:78, push:43, survival:78, initiation:83, objective:60, mobility:38 },
    stageCurves: { early:{farm:13,survival:8,fight:-2}, mid:{fight:22,initiation:21,objective:12,farm:8}, late:{fight:13,initiation:9,survival:5,push:-3} },
    benchmarkPoints: [[5,330,5],[10,445,8],[20,590,15],[40,700,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Midas into Blink or BKB without missing the first useful Doom window', defensiveItem:'BKB or Linken protection before entering layered control', objectiveTiming:'while the Doomed core or save hero cannot contest' },
    plans: [
      { id:'midas_doom_tempo', name:'Midas into protected Doom tempo', scenarioTags:['balanced','objective_window'], priority:89, items:['phase_boots','hand_of_midas','blink','bkb'], reasons:['balanced_draft','objective_window'], optional:['shivas_guard'] },
      { id:'control_response', name:'Protected target removal', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['phase_boots','blink','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Economy recovery without missed fights', scenarioTags:['player_behind'], priority:84, items:['phase_boots','hand_of_midas','pipe','blink'], reasons:['player_behind'], optional:['bkb'] },
      { id:'objective', name:'Doom into major objective', scenarioTags:['player_ahead','objective_window'], priority:96, items:['blink','bkb','shivas_guard','refresher'], reasons:['player_ahead','objective_window'], optional:['assault_cuirass'] }
    ],
    spikes: [
      { id:'level_6', name:'First Doom removal', priority:83, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Doom must be ready'},{type:'min_mana_pct',value:0.4,message:'Keep mana for Doom and follow-up control'}], permanent:{fight:9,initiation:9}, window:{fight:22,connect:13,objective:9}, actions:{FIGHT:23,CONNECT:14,OBJECTIVE:10}, recommendation:'Doom the hero whose spells or saves decide the fight, not merely the closest target.' },
      { id:'hand_of_midas', name:'Accelerated item timing', priority:73, trigger:[['item_owned','hand_of_midas']], expectedMinute:9, permanent:{farm:18}, window:{farm:13,pressure:5}, actions:{FARM:13,PRESSURE:5}, recommendation:'Use the economy advantage to reach Blink or BKB on time; do not skip a high-value Doom fight for one extra farm cycle.' },
      { id:'blink_bkb', name:'Protected Doom access', priority:96, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:23, requires:[{type:'ultimate_ready',message:'Doom must be ready before revealing the protected timing'},{type:'min_health_pct',value:0.6,message:'Enter with enough health to remain frontline'}], permanent:{fight:22,initiation:25,survival:18}, window:{fight:28,objective:17}, actions:{FIGHT:29,OBJECTIVE:18}, recommendation:'Blink past the frontline, protect the cast with BKB, and immediately collapse on the isolated target.' },
      { id:'refresher', name:'Double target removal', priority:100, trigger:[['item_owned','refresher']], expectedMinute:35, requires:[{type:'ultimate_ready',message:'Doom must be ready before the double-cast window'},{type:'min_mana_pct',value:0.7,message:'Preserve mana for both Doom casts'}], permanent:{fight:27,initiation:16,objective:16}, window:{fight:31,objective:23}, actions:{FIGHT:32,OBJECTIVE:24}, recommendation:'Remove two distinct fight-winning heroes and finish the major objective during their disabled window.' }
    ]
  },
  {
    id: 'enigma', displayName: 'Enigma', roles: ['Offlane','Support'],
    archetypes: ['teamfight_ultimate','summon_pusher','counter_initiator'],
    draftTags: ['teamfight','summons','area_control','counter_initiation'],
    vulnerabilities: ['interrupt','vision','ultimate_downtime'],
    identity: 'Use Eidolons to secure economy and lane pressure, preserve hidden positioning, and cast Black Hole only when interruption paths are controlled or the target value is decisive.',
    basePower: { farm:63, fight:86, push:68, survival:43, initiation:84, objective:70, mobility:35 },
    stageCurves: { early:{farm:11,push:9,survival:-5}, mid:{fight:26,initiation:24,objective:15}, late:{fight:18,initiation:12,objective:10,survival:-4} },
    benchmarkPoints: [[5,315,5],[10,420,8],[20,545,15],[40,640,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink before repeated hidden Black Hole threats', defensiveItem:'BKB when interrupts cannot be removed', objectiveTiming:'after Black Hole wins the fight or while it deters contest' },
    plans: [
      { id:'blink_black_hole', name:'Hidden Blink Black Hole', scenarioTags:['balanced','team_lacks_initiation'], priority:92, items:['arcane_boots','blink','bkb','refresher'], reasons:['balanced_draft','team_lacks_initiation'], optional:['scepter'] },
      { id:'control_response', name:'Interrupt-proof channel', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['arcane_boots','blink','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['refresher'] },
      { id:'recovery', name:'Eidolon economy recovery', scenarioTags:['player_behind'], priority:84, items:['arcane_boots','mekansm','blink','bkb'], reasons:['player_behind'], optional:['pipe'] },
      { id:'objective', name:'Black Hole objective deterrence', scenarioTags:['player_ahead','objective_window'], priority:96, items:['blink','bkb','refresher','scepter'], reasons:['player_ahead','objective_window'], optional:['guardian_greaves'] }
    ],
    spikes: [
      { id:'level_6', name:'First Black Hole threat', priority:85, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Black Hole must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep enough mana for Malefice and Black Hole'}], permanent:{fight:10,initiation:10}, window:{fight:24,connect:12}, actions:{FIGHT:25,CONNECT:13}, recommendation:'Stay outside enemy vision and channel only when the interruption path is controlled or the kill value is decisive.' },
      { id:'blink', name:'Hidden Black Hole access', priority:93, trigger:[['item_owned','blink']], expectedMinute:15, requires:[{type:'ultimate_ready',message:'Black Hole must be ready before revealing Blink'},{type:'min_mana_pct',value:0.55,message:'Preserve mana for the full initiation'}], permanent:{initiation:27,mobility:15,fight:12}, window:{fight:27,connect:20}, actions:{FIGHT:28,CONNECT:21}, recommendation:'Break vision, wait for enemy spacing to collapse, and Blink only when allies can cover the channel.' },
      { id:'blink_bkb', name:'Protected Black Hole channel', priority:99, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:24, requires:[{type:'ultimate_ready',message:'Black Hole must be ready for the protected timing'}], permanent:{fight:24,initiation:20,survival:18}, window:{fight:30,objective:18}, actions:{FIGHT:31,OBJECTIVE:19}, recommendation:'Use BKB to remove known interruption paths and convert the won fight into Roshan or structures.' },
      { id:'refresher', name:'Double Black Hole endgame', priority:100, trigger:[['item_owned','refresher']], expectedMinute:35, requires:[{type:'ultimate_ready',message:'Black Hole must be available for the double cycle'},{type:'min_mana_pct',value:0.75,message:'Preserve enough mana for both channels'}], permanent:{fight:30,initiation:20,objective:18}, window:{fight:34,objective:25}, actions:{FIGHT:35,OBJECTIVE:26}, recommendation:'Plan two separate channels around enemy defensive cooldowns and end the game during the resulting objective window.' }
    ]
  },
  {
    id: 'night_stalker', displayName: 'Night Stalker', roles: ['Offlane'],
    archetypes: ['vision_hunter','backline_diver','silence_initiator'],
    draftTags: ['vision','silence','backline_access','pickoff'],
    vulnerabilities: ['daytime_downtime','kite','dispel'],
    identity: 'Exploit reduced enemy information to cross vision, silence isolated spellcasters, and end fights quickly before the mobility and darkness advantage expires.',
    basePower: { farm:45, fight:80, push:42, survival:73, initiation:79, objective:53, mobility:76 },
    stageCurves: { early:{fight:3,survival:6,farm:-3}, mid:{fight:24,initiation:21,mobility:22,objective:8}, late:{fight:8,initiation:7,mobility:8,push:-3} },
    benchmarkPoints: [[5,300,5],[10,395,8],[20,515,15],[40,610,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Echo Sabre or Blink before repeated backline hunts', defensiveItem:'BKB when silence access is stopped by control', objectiveTiming:'after darkness vision secures a pickoff or forces retreat' },
    plans: [
      { id:'darkness_hunt', name:'Darkness backline hunting', scenarioTags:['balanced','split_push_required'], priority:91, items:['phase_boots','echo_sabre','bkb','blink'], reasons:['balanced_draft','split_push_required'], optional:['scepter'] },
      { id:'control_response', name:'Protected silence dive', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['phase_boots','bkb','blink','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['echo_sabre'] },
      { id:'recovery', name:'Low-risk pickoff recovery', scenarioTags:['player_behind'], priority:84, items:['phase_boots','echo_sabre','heavens_halberd','bkb'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Vision advantage conversion', scenarioTags:['player_ahead','objective_window'], priority:95, items:['phase_boots','echo_sabre','bkb','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['blink'] }
    ],
    spikes: [
      { id:'level_6', name:'Dark Ascension vision window', priority:83, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Dark Ascension must be ready'},{type:'min_health_pct',value:0.55,message:'Enter darkness with enough health to stay on the backline'}], permanent:{fight:9,mobility:9,initiation:7}, window:{fight:23,connect:19}, actions:{FIGHT:24,CONNECT:20}, recommendation:'Use the darkness window to remove enemy vision and silence a high-impact spellcaster, not to chase the nearest tank.' },
      { id:'echo_sabre', name:'Backline burst timing', priority:85, trigger:[['item_owned','echo_sabre']], expectedMinute:13, requires:[{type:'min_health_pct',value:0.6,message:'Preserve enough health for the dive and exit'}], permanent:{fight:15,mobility:5}, window:{fight:20,connect:13}, actions:{FIGHT:21,CONNECT:14}, recommendation:'Cross vision toward an isolated support and disengage after the first kill instead of extending into revealed terrain.' },
      { id:'bkb', name:'Protected silence access', priority:95, trigger:[['item_owned','bkb']], expectedMinute:21, requires:[{type:'ultimate_ready',message:'Prefer committing the protected timing with Dark Ascension ready'}], permanent:{fight:19,survival:22,initiation:10}, window:{fight:26,objective:13}, actions:{FIGHT:27,OBJECTIVE:14}, recommendation:'Use BKB to stay on the key spellcaster through the first control layer, then turn the kill into map control.' },
      { id:'assault_cuirass', name:'Vision lead objective conversion', priority:97, trigger:[['item_owned','assault_cuirass']], expectedMinute:30, permanent:{fight:17,push:16,objective:18}, window:{objective:23,pressure:18}, actions:{OBJECTIVE:24,PRESSURE:19}, recommendation:'Convert the pickoff and armor advantage into structures before enemy vision and formation recover.' }
    ],
    calibration: {
      calibrationConfidence: 0.68,
      calibrationSource: 'hero-specific review; exact day/night telemetry is not available in current GameState'
    }
  },
  {
    id: 'timbersaw', displayName: 'Timbersaw', roles: ['Offlane','Mid'],
    archetypes: ['anti_strength_frontliner','mobility_tank','spell_sustain_core'],
    draftTags: ['frontline','pure_damage','anti_strength','mobility'],
    vulnerabilities: ['silence','mana_pressure','healing_reduction'],
    identity: 'Occupy tree-rich contested space, punish durable strength targets with repeated spell cycles, and preserve a chain path before committing deep into the formation.',
    basePower: { farm:64, fight:84, push:47, survival:88, initiation:57, objective:55, mobility:82 },
    stageCurves: { early:{fight:10,survival:17,farm:5}, mid:{fight:24,survival:19,mobility:18,objective:8}, late:{fight:3,survival:2,mobility:6,push:-4} },
    benchmarkPoints: [[5,325,5],[10,435,8],[20,575,15],[40,665,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Bloodstone or defensive utility before sustained map occupation', defensiveItem:'Lotus, Pipe, or BKB against silence and burst', objectiveTiming:'after forcing enemy cores away from the contested area' },
    plans: [
      { id:'bloodstone_pressure', name:'Bloodstone spell-sustain pressure', scenarioTags:['balanced','enemy_physical_dps_high'], priority:91, items:['phase_boots','vanguard','bloodstone','shivas_guard'], reasons:['balanced_draft','enemy_physical_dps_high'], optional:['lotus_orb'] },
      { id:'control_response', name:'Silence and burst protection', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['phase_boots','vanguard','lotus_orb','bkb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['pipe'] },
      { id:'recovery', name:'Durable lane recovery', scenarioTags:['player_behind'], priority:85, items:['phase_boots','vanguard','pipe','bloodstone'], reasons:['player_behind'], optional:['lotus_orb'] },
      { id:'objective', name:'Area occupation objective build', scenarioTags:['player_ahead','objective_window'], priority:95, items:['bloodstone','shivas_guard','lotus_orb','octarine_core'], reasons:['player_ahead','objective_window'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'Chakram area-control window', priority:78, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Chakram must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep mana for repeated spell cycles'}], permanent:{fight:9,farm:6}, window:{fight:19,pressure:14}, actions:{FIGHT:20,PRESSURE:15}, recommendation:'Fight around trees and choke points where repeated spells deny movement, while keeping a chain path for retreat.' },
      { id:'vanguard', name:'Lane occupation durability', priority:75, trigger:[['item_owned','vanguard']], expectedMinute:9, permanent:{survival:19,farm:7}, window:{pressure:16,farm:10}, actions:{PRESSURE:17,FARM:10}, recommendation:'Stand in the dangerous wave and force rotations while preserving mana for escape and counter-pressure.' },
      { id:'bloodstone', name:'Spell-sustain teamfight breakpoint', priority:93, trigger:[['item_owned','bloodstone']], expectedMinute:20, requires:[{type:'min_mana_pct',value:0.55,message:'Enter with enough mana for multiple rotations'}], permanent:{fight:23,survival:22,mobility:9}, window:{fight:27,objective:14}, actions:{FIGHT:28,OBJECTIVE:15}, recommendation:'Take a prolonged fight in terrain that supports repeated chains and turn forced enemy retreat into an objective.' },
      { id:'shivas_guard', name:'Anti-sustain area occupation', priority:97, trigger:[['item_owned','shivas_guard']], expectedMinute:28, permanent:{fight:18,survival:17,objective:13}, window:{fight:22,objective:19}, actions:{FIGHT:23,OBJECTIVE:20}, recommendation:'Control the center of the objective fight, slow enemy repositioning, and avoid chasing beyond available tree paths.' }
    ]
  },
  {
    id: 'underlord', displayName: 'Underlord', roles: ['Offlane'],
    archetypes: ['area_denial','aura_frontliner','global_relocator'],
    draftTags: ['aura','area_control','global_mobility','frontline'],
    vulnerabilities: ['percentage_damage','break','spread_formation'],
    identity: 'Deny narrow areas with sustained damage and control, carry team auras through the first burst, and use global relocation to reinforce or convert objectives without abandoning lane structure.',
    basePower: { farm:57, fight:73, push:66, survival:86, initiation:60, objective:78, mobility:64 },
    stageCurves: { early:{survival:14,push:8,farm:5}, mid:{fight:16,survival:20,objective:20,push:13}, late:{fight:8,survival:9,objective:13,mobility:7} },
    benchmarkPoints: [[5,310,5],[10,405,8],[20,525,15],[40,610,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Greaves, Pipe, or Crimson based on enemy damage', defensiveItem:'Stack the aura that answers the dominant damage type', objectiveTiming:'after area denial secures the entrance or global relocation creates numbers' },
    plans: [
      { id:'aura_area_control', name:'Aura-backed area denial', scenarioTags:['balanced','team_lacks_frontline'], priority:90, items:['arcane_boots','mekansm','guardian_greaves','pipe'], reasons:['balanced_draft','team_lacks_frontline'], optional:['crimson_guard'] },
      { id:'control_response', name:'Magic protection and dispel support', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['arcane_boots','pipe','guardian_greaves','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['shivas_guard'] },
      { id:'recovery', name:'Low-economy aura recovery', scenarioTags:['player_behind'], priority:86, items:['arcane_boots','mekansm','pipe','crimson_guard'], reasons:['player_behind'], optional:['guardian_greaves'] },
      { id:'objective', name:'Global objective occupation', scenarioTags:['player_ahead','objective_window'], priority:96, items:['guardian_greaves','pipe','crimson_guard','shivas_guard'], reasons:['player_ahead','objective_window'], optional:['assault_cuirass'] }
    ],
    spikes: [
      { id:'level_6', name:'Fiend’s Gate reinforcement window', priority:76, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Fiend’s Gate must be ready'},{type:'min_mana_pct',value:0.4,message:'Keep mana for arrival control'}], permanent:{mobility:9,objective:6}, window:{connect:20,objective:12}, actions:{CONNECT:21,OBJECTIVE:13}, recommendation:'Reinforce a fight or objective only when allies can hold the arrival area; do not relocate into an already lost formation.' },
      { id:'mekansm', name:'First aura fight timing', priority:78, trigger:[['item_owned','mekansm']], expectedMinute:12, permanent:{survival:14,fight:8,objective:7}, window:{fight:15,objective:12}, actions:{FIGHT:16,OBJECTIVE:13}, recommendation:'Group around the first sustain timing and hold the entrance with area control rather than chasing through open ground.' },
      { id:'guardian_greaves', name:'Greaves frontline breakpoint', priority:91, trigger:[['item_owned','guardian_greaves']], expectedMinute:20, permanent:{survival:23,fight:14,objective:14}, window:{fight:20,objective:19}, actions:{FIGHT:21,OBJECTIVE:20}, recommendation:'Absorb the first burst, restore allied resources, and keep enemies inside the controlled objective entrance.' },
      { id:'pipe_crimson', name:'Dual-aura objective lock', priority:98, trigger:[['item_owned','pipe'],['item_owned','crimson_guard']], expectedMinute:29, permanent:{survival:27,fight:16,objective:21}, window:{objective:25,fight:21}, actions:{OBJECTIVE:26,FIGHT:22}, recommendation:'Use the dual aura window to occupy Roshan or high ground while global relocation protects the opposite side of the map.' }
    ]
  }
];

export const HERO_IDS = Object.freeze(DEFINITIONS.map((entry) => entry.id));
export function createProfilePack(dependencies) {
  return createExplicitProfilePack(DEFINITIONS, dependencies, CALIBRATION);
}
