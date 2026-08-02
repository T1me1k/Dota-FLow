import { createExplicitProfilePack } from './explicit-profile-pack.mjs';

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-utility-support-v2',
  calibrationSource: 'hero-specific damage and utility support strategic review; live recordings pending',
  calibrationConfidence: 0.70,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const DEFINITIONS = [
  {
    id: 'riki', displayName: 'Riki', role: 'support', roles: ['Soft Support','Carry'],
    archetypes: ['invisible_roamer','vision_denial','backline_disruptor'],
    draftTags: ['invisibility','silence_zone','pickoff','vision_denial'], vulnerabilities: ['detection','area_control','instant_disable'],
    identity: 'Use invisibility to remove enemy vision and threaten supports, but commit only after detection and escape routes are understood.',
    basePower: { farm:46, fight:65, push:34, survival:60, initiation:70, objective:47, mobility:86 },
    stageCurves: { early:{fight:6,mobility:14,initiation:8}, mid:{fight:18,mobility:16,initiation:13,objective:7}, late:{fight:-3,survival:-7,objective:2,mobility:5} },
    benchmarkPoints: [[5,190,4],[10,255,7],[20,340,13],[40,430,21]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Diffusal Blade before repeated support pickoffs', defensiveItem:'BKB, Force Staff, or Lotus when detection and control punish the first reveal', objectiveTiming:'after vision denial or a support pickoff creates safe access' },
    plans: [
      { id:'diffusal_pickoff', name:'Diffusal support pickoff', scenarioTags:['balanced','player_ahead'], priority:90, items:['tranquil_boots','diffusal','solar_crest','bkb'], reasons:['balanced_draft','player_ahead'], optional:['force_staff'] },
      { id:'control_response', name:'Detection and control response', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['tranquil_boots','diffusal','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['force_staff'] },
      { id:'recovery', name:'Low-economy vision denial', scenarioTags:['player_behind'], priority:85, items:['tranquil_boots','drums','force_staff','glimmer_cape'], reasons:['player_behind'], optional:['diffusal'] },
      { id:'objective', name:'Backline removal into objective', scenarioTags:['objective_window','team_lacks_vision'], priority:93, items:['phase_boots','diffusal','solar_crest','bkb'], reasons:['objective_window','team_lacks_vision'], optional:['lotus_orb'] }
    ],
    spikes: [
      { id:'level_6', name:'Tricks teamfight access', priority:76, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Ultimate must be ready'},{type:'min_health_pct',value:0.5,message:'Do not reveal from a losing health state'}], permanent:{fight:7,mobility:8,initiation:7}, window:{fight:16,connect:17}, actions:{FIGHT:17,CONNECT:18}, recommendation:'Enter after detection is shown, disrupt the backline, and preserve a path out instead of chasing through sentries.' },
      { id:'diffusal', name:'Diffusal support isolation', priority:86, trigger:[['item_owned','diffusal']], expectedMinute:16, requires:[{type:'min_health_pct',value:0.55,message:'Reset before the first reveal'}], permanent:{fight:14,initiation:12,mobility:7}, window:{fight:20,connect:15}, actions:{FIGHT:21,CONNECT:16}, recommendation:'Slow the isolated support after allied control begins and avoid spending the reveal into full enemy detection.' },
      { id:'bkb', name:'Protected backline disruption', priority:94, trigger:[['item_owned','bkb']], expectedMinute:24, requires:[{type:'min_health_pct',value:0.6,message:'Enter with enough health to use the protection window'}], permanent:{fight:17,survival:22,initiation:8}, window:{fight:24,objective:9}, actions:{FIGHT:25,OBJECTIVE:10}, recommendation:'Cross the first control layer, silence the backline zone, then disengage before BKB ends.' },
      { id:'diffusal_solar', name:'Pickoff-to-objective conversion', priority:96, trigger:[['item_owned','diffusal'],['item_owned','solar_crest']], expectedMinute:27, permanent:{fight:18,objective:16,mobility:9}, window:{objective:21,connect:14}, actions:{OBJECTIVE:22,CONNECT:15}, recommendation:'Remove vision, isolate one responder, and use Solar Crest on the ally converting the objective.' }
    ]
  },
  {
    id: 'rubick', displayName: 'Rubick', role: 'support', roles: ['Soft Support'],
    archetypes: ['spell_counter','cast_range_support','counter_initiator'],
    draftTags: ['spell_steal','cast_range','save','counter_initiation'], vulnerabilities: ['jump','silence','low_durability'],
    identity: 'Play at maximum cast range, turn enemy high-impact spells against them, and value positioning and the correct stolen spell over low-value damage.',
    basePower: { farm:36, fight:76, push:37, survival:48, initiation:67, objective:44, mobility:47 },
    stageCurves: { early:{fight:7,initiation:5,survival:-2}, mid:{fight:19,initiation:13,survival:5,mobility:7}, late:{fight:15,initiation:9,survival:-5,objective:5} },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens or Blink before major spell-steal fights', defensiveItem:'Force Staff or Glimmer when enemy jump reaches the backline', objectiveTiming:'after stealing wave-clear or teamfight control' },
    plans: [
      { id:'cast_range_control', name:'Cast-range spell control', scenarioTags:['balanced','enemy_control_high'], priority:92, items:['arcane_boots','aether_lens','blink','scepter'], reasons:['balanced_draft','enemy_control_high'], optional:['force_staff'] },
      { id:'control_response', name:'Protected backline casting', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','force_staff','glimmer_cape','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens'] },
      { id:'recovery', name:'Low-economy cast utility', scenarioTags:['player_behind'], priority:86, items:['arcane_boots','force_staff','glimmer_cape','aether_lens'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Stolen-spell objective control', scenarioTags:['objective_window','player_ahead'], priority:93, items:['arcane_boots','blink','scepter','octarine_core'], reasons:['objective_window','player_ahead'], optional:['aether_lens'] }
    ],
    spikes: [
      { id:'level_6', name:'Spell Steal counterplay window', priority:80, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Spell Steal must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep mana for steal and follow-up casts'}], permanent:{fight:10,initiation:7}, window:{fight:20,connect:12}, actions:{FIGHT:21,CONNECT:13}, recommendation:'Stay outside the first jump, steal the highest-impact available spell, and cast it before greedily searching for a better one.' },
      { id:'aether_lens', name:'Safe cast-range breakpoint', priority:85, trigger:[['item_owned','aether_lens']], expectedMinute:15, permanent:{fight:10,survival:9,initiation:8}, window:{fight:16,connect:11}, actions:{FIGHT:17,CONNECT:12}, recommendation:'Use the extra range to lift or save without entering the enemy initiation radius.' },
      { id:'blink', name:'Blink counter-initiation angle', priority:91, trigger:[['item_owned','blink']], expectedMinute:20, requires:[{type:'min_health_pct',value:0.5,message:'Do not hold Blink from a damaged exposed position'}], permanent:{fight:14,initiation:17,mobility:13}, window:{fight:22,connect:14}, actions:{FIGHT:23,CONNECT:15}, recommendation:'Remain unseen until the enemy commits, then Blink to the angle that protects your core or catches the exposed backline.' },
      { id:'scepter', name:'Expanded stolen-spell arsenal', priority:96, trigger:[['item_owned','scepter']], expectedMinute:28, requires:[{type:'min_mana_pct',value:0.55,message:'Refill before a long spell sequence'}], permanent:{fight:21,initiation:12,objective:8}, window:{fight:25,objective:12}, actions:{FIGHT:26,OBJECTIVE:13}, recommendation:'Enter the fight with a useful spell already secured and cycle control from safe range.' }
    ]
  },
  {
    id: 'skywrath_mage', displayName: 'Skywrath Mage', role: 'support', roles: ['Soft Support','Hard Support'],
    archetypes: ['single_target_burst','silence_support','control_followup'],
    draftTags: ['magic_burst','silence','anti_mobility','pickoff'], vulnerabilities: ['dispel','magic_immunity','gap_close'],
    identity: 'Chain silence and magic burst onto a target already controlled by an ally; avoid spending the full sequence without reliable setup.',
    basePower: { farm:31, fight:78, push:24, survival:38, initiation:61, objective:36, mobility:43 },
    stageCurves: { early:{fight:13,initiation:5,survival:-5}, mid:{fight:22,initiation:13,objective:4}, late:{fight:-5,survival:-8,initiation:3} },
    benchmarkPoints: [[5,175,4],[10,235,7],[20,305,12],[40,375,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Rod of Atos before unsupported Mystic Flare attempts', defensiveItem:'Force Staff, Glimmer, or Eul when gap close reaches the backline', objectiveTiming:'after bursting the mobile or save hero' },
    plans: [
      { id:'atos_burst', name:'Atos burst setup', scenarioTags:['balanced','team_lacks_control'], priority:94, items:['tranquil_boots','atos','aether_lens','scepter'], reasons:['balanced_draft','team_lacks_control'], optional:['octarine_core'] },
      { id:'control_response', name:'Survivable silence utility', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['tranquil_boots','euls','glimmer_cape','force_staff'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['atos'] },
      { id:'recovery', name:'Low-economy control follow-up', scenarioTags:['player_behind'], priority:87, items:['tranquil_boots','atos','glimmer_cape','force_staff'], reasons:['player_behind'], optional:['aether_lens'] },
      { id:'objective', name:'Pickoff burst conversion', scenarioTags:['objective_window','player_ahead'], priority:93, items:['arcane_boots','atos','scepter','octarine_core'], reasons:['objective_window','player_ahead'], optional:['aether_lens'] }
    ],
    spikes: [
      { id:'level_6', name:'Mystic Flare kill window', priority:82, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Mystic Flare must be ready'},{type:'min_mana_pct',value:0.65,message:'Keep mana for the complete burst sequence'}], permanent:{fight:11,initiation:5}, window:{fight:23,connect:12}, actions:{FIGHT:24,CONNECT:13}, recommendation:'Use Mystic Flare only after reliable control separates the target from nearby units.' },
      { id:'atos', name:'Independent control setup', priority:90, trigger:[['item_owned','atos']], expectedMinute:15, requires:[{type:'min_mana_pct',value:0.55,message:'Refill before the full spell chain'}], permanent:{fight:15,initiation:17}, window:{fight:24,connect:16}, actions:{FIGHT:25,CONNECT:17}, recommendation:'Root the mobile target, apply silence, and commit burst only while the setup remains reliable.' },
      { id:'aether_lens', name:'Protected silence range', priority:86, trigger:[['item_owned','aether_lens']], expectedMinute:19, permanent:{fight:10,survival:10,initiation:8}, window:{fight:17,connect:12}, actions:{FIGHT:18,CONNECT:13}, recommendation:'Stay outside gap-close range and silence the hero who can interrupt your team’s first spell sequence.' },
      { id:'atos_scepter', name:'Sustained single-target burst', priority:96, trigger:[['item_owned','atos'],['item_owned','scepter']], expectedMinute:28, requires:[{type:'ultimate_ready',message:'Ultimate should be ready for the protected setup'}], permanent:{fight:23,initiation:16,objective:7}, window:{fight:27,objective:11}, actions:{FIGHT:28,OBJECTIVE:12}, recommendation:'Delete the save or mobility hero under control, then convert the numbers advantage immediately.' }
    ]
  },
  {
    id: 'snapfire', displayName: 'Snapfire', role: 'support', roles: ['Soft Support','Hard Support'],
    archetypes: ['long_range_artillery','save_support','physical_amplifier'],
    draftTags: ['long_range_damage','save','armor_reduction','teamfight'], vulnerabilities: ['gap_close','silence','scattered_fights'],
    identity: 'Protect allies with short-range utility, then deliver long-range artillery only after control fixes enemy movement and your firing position is safe.',
    basePower: { farm:40, fight:75, push:42, survival:55, initiation:52, objective:57, mobility:46 },
    stageCurves: { early:{fight:10,survival:4,objective:4}, mid:{fight:21,objective:13,initiation:8}, late:{fight:6,objective:9,survival:-3} },
    benchmarkPoints: [[5,185,4],[10,245,7],[20,320,12],[40,405,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Solar Crest or Force Staff before repeated objective fights', defensiveItem:'Glimmer, Force, or Lotus against backline jump', objectiveTiming:'after artillery or ally-save utility wins the approach' },
    plans: [
      { id:'solar_artillery', name:'Solar artillery support', scenarioTags:['balanced','objective_window'], priority:91, items:['arcane_boots','solar_crest','force_staff','scepter'], reasons:['balanced_draft','objective_window'], optional:['guardian_greaves'] },
      { id:'control_response', name:'Protected backline artillery', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','glimmer_cape','force_staff','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['solar_crest'] },
      { id:'recovery', name:'Low-economy save utility', scenarioTags:['player_behind'], priority:86, items:['arcane_boots','force_staff','glimmer_cape','solar_crest'], reasons:['player_behind'], optional:['scepter'] },
      { id:'objective', name:'Objective sustain and artillery', scenarioTags:['objective_window','player_ahead'], priority:94, items:['arcane_boots','solar_crest','scepter','guardian_greaves'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Long-range artillery window', priority:81, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Ultimate must be ready'},{type:'min_mana_pct',value:0.6,message:'Keep mana for the full artillery channel'}], permanent:{fight:10,objective:7}, window:{fight:22,objective:12}, actions:{FIGHT:23,OBJECTIVE:13}, recommendation:'Fire from outside enemy jump range after allied control fixes movement; cancel the angle when the frontline collapses.' },
      { id:'solar_crest', name:'Core acceleration utility', priority:86, trigger:[['item_owned','solar_crest']], expectedMinute:16, permanent:{fight:9,objective:15,survival:6}, window:{objective:20,fight:12}, actions:{OBJECTIVE:21,FIGHT:13}, recommendation:'Use Solar Crest on the ally taking the objective or surviving the first contact, not on a target already disengaging.' },
      { id:'force_staff', name:'Artillery position insurance', priority:89, trigger:[['item_owned','force_staff']], expectedMinute:20, permanent:{survival:14,mobility:11,fight:7}, window:{fight:17,connect:10}, actions:{FIGHT:18,CONNECT:11}, recommendation:'Save Force Staff for the ally or firing position threatened by the first gap-close spell.' },
      { id:'scepter', name:'Expanded save and initiation utility', priority:95, trigger:[['item_owned','scepter']], expectedMinute:28, requires:[{type:'min_mana_pct',value:0.5,message:'Refill before the objective fight'}], permanent:{fight:18,initiation:13,objective:14}, window:{fight:24,objective:18}, actions:{FIGHT:25,OBJECTIVE:19}, recommendation:'Use the upgraded utility to reposition a key ally, then layer artillery on the controlled retreat path.' }
    ]
  },
  {
    id: 'techies', displayName: 'Techies', role: 'support', roles: ['Soft Support'],
    archetypes: ['area_denial','setup_burst','vision_control'],
    draftTags: ['area_denial','burst','high_ground_defense','vision'], vulnerabilities: ['dispel','instant_disable','setup_time'],
    identity: 'Shape approaches with area denial and vision, then commit burst only when the target enters a prepared zone instead of forcing unsupported jumps.',
    basePower: { farm:45, fight:73, push:48, survival:49, initiation:62, objective:61, mobility:50 },
    stageCurves: { early:{fight:9,objective:6,initiation:4}, mid:{fight:20,objective:18,initiation:10}, late:{fight:8,objective:15,survival:-4} },
    benchmarkPoints: [[5,185,4],[10,245,7],[20,325,12],[40,410,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens or Force Staff before repeated setup fights', defensiveItem:'Glimmer, Force, or Eul when the setup hero is jumped', objectiveTiming:'after preparing vision and denial around the approach' },
    calibration: { calibrationConfidence:0.66, calibrationSource:'hero-specific Techies review; exact mine placement and prepared-zone geometry are not available in current GameState' },
    plans: [
      { id:'range_denial', name:'Cast-range area denial', scenarioTags:['balanced','objective_window'], priority:92, items:['arcane_boots','aether_lens','force_staff','scepter'], reasons:['balanced_draft','objective_window'], optional:['octarine_core'] },
      { id:'control_response', name:'Protected setup utility', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','euls','glimmer_cape','force_staff'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens'] },
      { id:'recovery', name:'Low-economy defensive denial', scenarioTags:['player_behind'], priority:87, items:['tranquil_boots','force_staff','glimmer_cape','aether_lens'], reasons:['player_behind'], optional:['euls'] },
      { id:'objective', name:'Prepared objective approach', scenarioTags:['objective_window','player_ahead'], priority:95, items:['arcane_boots','aether_lens','scepter','octarine_core'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Prepared-zone burst window', priority:80, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Ultimate must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for the full setup sequence'}], permanent:{fight:9,objective:9}, window:{fight:19,objective:15}, actions:{FIGHT:20,OBJECTIVE:16}, recommendation:'Fight inside prepared vision and denial; do not chase beyond the zone after the first target escapes.' },
      { id:'aether_lens', name:'Safe denial range', priority:85, trigger:[['item_owned','aether_lens']], expectedMinute:15, permanent:{fight:10,survival:9,objective:10}, window:{objective:18,fight:14}, actions:{OBJECTIVE:19,FIGHT:15}, recommendation:'Control the objective entrance from outside enemy jump range and keep an escape route behind the prepared zone.' },
      { id:'force_staff', name:'Setup survival breakpoint', priority:88, trigger:[['item_owned','force_staff']], expectedMinute:20, permanent:{survival:15,mobility:11,initiation:5}, window:{fight:16,connect:9}, actions:{FIGHT:17,CONNECT:10}, recommendation:'Use Force Staff to preserve the setup hero or displace an ally out of the enemy’s first burst.' },
      { id:'scepter', name:'High-value area denial', priority:95, trigger:[['item_owned','scepter']], expectedMinute:28, requires:[{type:'min_mana_pct',value:0.5,message:'Refill before preparing the objective area'}], permanent:{fight:18,objective:20,initiation:8}, window:{objective:25,fight:18}, actions:{OBJECTIVE:26,FIGHT:19}, recommendation:'Prepare the objective approach before the enemy arrives and force them through the controlled area.' }
    ]
  },
  {
    id: 'venomancer', displayName: 'Venomancer', role: 'support', roles: ['Soft Support','Offlane'],
    archetypes: ['attrition_support','vision_controller','anti_sustain'],
    draftTags: ['damage_over_time','vision','anti_heal','area_control'], vulnerabilities: ['burst','dispel','mobility'],
    identity: 'Spread vision and damage over time across the fight, reduce sustain, and kite through controlled ground rather than standing as the frontline.',
    basePower: { farm:43, fight:72, push:53, survival:47, initiation:45, objective:66, mobility:35 },
    stageCurves: { early:{fight:12,objective:8,mobility:-4}, mid:{fight:19,objective:20,survival:4}, late:{fight:-2,objective:9,survival:-6} },
    benchmarkPoints: [[5,185,4],[10,245,7],[20,325,12],[40,405,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Spirit Vessel or team aura before repeated sustain fights', defensiveItem:'Force Staff, Glimmer, or Pipe when burst reaches the backline', objectiveTiming:'after wards and damage-over-time control the approach' },
    plans: [
      { id:'vessel_attrition', name:'Anti-sustain attrition', scenarioTags:['balanced','enemy_healing_high'], priority:93, items:['tranquil_boots','spirit_vessel','force_staff','guardian_greaves'], reasons:['balanced_draft','enemy_healing_high'], optional:['shivas_guard'] },
      { id:'control_response', name:'Protected area control', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['tranquil_boots','pipe','force_staff','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['glimmer_cape'] },
      { id:'recovery', name:'Low-economy vision and anti-heal', scenarioTags:['player_behind'], priority:87, items:['tranquil_boots','spirit_vessel','glimmer_cape','force_staff'], reasons:['player_behind'], optional:['pipe'] },
      { id:'objective', name:'Objective attrition control', scenarioTags:['objective_window','player_ahead'], priority:95, items:['arcane_boots','spirit_vessel','guardian_greaves','shivas_guard'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Teamfight attrition window', priority:79, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Ultimate must be ready'},{type:'min_health_pct',value:0.45,message:'Do not walk into burst range from low health'}], permanent:{fight:10,objective:8}, window:{fight:21,objective:14}, actions:{FIGHT:22,OBJECTIVE:15}, recommendation:'Tag multiple heroes, retreat through controlled ground, and let damage over time weaken the next objective defense.' },
      { id:'spirit_vessel', name:'Anti-sustain pressure', priority:87, trigger:[['item_owned','spirit_vessel']], expectedMinute:15, permanent:{fight:14,objective:10,survival:5}, window:{fight:20,objective:15}, actions:{FIGHT:21,OBJECTIVE:16}, recommendation:'Apply Vessel to the sustain target while damage over time covers the rest of the formation.' },
      { id:'guardian_greaves', name:'Attrition sustain breakpoint', priority:91, trigger:[['item_owned','guardian_greaves']], expectedMinute:23, requires:[{type:'min_health_pct',value:0.45,message:'Do not arrive after the frontline has already collapsed'}], permanent:{fight:15,survival:18,objective:13}, window:{fight:22,objective:17}, actions:{FIGHT:23,OBJECTIVE:18}, recommendation:'Reset allied resources during the extended fight and keep vision on the enemy retreat path.' },
      { id:'vessel_shivas', name:'Maximum anti-sustain control', priority:96, trigger:[['item_owned','spirit_vessel'],['item_owned','shivas_guard']], expectedMinute:31, permanent:{fight:22,objective:19,survival:12}, window:{fight:26,objective:23}, actions:{FIGHT:27,OBJECTIVE:24}, recommendation:'Layer anti-heal and area slow across the objective entrance, then kite instead of overextending for the final hit.' }
    ]
  },
  {
    id: 'silencer', displayName: 'Silencer', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['global_counter_initiator','silence_support','backline_scaler'],
    draftTags: ['global_silence','counter_initiation','anti_caster','scaling'], vulnerabilities: ['dispel','gap_close','physical_burst'],
    identity: 'Hold Global Silence for the enemy commitment or a coordinated kill window, and preserve backline positioning instead of spending it on low-impact poke.',
    basePower: { farm:35, fight:76, push:31, survival:45, initiation:58, objective:51, mobility:36 },
    stageCurves: { early:{fight:8,survival:-3}, mid:{fight:20,initiation:12,objective:9}, late:{fight:15,objective:8,survival:-5} },
    benchmarkPoints: [[5,175,4],[10,235,7],[20,305,12],[40,390,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Force Staff or Glimmer before holding Global Silence from the backline', defensiveItem:'Force, Glimmer, or Lotus against direct jump', objectiveTiming:'when Global Silence can protect the first objective commitment' },
    plans: [
      { id:'global_counter', name:'Global counter-initiation', scenarioTags:['balanced','enemy_control_high'], priority:94, items:['arcane_boots','force_staff','glimmer_cape','refresher'], reasons:['balanced_draft','enemy_control_high'], optional:['scepter'] },
      { id:'control_response', name:'Protected Global Silence', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['arcane_boots','force_staff','lotus_orb','glimmer_cape'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['refresher'] },
      { id:'recovery', name:'Low-economy global utility', scenarioTags:['player_behind'], priority:87, items:['tranquil_boots','force_staff','glimmer_cape','aether_lens'], reasons:['player_behind'], optional:['scepter'] },
      { id:'objective', name:'Global objective protection', scenarioTags:['objective_window','player_ahead'], priority:95, items:['arcane_boots','glimmer_cape','scepter','refresher'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Global Silence counter-window', priority:84, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Global Silence must be ready'},{type:'min_mana_pct',value:0.4,message:'Keep mana for Global Silence'}], permanent:{fight:11,initiation:9,objective:6}, window:{fight:23,objective:12}, actions:{FIGHT:24,OBJECTIVE:13}, recommendation:'Cast after the enemy commits key spells or as your team begins a guaranteed kill sequence, not for harmless map contact.' },
      { id:'force_staff', name:'Backline survival utility', priority:85, trigger:[['item_owned','force_staff']], expectedMinute:15, permanent:{survival:14,mobility:10,fight:6}, window:{fight:15,connect:9}, actions:{FIGHT:16,CONNECT:10}, recommendation:'Preserve the Global Silence holder or rescue the core targeted by the first jump.' },
      { id:'scepter', name:'Expanded anti-caster pressure', priority:91, trigger:[['item_owned','scepter']], expectedMinute:25, requires:[{type:'min_mana_pct',value:0.45,message:'Refill before the teamfight sequence'}], permanent:{fight:17,objective:10,initiation:8}, window:{fight:22,objective:14}, actions:{FIGHT:23,OBJECTIVE:15}, recommendation:'Pressure clustered spellcasters while staying outside direct initiation range.' },
      { id:'refresher', name:'Double global teamfight control', priority:98, trigger:[['item_owned','refresher']], expectedMinute:34, requires:[{type:'ultimate_ready',message:'Global Silence must be ready'},{type:'min_mana_pct',value:0.75,message:'Double global control requires a high mana reserve'}], permanent:{fight:25,objective:17,initiation:13}, window:{fight:30,objective:21}, actions:{FIGHT:31,OBJECTIVE:22}, recommendation:'Use the first Global Silence to protect commitment and the second only after dispels or enemy re-entry create another decisive window.' }
    ]
  },
  {
    id: 'witch_doctor', displayName: 'Witch Doctor', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['channeling_teamfighter','sustain_support','chain_stun'],
    draftTags: ['teamfight_damage','healing','chain_stun','anti_sustain'], vulnerabilities: ['channel_interrupt','vision','gap_close'],
    identity: 'Stabilize the frontline with sustain and chain control, then channel damage from protected fog only after interrupts and enemy vision are accounted for.',
    basePower: { farm:34, fight:82, push:28, survival:44, initiation:63, objective:49, mobility:38 },
    stageCurves: { early:{fight:13,survival:2,initiation:7}, mid:{fight:23,initiation:12,survival:4}, late:{fight:10,survival:-7,objective:5} },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Glimmer Cape before exposed Death Ward channels', defensiveItem:'Glimmer, Force, or BKB against channel interruption', objectiveTiming:'after chain control or sustain wins the first engagement' },
    plans: [
      { id:'glimmer_channel', name:'Protected Death Ward channel', scenarioTags:['balanced','enemy_physical_dps_high'], priority:94, items:['arcane_boots','glimmer_cape','aether_lens','scepter'], reasons:['balanced_draft','enemy_physical_dps_high'], optional:['bkb'] },
      { id:'control_response', name:'Channel interruption response', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['tranquil_boots','glimmer_cape','force_staff','bkb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Low-economy sustain and save', scenarioTags:['player_behind'], priority:87, items:['arcane_boots','glimmer_cape','force_staff','aether_lens'], reasons:['player_behind'], optional:['scepter'] },
      { id:'objective', name:'Teamfight win conversion', scenarioTags:['objective_window','player_ahead'], priority:95, items:['arcane_boots','glimmer_cape','scepter','refresher'], reasons:['objective_window','player_ahead'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'Death Ward teamfight window', priority:83, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Death Ward must be ready'},{type:'min_mana_pct',value:0.6,message:'Keep mana for control and the full channel'}], permanent:{fight:12,initiation:6}, window:{fight:24,connect:11}, actions:{FIGHT:25,CONNECT:12}, recommendation:'Begin the channel from fog after the first interrupt is committed and your stun has fixed the target area.' },
      { id:'glimmer_cape', name:'Protected channel breakpoint', priority:90, trigger:[['item_owned','glimmer_cape']], expectedMinute:15, requires:[{type:'min_health_pct',value:0.5,message:'Do not channel from a losing health state'}], permanent:{fight:14,survival:18}, window:{fight:23,objective:10}, actions:{FIGHT:24,OBJECTIVE:11}, recommendation:'Use Glimmer to protect the channel or save the ally carrying the fight; account for enemy detection first.' },
      { id:'scepter', name:'High-impact Death Ward', priority:95, trigger:[['item_owned','scepter']], expectedMinute:27, requires:[{type:'ultimate_ready',message:'Death Ward must be ready'},{type:'min_mana_pct',value:0.55,message:'Refill before the objective fight'}], permanent:{fight:23,objective:10}, window:{fight:28,objective:15}, actions:{FIGHT:29,OBJECTIVE:16}, recommendation:'Channel from a protected angle after enemy interrupts are forced, then convert the won fight before vision resets.' },
      { id:'glimmer_scepter', name:'Protected late teamfight channel', priority:98, trigger:[['item_owned','glimmer_cape'],['item_owned','scepter']], expectedMinute:30, permanent:{fight:26,survival:16,objective:13}, window:{fight:30,objective:19}, actions:{FIGHT:31,OBJECTIVE:20}, recommendation:'Coordinate stun, protection, and the upgraded channel on the highest-value clustered targets.' }
    ]
  }
];

export const HERO_IDS = Object.freeze(DEFINITIONS.map((entry) => entry.id));
export function createProfilePack(dependencies) {
  return createExplicitProfilePack(DEFINITIONS, dependencies, CALIBRATION);
}
