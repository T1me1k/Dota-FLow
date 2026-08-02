import { createExplicitProfilePack } from './explicit-profile-pack.mjs';

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-save-support-v2',
  calibrationSource: 'hero-specific save and sustain support strategic review; live recordings pending',
  calibrationConfidence: 0.70,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const DEFINITIONS = [
  {
    id: 'abaddon', displayName: 'Abaddon', role: 'support', roles: ['Hard Support','Offlane'],
    archetypes: ['dispel_support','frontline_save','sustain_support'],
    draftTags: ['dispel','save','sustain','frontline'], vulnerabilities: ['break','burst_before_reaction','mana_pressure'],
    identity: 'Stand close enough to remove the first disable with Aphotic Shield, preserve Mist Coil health trades, and use Borrowed Time to absorb attention without abandoning the ally who needs the save.',
    basePower: { farm:34, fight:67, push:39, survival:86, initiation:37, objective:55, mobility:35 },
    stageCurves: { early:{fight:9,survival:14}, mid:{fight:14,survival:19,objective:9}, late:{fight:6,survival:12,objective:5} },
    benchmarkPoints: [[5,180,4],[10,235,7],[20,305,12],[40,380,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Guardian Greaves or Lotus after reliable lane sustain', defensiveItem:'Lotus or Glimmer when saves are punished by silence and burst', objectiveTiming:'after the first disable is dispelled and the frontline remains healthy' },
    plans: [
      { id:'shield_sustain', name:'Shield and sustain utility', scenarioTags:['balanced','enemy_control_high'], priority:92, items:['arcane_boots','mekansm','guardian_greaves','lotus_orb'], reasons:['balanced_draft','enemy_control_high'], optional:['scepter'] },
      { id:'burst_response', name:'Protected reactive saves', scenarioTags:['enemy_magic_burst_high','enemy_control_high'], priority:98, items:['arcane_boots','glimmer_cape','lotus_orb','scepter'], reasons:['enemy_magic_burst_high','enemy_control_high'], optional:['force_staff'] },
      { id:'recovery', name:'Low-economy dispel coverage', scenarioTags:['player_behind'], priority:85, items:['arcane_boots','glimmer_cape','force_staff','mekansm'], reasons:['player_behind'], optional:['lotus_orb'] },
      { id:'objective', name:'Sustained frontline conversion', scenarioTags:['objective_window','player_ahead'], priority:91, items:['arcane_boots','guardian_greaves','solar_crest','scepter'], reasons:['objective_window','player_ahead'], optional:['lotus_orb'] }
    ],
    spikes: [
      { id:'level_6', name:'Borrowed Time frontline window', priority:78, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Borrowed Time should be available before taking first contact'},{type:'min_mana_pct',value:0.4,message:'Keep mana for Shield and Mist Coil'}], permanent:{fight:7,survival:16}, window:{fight:17,connect:10}, actions:{FIGHT:18,CONNECT:11}, recommendation:'Take controlled first contact, dispel the ally under focus, and do not chase beyond Shield range.' },
      { id:'mekansm', name:'Team sustain breakpoint', priority:84, trigger:[['item_owned','mekansm']], expectedMinute:15, requires:[{type:'min_mana_pct',value:0.45,message:'Keep enough mana for Mekansm plus one save spell'}], permanent:{fight:11,survival:13,objective:8}, window:{fight:18,objective:11}, actions:{FIGHT:19,OBJECTIVE:12}, recommendation:'Use the heal after the enemy commits damage, then keep Shield for the next disable.' },
      { id:'lotus', name:'Dispel reflection coverage', priority:90, trigger:[['item_owned','lotus_orb']], expectedMinute:22, permanent:{fight:13,survival:17,objective:6}, window:{fight:20,connect:8}, actions:{FIGHT:21,CONNECT:9}, recommendation:'Pre-cast Lotus on the ally expected to receive the first targeted disable, then Shield the follow-up.' },
      { id:'greaves_scepter', name:'Extended teamfight sustain', priority:96, trigger:[['item_owned','guardian_greaves'],['item_owned','scepter']], expectedMinute:31, requires:[{type:'min_health_pct',value:0.5,message:'Reset before committing to a long frontline fight'}], permanent:{fight:20,survival:22,objective:13}, window:{fight:27,objective:18}, actions:{FIGHT:28,OBJECTIVE:19}, recommendation:'Anchor the fight near your cores, cycle dispels and sustain, then convert while enemy burst is unavailable.' }
    ]
  },
  {
    id: 'dazzle', displayName: 'Dazzle', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['save_support','armor_swing','sustain_caster'],
    draftTags: ['save','heal','armor_reduction','cooldown_scaling'], vulnerabilities: ['silence','burst','backline_jump'],
    identity: 'Hold Shallow Grave for lethal commitment rather than chip damage, keep allies within heal and armor swing range, and use cooldown scaling to win repeated exchanges.',
    basePower: { farm:43, fight:75, push:48, survival:46, initiation:35, objective:59, mobility:31 },
    stageCurves: { early:{fight:12,objective:4}, mid:{fight:19,objective:11,survival:5}, late:{fight:13,objective:8,survival:-4} },
    benchmarkPoints: [[5,185,4],[10,245,7],[20,320,12],[40,405,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens before repeated Grave fights', defensiveItem:'Glimmer or Force when the backline is jumped', objectiveTiming:'after armor reduction and sustain win a prolonged fight' },
    plans: [
      { id:'grave_range', name:'Grave range and sustain', scenarioTags:['balanced','enemy_physical_dps_high'], priority:92, items:['arcane_boots','aether_lens','guardian_greaves','scepter'], reasons:['balanced_draft','enemy_physical_dps_high'], optional:['solar_crest'] },
      { id:'jump_response', name:'Protected save positioning', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','glimmer_cape','force_staff','aether_lens'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Low-economy Grave coverage', scenarioTags:['player_behind'], priority:86, items:['arcane_boots','glimmer_cape','force_staff','mekansm'], reasons:['player_behind'], optional:['aether_lens'] },
      { id:'objective', name:'Armor swing objective sustain', scenarioTags:['objective_window','player_ahead'], priority:93, items:['arcane_boots','guardian_greaves','solar_crest','scepter'], reasons:['objective_window','player_ahead'], optional:['aether_lens'] }
    ],
    spikes: [
      { id:'level_6', name:'Repeated spell-cycle window', priority:78, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'min_mana_pct',value:0.5,message:'Keep mana for Grave and follow-up sustain'}], permanent:{fight:9,objective:5}, window:{fight:18,connect:10}, actions:{FIGHT:19,CONNECT:11}, recommendation:'Play behind the first target, save Grave for lethal damage, and keep casting through the extended exchange.' },
      { id:'aether_lens', name:'Safe Grave cast range', priority:86, trigger:[['item_owned','aether_lens']], expectedMinute:16, requires:[{type:'min_health_pct',value:0.45,message:'Do not expose from low health to reach the save'}], permanent:{fight:12,survival:9}, window:{fight:20,connect:9}, actions:{FIGHT:21,CONNECT:10}, recommendation:'Maintain cast range from fog and delay Grave until the enemy has committed enough damage.' },
      { id:'greaves', name:'Sustain and dispel cycle', priority:91, trigger:[['item_owned','guardian_greaves']], expectedMinute:23, permanent:{fight:16,survival:14,objective:11}, window:{fight:22,objective:15}, actions:{FIGHT:23,OBJECTIVE:16}, recommendation:'Heal after the first burst and use the armor swing to keep the fight going on your terms.' },
      { id:'greaves_scepter', name:'Late repeated-save engine', priority:96, trigger:[['item_owned','guardian_greaves'],['item_owned','scepter']], expectedMinute:31, requires:[{type:'min_mana_pct',value:0.6,message:'Enter with enough mana for repeated casts'}], permanent:{fight:22,survival:14,objective:14}, window:{fight:28,objective:18}, actions:{FIGHT:29,OBJECTIVE:19}, recommendation:'Stay protected, repeat saves through the long fight, and convert before enemy burst cooldowns return.' }
    ]
  },
  {
    id: 'io', displayName: 'Io', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['linked_sustain','global_save','tempo_partner'],
    draftTags: ['save','global_mobility','sustain','attack_speed'], vulnerabilities: ['partner_separation','burst','silence'],
    identity: 'Commit to one high-value partner, preserve tether distance and shared sustain, and use Relocate only when the destination and return are safe for both heroes.',
    basePower: { farm:29, fight:70, push:43, survival:39, initiation:46, objective:67, mobility:82 },
    stageCurves: { early:{fight:10,survival:5,mobility:8}, mid:{fight:17,objective:16,mobility:20}, late:{fight:7,objective:10,survival:-6} },
    benchmarkPoints: [[5,170,4],[10,225,7],[20,295,12],[40,365,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Mekansm before repeated partner fights', defensiveItem:'Glimmer or Force when the tether pair is burst', objectiveTiming:'when the linked core is ready and Relocate can preserve or reinforce the objective' },
    calibration: { calibrationConfidence:0.64, calibrationSource:'hero-specific Io review; exact tether partner identity and distance are not available in current GameState' },
    plans: [
      { id:'tether_sustain', name:'Tether sustain core', scenarioTags:['balanced','objective_window'], priority:93, items:['arcane_boots','mekansm','guardian_greaves','scepter'], reasons:['balanced_draft','objective_window'], optional:['solar_crest'] },
      { id:'burst_response', name:'Protected tether pair', scenarioTags:['enemy_magic_burst_high','enemy_control_high'], priority:98, items:['arcane_boots','glimmer_cape','force_staff','guardian_greaves'], reasons:['enemy_magic_burst_high','enemy_control_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Low-economy partner sustain', scenarioTags:['player_behind'], priority:86, items:['arcane_boots','mekansm','glimmer_cape','force_staff'], reasons:['player_behind'], optional:['solar_crest'] },
      { id:'objective', name:'Linked core acceleration', scenarioTags:['player_ahead','objective_window'], priority:95, items:['arcane_boots','mekansm','solar_crest','scepter'], reasons:['player_ahead','objective_window'], optional:['guardian_greaves'] }
    ],
    spikes: [
      { id:'level_6', name:'Relocate save and reinforcement', priority:82, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Relocate must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for Relocate and sustain'}], permanent:{fight:7,mobility:15,objective:7}, window:{connect:22,fight:16}, actions:{CONNECT:23,FIGHT:17}, recommendation:'Relocate only with a confirmed partner and safe return plan; otherwise preserve the tethered core locally.' },
      { id:'mekansm', name:'Linked team sustain', priority:86, trigger:[['item_owned','mekansm']], expectedMinute:15, requires:[{type:'min_mana_pct',value:0.45,message:'Keep enough mana for heal and movement'}], permanent:{fight:13,survival:12,objective:9}, window:{fight:19,objective:13}, actions:{FIGHT:20,OBJECTIVE:14}, recommendation:'Time Mekansm after enemy burst lands on the tether pair, not before the damage arrives.' },
      { id:'solar_crest', name:'Partner objective acceleration', priority:90, trigger:[['item_owned','solar_crest']], expectedMinute:21, permanent:{fight:10,objective:18,survival:8}, window:{objective:22,fight:14}, actions:{OBJECTIVE:23,FIGHT:15}, recommendation:'Buff the linked core after the fight is stable and convert the sustain advantage into the objective.' },
      { id:'greaves_scepter', name:'Sustained tether engine', priority:96, trigger:[['item_owned','guardian_greaves'],['item_owned','scepter']], expectedMinute:31, requires:[{type:'min_health_pct',value:0.5,message:'Reset the pair before the next extended fight'}], permanent:{fight:20,survival:18,objective:17}, window:{fight:26,objective:21}, actions:{FIGHT:27,OBJECTIVE:22}, recommendation:'Keep the core tethered through repeated damage cycles and disengage together before the link breaks.' }
    ]
  },
  {
    id: 'omniknight', displayName: 'Omniknight', role: 'support', roles: ['Hard Support','Offlane'],
    archetypes: ['anti_physical_save','status_resistance_support','frontline_sustain'],
    draftTags: ['save','physical_immunity','dispel','frontline'], vulnerabilities: ['dispel','mana_pressure','backline_jump'],
    identity: 'Stay within save range of the core enemy physical damage must commit onto, layer Repel-style protection and Guardian Angel after commitment, and avoid spending every defensive spell on poke.',
    basePower: { farm:36, fight:72, push:38, survival:74, initiation:31, objective:58, mobility:30 },
    stageCurves: { early:{fight:9,survival:11}, mid:{fight:18,survival:20,objective:9}, late:{fight:8,survival:12,objective:6} },
    benchmarkPoints: [[5,180,4],[10,235,7],[20,305,12],[40,380,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens or Guardian Greaves before core teamfights', defensiveItem:'Force, Glimmer, or Lotus when save positioning is attacked', objectiveTiming:'after enemy physical commitment is neutralized' },
    plans: [
      { id:'physical_save', name:'Anti-physical save range', scenarioTags:['balanced','enemy_physical_dps_high'], priority:95, items:['arcane_boots','aether_lens','guardian_greaves','scepter'], reasons:['balanced_draft','enemy_physical_dps_high'], optional:['lotus_orb'] },
      { id:'control_response', name:'Protected dispel and Angel', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','glimmer_cape','lotus_orb','aether_lens'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['force_staff'] },
      { id:'recovery', name:'Low-economy save coverage', scenarioTags:['player_behind'], priority:86, items:['arcane_boots','glimmer_cape','force_staff','mekansm'], reasons:['player_behind'], optional:['aether_lens'] },
      { id:'objective', name:'Guardian Angel conversion', scenarioTags:['objective_window','player_ahead'], priority:93, items:['arcane_boots','guardian_greaves','solar_crest','scepter'], reasons:['objective_window','player_ahead'], optional:['aether_lens'] }
    ],
    spikes: [
      { id:'level_6', name:'Guardian Angel counter-commit', priority:82, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Guardian Angel must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep mana for the full save sequence'}], permanent:{fight:9,survival:15}, window:{fight:23,objective:8}, actions:{FIGHT:24,OBJECTIVE:9}, recommendation:'Wait for enemy physical commitment, then protect the focused cores and hold position for the second save.' },
      { id:'aether_lens', name:'Safe purification range', priority:85, trigger:[['item_owned','aether_lens']], expectedMinute:16, permanent:{fight:11,survival:10}, window:{fight:18,connect:9}, actions:{FIGHT:19,CONNECT:10}, recommendation:'Play outside the first disable layer while remaining close enough to save the committed core.' },
      { id:'greaves', name:'Team sustain after commitment', priority:90, trigger:[['item_owned','guardian_greaves']], expectedMinute:23, permanent:{fight:16,survival:17,objective:10}, window:{fight:22,objective:14}, actions:{FIGHT:23,OBJECTIVE:15}, recommendation:'Use Greaves after the first burst, then reserve Guardian Angel for the physical follow-through.' },
      { id:'greaves_scepter', name:'Extended teamwide protection', priority:97, trigger:[['item_owned','guardian_greaves'],['item_owned','scepter']], expectedMinute:32, requires:[{type:'ultimate_ready',message:'Guardian Angel should be ready for the major objective fight'}], permanent:{fight:22,survival:24,objective:16}, window:{fight:29,objective:21}, actions:{FIGHT:30,OBJECTIVE:22}, recommendation:'Group for the decisive fight, neutralize physical commitment, and convert before defensive cooldowns expire.' }
    ]
  },
  {
    id: 'oracle', displayName: 'Oracle', role: 'support', roles: ['Hard Support'],
    archetypes: ['reactive_save','dispel_support','burst_healer'],
    draftTags: ['save','dispel','magic_protection','heal'], vulnerabilities: ['silence','vision','instant_jump'],
    identity: 'Read the incoming damage type, use Fortune’s End and Fate’s Edict deliberately, and cast False Promise from protected range only after the enemy commits enough resources to justify it.',
    basePower: { farm:28, fight:79, push:25, survival:38, initiation:39, objective:48, mobility:28 },
    stageCurves: { early:{fight:13}, mid:{fight:23,survival:4}, late:{fight:15,survival:-7,objective:3} },
    benchmarkPoints: [[5,170,4],[10,225,7],[20,295,12],[40,365,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens before decisive False Promise fights', defensiveItem:'Glimmer or Force when the backline is jumped', objectiveTiming:'after False Promise preserves the core through enemy burst' },
    plans: [
      { id:'promise_range', name:'Protected False Promise range', scenarioTags:['balanced','enemy_magic_burst_high'], priority:97, items:['arcane_boots','aether_lens','glimmer_cape','scepter'], reasons:['balanced_draft','enemy_magic_burst_high'], optional:['force_staff'] },
      { id:'control_response', name:'Backline survival and dispel', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['arcane_boots','glimmer_cape','force_staff','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens'] },
      { id:'recovery', name:'Low-economy Promise coverage', scenarioTags:['player_behind'], priority:87, items:['arcane_boots','glimmer_cape','force_staff','aether_lens'], reasons:['player_behind'], optional:['lotus_orb'] },
      { id:'objective', name:'Saved-core objective conversion', scenarioTags:['objective_window','player_ahead'], priority:91, items:['arcane_boots','aether_lens','guardian_greaves','scepter'], reasons:['objective_window','player_ahead'], optional:['glimmer_cape'] }
    ],
    spikes: [
      { id:'level_6', name:'False Promise save window', priority:86, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'False Promise must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for Promise and follow-up healing'}], permanent:{fight:11,survival:8}, window:{fight:25,connect:10}, actions:{FIGHT:26,CONNECT:11}, recommendation:'Promise the core after lethal commitment begins, then layer healing and dispels without exposing to the next disable.' },
      { id:'aether_lens', name:'Safe reactive save range', priority:88, trigger:[['item_owned','aether_lens']], expectedMinute:16, requires:[{type:'min_health_pct',value:0.45,message:'Do not step into vision from a losing health state'}], permanent:{fight:14,survival:12}, window:{fight:21,connect:9}, actions:{FIGHT:22,CONNECT:10}, recommendation:'Stay outside the jump radius while keeping the focused core in Promise range.' },
      { id:'glimmer', name:'Layered burst protection', priority:91, trigger:[['item_owned','glimmer_cape']], expectedMinute:20, permanent:{fight:15,survival:16}, window:{fight:22,connect:8}, actions:{FIGHT:23,CONNECT:9}, recommendation:'Glimmer the promised ally after detection and damage commitments are understood, not before the enemy reveals them.' },
      { id:'lens_scepter', name:'Extended False Promise control', priority:97, trigger:[['item_owned','aether_lens'],['item_owned','scepter']], expectedMinute:30, requires:[{type:'min_mana_pct',value:0.65,message:'Enter with enough mana for the complete save cycle'}], permanent:{fight:24,survival:15,objective:9}, window:{fight:30,objective:14}, actions:{FIGHT:31,OBJECTIVE:15}, recommendation:'Preserve the highest-value core through the full burst cycle, then secure the objective while enemy cooldowns are spent.' }
    ]
  },
  {
    id: 'phoenix', displayName: 'Phoenix', role: 'support', roles: ['Soft Support','Offlane'],
    archetypes: ['teamfight_reset','percentage_damage','area_sustain'],
    draftTags: ['teamfight','heal','anti_health','area_control'], vulnerabilities: ['attack_speed','silence','bad_egg_position'],
    identity: 'Pressure high-health targets with sustained area damage, preserve an escape path, and place Supernova where enemy attacks are disrupted rather than merely close to the fight.',
    basePower: { farm:39, fight:84, push:34, survival:61, initiation:65, objective:51, mobility:76 },
    stageCurves: { early:{fight:9,mobility:12}, mid:{fight:24,initiation:16,survival:10}, late:{fight:11,survival:-4,objective:5} },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Eul or Shiva before repeated Supernova fights', defensiveItem:'BKB or Lotus when silence prevents spell sequence', objectiveTiming:'after Supernova zones enemy cores away from the objective' },
    calibration: { calibrationConfidence:0.66, calibrationSource:'hero-specific Phoenix review; exact Supernova attack count and enemy attack-speed exposure are not available in current GameState' },
    plans: [
      { id:'supernova_control', name:'Supernova area control', scenarioTags:['balanced','enemy_healing_high'], priority:94, items:['tranquil_boots','euls','shivas_guard','scepter'], reasons:['balanced_draft','enemy_healing_high'], optional:['refresher'] },
      { id:'silence_response', name:'Protected spell sequence', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['tranquil_boots','euls','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['scepter'] },
      { id:'recovery', name:'Low-economy sustain and escape', scenarioTags:['player_behind'], priority:86, items:['tranquil_boots','euls','glimmer_cape','force_staff'], reasons:['player_behind'], optional:['shivas_guard'] },
      { id:'objective', name:'Egg-zone objective control', scenarioTags:['objective_window','player_ahead'], priority:93, items:['tranquil_boots','shivas_guard','scepter','refresher'], reasons:['objective_window','player_ahead'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'Supernova fight reset', priority:84, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Supernova must be ready'},{type:'min_health_pct',value:0.45,message:'Do not enter the spell sequence from critical health'},{type:'min_mana_pct',value:0.5,message:'Keep mana for the full sequence'}], permanent:{fight:11,initiation:8,survival:6}, window:{fight:25,objective:9}, actions:{FIGHT:26,OBJECTIVE:10}, recommendation:'Use spells from range, then place Supernova where enemy right-clickers are controlled or forced away.' },
      { id:'euls', name:'Protected spell sequencing', priority:87, trigger:[['item_owned','euls']], expectedMinute:16, permanent:{fight:12,survival:13,mobility:8}, window:{fight:20,connect:10}, actions:{FIGHT:21,CONNECT:11}, recommendation:'Use Eul to break silence or delay retaliation, then preserve movement for Supernova positioning.' },
      { id:'shivas', name:'Attack-speed suppression zone', priority:93, trigger:[['item_owned','shivas_guard']], expectedMinute:24, requires:[{type:'ultimate_ready',message:'Supernova should be ready before the objective fight'}], permanent:{fight:18,survival:16,objective:13}, window:{fight:24,objective:19}, actions:{FIGHT:25,OBJECTIVE:20}, recommendation:'Slow enemy attacks and movement before committing Supernova near the contested objective.' },
      { id:'shivas_scepter', name:'Protected teamfight reset', priority:97, trigger:[['item_owned','shivas_guard'],['item_owned','scepter']], expectedMinute:32, permanent:{fight:25,survival:18,objective:16}, window:{fight:31,objective:22}, actions:{FIGHT:32,OBJECTIVE:23}, recommendation:'Force the enemy to choose between leaving the objective area and committing through the full Supernova control zone.' }
    ]
  },
  {
    id: 'treant_protector', displayName: 'Treant Protector', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['global_sustain','vision_controller','counter_initiator'],
    draftTags: ['heal','vision','root','tower_defense'], vulnerabilities: ['detection','dispel','open_ground'],
    identity: 'Use tree lines and fog to protect vision control, keep structures and cores healthy across the map, and cast Overgrowth after mobility or dispels are committed.',
    basePower: { farm:31, fight:74, push:55, survival:67, initiation:72, objective:66, mobility:44 },
    stageCurves: { early:{fight:11,survival:10}, mid:{fight:18,objective:18,initiation:15}, late:{fight:8,objective:14,survival:-2} },
    benchmarkPoints: [[5,175,4],[10,230,7],[20,300,12],[40,375,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Solar Crest or Blink before major objective fights', defensiveItem:'Force or Glimmer when detection removes tree-line safety', objectiveTiming:'after Overgrowth catches mobility heroes or Living Armor preserves the push' },
    calibration: { calibrationConfidence:0.67, calibrationSource:'hero-specific Treant review; exact tree geometry and hidden movement paths are not available in current GameState' },
    plans: [
      { id:'vision_overgrowth', name:'Tree-line vision and Overgrowth', scenarioTags:['balanced','team_lacks_vision'], priority:94, items:['tranquil_boots','solar_crest','blink','scepter'], reasons:['balanced_draft','team_lacks_vision'], optional:['refresher'] },
      { id:'detection_response', name:'Protected counter-initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['tranquil_boots','glimmer_cape','force_staff','blink'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Low-economy map sustain', scenarioTags:['player_behind'], priority:86, items:['tranquil_boots','glimmer_cape','force_staff','solar_crest'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Overgrowth objective lockdown', scenarioTags:['objective_window','player_ahead'], priority:95, items:['tranquil_boots','blink','scepter','refresher'], reasons:['objective_window','player_ahead'], optional:['solar_crest'] }
    ],
    spikes: [
      { id:'level_6', name:'Overgrowth counter-initiation', priority:82, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Overgrowth must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep mana for Overgrowth and follow-up control'}], permanent:{fight:10,initiation:13,objective:6}, window:{fight:23,objective:12}, actions:{FIGHT:24,OBJECTIVE:13}, recommendation:'Stay hidden until mobility spells are committed, then root the heroes preventing your team from holding formation.' },
      { id:'solar_crest', name:'Global sustain into objective', priority:86, trigger:[['item_owned','solar_crest']], expectedMinute:17, permanent:{fight:10,objective:16,survival:10}, window:{objective:20,fight:14}, actions:{OBJECTIVE:21,FIGHT:15}, recommendation:'Armor the pushing core or structure defender, then maintain vision around the next response path.' },
      { id:'blink', name:'Reliable Overgrowth access', priority:92, trigger:[['item_owned','blink']], expectedMinute:22, requires:[{type:'ultimate_ready',message:'Overgrowth should be ready before revealing Blink'}], permanent:{fight:16,initiation:20,mobility:12}, window:{fight:25,connect:13}, actions:{FIGHT:26,CONNECT:14}, recommendation:'Blink from fog after dispels or mobility are committed and root the highest-value cluster.' },
      { id:'scepter_refresher', name:'Extended map lockdown', priority:97, trigger:[['item_owned','scepter'],['item_owned','refresher']], expectedMinute:36, requires:[{type:'min_mana_pct',value:0.75,message:'Enter with mana for both control cycles'}], permanent:{fight:22,initiation:21,objective:20}, window:{fight:30,objective:27}, actions:{FIGHT:31,OBJECTIVE:28}, recommendation:'Control vision before the fight, force the first dispel, then use the second root cycle to secure the objective.' }
    ]
  },
  {
    id: 'vengeful_spirit', displayName: 'Vengeful Spirit', role: 'support', roles: ['Soft Support','Hard Support'],
    archetypes: ['save_initiator','armor_support','position_swap'],
    draftTags: ['save','initiation','armor_reduction','aura'], vulnerabilities: ['burst_after_swap','silence','poor_target_selection'],
    identity: 'Use Wave and stun to prepare a reachable target, reserve Nether Swap for either a guaranteed isolation or a high-value save, and ensure allies can act on the new positions.',
    basePower: { farm:35, fight:76, push:51, survival:49, initiation:82, objective:65, mobility:48 },
    stageCurves: { early:{fight:12,objective:5}, mid:{fight:20,initiation:20,objective:15}, late:{fight:8,initiation:10,objective:9} },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Solar Crest or Force before repeated Swap fights', defensiveItem:'Glimmer or Lotus when Swap is followed by instant burst', objectiveTiming:'after Wave armor reduction or a successful save creates a numbers advantage' },
    plans: [
      { id:'swap_utility', name:'Swap and armor utility', scenarioTags:['balanced','team_lacks_initiation'], priority:94, items:['arcane_boots','solar_crest','force_staff','scepter'], reasons:['balanced_draft','team_lacks_initiation'], optional:['blink'] },
      { id:'burst_response', name:'Protected save Swap', scenarioTags:['enemy_magic_burst_high','enemy_control_high'], priority:98, items:['arcane_boots','glimmer_cape','force_staff','lotus_orb'], reasons:['enemy_magic_burst_high','enemy_control_high'], optional:['scepter'] },
      { id:'recovery', name:'Low-economy stun and rescue', scenarioTags:['player_behind'], priority:86, items:['arcane_boots','glimmer_cape','force_staff','solar_crest'], reasons:['player_behind'], optional:['aether_lens'] },
      { id:'objective', name:'Armor reduction conversion', scenarioTags:['objective_window','player_ahead'], priority:93, items:['arcane_boots','solar_crest','scepter','assault_cuirass'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Nether Swap save or isolation', priority:84, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Nether Swap must be ready'},{type:'min_health_pct',value:0.5,message:'Keep enough health to survive the resulting position'}], permanent:{fight:10,initiation:14,mobility:5}, window:{fight:23,connect:14}, actions:{FIGHT:24,CONNECT:15}, recommendation:'Swap only when the new positions clearly save an ally or isolate a target your team can reach.' },
      { id:'solar_crest', name:'Armor and ally acceleration', priority:87, trigger:[['item_owned','solar_crest']], expectedMinute:17, permanent:{fight:12,objective:16,survival:8}, window:{objective:20,fight:16}, actions:{OBJECTIVE:21,FIGHT:17}, recommendation:'Apply armor pressure and accelerate the core hitting the objective after the pickoff is secured.' },
      { id:'force_staff', name:'Post-Swap repositioning', priority:91, trigger:[['item_owned','force_staff']], expectedMinute:21, permanent:{fight:14,survival:15,mobility:12}, window:{fight:22,connect:13}, actions:{FIGHT:23,CONNECT:14}, recommendation:'Use Force to correct the post-Swap position, save the displaced ally, or maintain stun range.' },
      { id:'crest_scepter', name:'Persistent save and objective aura', priority:96, trigger:[['item_owned','solar_crest'],['item_owned','scepter']], expectedMinute:30, requires:[{type:'min_health_pct',value:0.55,message:'Reset before taking a sacrificial Swap position'}], permanent:{fight:21,objective:20,initiation:15}, window:{fight:27,objective:24}, actions:{FIGHT:28,OBJECTIVE:25}, recommendation:'Take the decisive Swap, preserve team formation, and convert the armor advantage into the objective.' }
    ]
  }
];

export const HERO_IDS = Object.freeze(DEFINITIONS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createExplicitProfilePack(DEFINITIONS, dependencies, CALIBRATION); }
