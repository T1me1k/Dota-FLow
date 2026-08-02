import { createExplicitProfilePack } from './explicit-profile-pack.mjs';

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-roaming-support-v2',
  calibrationSource: 'hero-specific roaming support strategic review; live recordings pending',
  calibrationConfidence: 0.70,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const DEFINITIONS = [
  {
    id: 'bounty_hunter', displayName: 'Bounty Hunter', role: 'support', roles: ['Soft Support'],
    archetypes: ['vision_roamer','economy_accelerator','pickoff_support'],
    draftTags: ['vision','pickoff','track_economy','mobility'], vulnerabilities: ['detection','teamfight_control','burst'],
    identity: 'Expose isolated targets with Track, preserve vision advantage, and turn small pickoffs into team-wide gold rather than forcing unsupported solo kills.',
    basePower: { farm:38, fight:62, push:31, survival:58, initiation:66, objective:55, mobility:82 },
    stageCurves: { early:{fight:8,mobility:12,initiation:7}, mid:{fight:14,mobility:15,objective:12,initiation:11}, late:{fight:-4,survival:-6,objective:4,mobility:5} },
    benchmarkPoints: [[5,190,4],[10,250,7],[20,325,12],[40,405,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Spirit Vessel or utility before repeated Track fights', defensiveItem:'Force Staff or Glimmer when detection and burst punish scouting', objectiveTiming:'after a Track pickoff creates a numbers advantage' },
    plans: [
      { id:'track_economy', name:'Track economy tempo', scenarioTags:['balanced','player_ahead'], priority:88, items:['tranquil_boots','drums','spirit_vessel','solar_crest'], reasons:['balanced_draft','player_ahead'], optional:['scepter'] },
      { id:'control_response', name:'Protected vision and Track', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:96, items:['tranquil_boots','spirit_vessel','glimmer_cape','force_staff'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Low-economy scouting utility', scenarioTags:['player_behind'], priority:84, items:['tranquil_boots','drums','force_staff','glimmer_cape'], reasons:['player_behind'], optional:['spirit_vessel'] },
      { id:'objective', name:'Tracked pickoff conversion', scenarioTags:['objective_window','team_lacks_vision'], priority:92, items:['tranquil_boots','spirit_vessel','solar_crest','scepter'], reasons:['objective_window','team_lacks_vision'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Track economy window', priority:76, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Track must be ready'},{type:'min_mana_pct',value:0.35,message:'Keep mana for Track and escape'}], permanent:{fight:6,objective:7,mobility:4}, window:{fight:15,connect:18,objective:9}, actions:{FIGHT:16,CONNECT:19,OBJECTIVE:10}, recommendation:'Track the target your team can actually reach and stay alive long enough to refresh vision through the fight.' },
      { id:'spirit_vessel', name:'Tracked anti-sustain pickoff', priority:84, trigger:[['item_owned','spirit_vessel']], expectedMinute:15, requires:[{type:'min_health_pct',value:0.45,message:'Do not reveal from low health'}], permanent:{fight:11,objective:7,survival:5}, window:{fight:18,connect:13}, actions:{FIGHT:19,CONNECT:14}, recommendation:'Apply Vessel after Track on the killable sustain target, then disengage before detection collapses on you.' },
      { id:'solar_crest', name:'Track plus ally acceleration', priority:89, trigger:[['item_owned','solar_crest']], expectedMinute:21, permanent:{fight:10,objective:13,survival:6}, window:{objective:18,fight:14}, actions:{OBJECTIVE:19,FIGHT:15}, recommendation:'Use the pickoff gold lead to accelerate the ally hitting the objective instead of hunting alone.' },
      { id:'vessel_crest', name:'Economy-to-objective breakpoint', priority:94, trigger:[['item_owned','spirit_vessel'],['item_owned','solar_crest']], expectedMinute:27, requires:[{type:'min_health_pct',value:0.5,message:'Reset before scouting the objective entrance'}], permanent:{fight:14,objective:19,mobility:6}, window:{objective:23,connect:15}, actions:{OBJECTIVE:24,CONNECT:16}, recommendation:'Secure vision around the objective, Track the first responder, and let the team convert the gold advantage.' }
    ]
  },
  {
    id: 'clockwerk', displayName: 'Clockwerk', role: 'support', roles: ['Soft Support','Offlane'],
    archetypes: ['long_range_initiator','isolation_support','vision_breaker'],
    draftTags: ['initiation','isolation','vision','counter_positioning'], vulnerabilities: ['save','force_movement','magic_burst'],
    identity: 'Use long-range access to isolate a backline target, trap the correct hero with Cogs, and survive long enough for allies to reach the engagement.',
    basePower: { farm:35, fight:72, push:30, survival:69, initiation:88, objective:45, mobility:68 },
    stageCurves: { early:{fight:10,survival:7,initiation:6}, mid:{fight:17,initiation:22,mobility:12}, late:{fight:-2,survival:-5,initiation:8,objective:2} },
    benchmarkPoints: [[5,185,4],[10,245,7],[20,315,12],[40,385,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blade Mail or Force Staff after Hookshot access', defensiveItem:'Force, Lotus, or BKB when the first jump is punished', objectiveTiming:'after isolating the enemy save or wave-clear hero' },
    plans: [
      { id:'hook_isolation', name:'Hookshot isolation', scenarioTags:['balanced','team_lacks_initiation'], priority:91, items:['tranquil_boots','blade_mail','force_staff','scepter'], reasons:['balanced_draft','team_lacks_initiation'], optional:['shivas_guard'] },
      { id:'control_response', name:'Protected first contact', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['tranquil_boots','force_staff','lotus_orb','bkb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['blade_mail'] },
      { id:'recovery', name:'Low-economy rescue and vision', scenarioTags:['player_behind'], priority:85, items:['tranquil_boots','force_staff','glimmer_cape','blade_mail'], reasons:['player_behind'], optional:['lotus_orb'] },
      { id:'objective', name:'Backline removal into objective', scenarioTags:['objective_window','player_ahead'], priority:93, items:['tranquil_boots','blade_mail','scepter','shivas_guard'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Hookshot global pickoff access', priority:80, trigger:[['level_gte',6]], expectedMinute:8, requires:[{type:'ultimate_ready',message:'Hookshot must be ready'},{type:'min_health_pct',value:0.55,message:'Keep enough health to survive inside Cogs'}], permanent:{fight:8,initiation:12,mobility:7}, window:{fight:20,connect:19}, actions:{FIGHT:21,CONNECT:20}, recommendation:'Hook the isolated backline or interrupt channeling; avoid trapping the target your team cannot reach.' },
      { id:'blade_mail', name:'Punishing first-contact durability', priority:84, trigger:[['item_owned','blade_mail']], expectedMinute:14, requires:[{type:'min_health_pct',value:0.55,message:'Enter with enough health to absorb retaliation'}], permanent:{fight:12,survival:14}, window:{fight:18,pressure:8}, actions:{FIGHT:19,PRESSURE:9}, recommendation:'Take first contact on a damage-heavy target while allies close the distance.' },
      { id:'force_staff', name:'Cogs control and rescue', priority:88, trigger:[['item_owned','force_staff']], expectedMinute:18, permanent:{survival:12,initiation:7,mobility:10}, window:{fight:16,connect:14}, actions:{FIGHT:17,CONNECT:15}, recommendation:'Use Force to correct a bad Cogs angle, rescue an ally, or keep the isolated target separated.' },
      { id:'scepter', name:'Repeated initiation pressure', priority:95, trigger:[['item_owned','scepter']], expectedMinute:27, requires:[{type:'min_health_pct',value:0.6,message:'Reset before committing to repeated contact'}], permanent:{fight:17,initiation:16,mobility:9}, window:{fight:24,objective:12}, actions:{FIGHT:25,OBJECTIVE:13}, recommendation:'Chain disruption on the backline, then convert the numbers advantage before cooldowns recover.' }
    ]
  },
  {
    id: 'earth_spirit', displayName: 'Earth Spirit', role: 'support', roles: ['Soft Support'],
    archetypes: ['mobile_roamer','teamfight_disruptor','save_support'],
    draftTags: ['mobility','silence','displacement','teamfight'], vulnerabilities: ['resource_tracking','instant_disable','burst'],
    identity: 'Enter from an unseen angle, connect displacement and silence before Magnetize, then preserve an exit instead of spending every movement tool on entry.',
    basePower: { farm:32, fight:75, push:27, survival:57, initiation:83, objective:42, mobility:91 },
    stageCurves: { early:{fight:13,mobility:18,initiation:10}, mid:{fight:18,initiation:18,mobility:12}, late:{fight:-4,survival:-6,initiation:4,mobility:5} },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,305,12],[40,375,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Spirit Vessel or Eul before repeated Magnetize fights', defensiveItem:'BKB, Lotus, or Glimmer when entry is instantly punished', objectiveTiming:'after a multi-hero silence or displacement creates space' },
    calibration: { calibrationConfidence:0.66, calibrationSource:'hero-specific Earth Spirit review; exact Stone Remnant stock is not available in current GameState' },
    plans: [
      { id:'magnetize_roam', name:'Magnetize roaming pressure', scenarioTags:['balanced','enemy_healing_high'], priority:90, items:['tranquil_boots','spirit_vessel','euls','bkb'], reasons:['balanced_draft','enemy_healing_high'], optional:['scepter'] },
      { id:'control_response', name:'Protected remnant entry', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['tranquil_boots','euls','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['glimmer_cape'] },
      { id:'recovery', name:'Low-economy displacement utility', scenarioTags:['player_behind'], priority:86, items:['tranquil_boots','spirit_vessel','force_staff','glimmer_cape'], reasons:['player_behind'], optional:['euls'] },
      { id:'objective', name:'Silence into objective control', scenarioTags:['objective_window','player_ahead'], priority:92, items:['tranquil_boots','spirit_vessel','bkb','scepter'], reasons:['objective_window','player_ahead'], optional:['lotus_orb'] }
    ],
    spikes: [
      { id:'level_6', name:'Magnetize teamfight window', priority:82, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Magnetize must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for entry and an exit spell'}], permanent:{fight:9,initiation:8,mobility:5}, window:{fight:22,connect:17}, actions:{FIGHT:23,CONNECT:18}, recommendation:'Start from fog, spread Magnetize through clustered heroes, and retain one movement option to leave.' },
      { id:'spirit_vessel', name:'Vessel roaming conversion', priority:84, trigger:[['item_owned','spirit_vessel']], expectedMinute:15, requires:[{type:'min_mana_pct',value:0.45,message:'Refill before the next rotation'}], permanent:{fight:11,objective:6,survival:4}, window:{fight:18,connect:15}, actions:{FIGHT:19,CONNECT:16}, recommendation:'Pair Vessel with silence and displacement on the sustain target your core can finish.' },
      { id:'bkb', name:'Protected Magnetize entry', priority:94, trigger:[['item_owned','bkb']], expectedMinute:23, requires:[{type:'ultimate_ready',message:'Magnetize should be ready before the protected commitment'},{type:'min_health_pct',value:0.55,message:'Do not spend BKB from a losing health state'}], permanent:{fight:18,survival:23,initiation:10}, window:{fight:26,objective:10}, actions:{FIGHT:27,OBJECTIVE:11}, recommendation:'Cross the first disable layer, connect Magnetize and silence, then exit before BKB expires.' },
      { id:'vessel_bkb', name:'Sustained anti-heal teamfight', priority:97, trigger:[['item_owned','spirit_vessel'],['item_owned','bkb']], expectedMinute:27, permanent:{fight:21,survival:17,objective:9}, window:{fight:27,objective:14}, actions:{FIGHT:28,OBJECTIVE:15}, recommendation:'Disable and Vessel the sustain core, then use the won fight to secure map control.' }
    ]
  },
  {
    id: 'earthshaker', displayName: 'Earthshaker', role: 'support', roles: ['Soft Support'],
    archetypes: ['counter_initiator','area_control','blink_support'],
    draftTags: ['counter_initiation','area_control','burst','terrain'], vulnerabilities: ['vision','spread_formation','silence'],
    identity: 'Control paths with Fissure, remain hidden while enemies cluster, and use Blink Echo Slam as a counter-initiation rather than revealing for low-value chip damage.',
    basePower: { farm:34, fight:85, push:29, survival:49, initiation:89, objective:46, mobility:43 },
    stageCurves: { early:{fight:7,initiation:8,survival:-2}, mid:{fight:25,initiation:28,mobility:18}, late:{fight:8,initiation:10,survival:-5} },
    benchmarkPoints: [[5,175,4],[10,235,7],[20,315,12],[40,400,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink before the main mid-game teamfight', defensiveItem:'BKB or Force when vision and silence prevent counter-initiation', objectiveTiming:'after Echo Slam wins the first clustered fight' },
    plans: [
      { id:'blink_echo', name:'Blink Echo counter-initiation', scenarioTags:['balanced','enemy_summons_high'], priority:94, items:['arcane_boots','blink','force_staff','refresher'], reasons:['balanced_draft','enemy_summons_high'], optional:['scepter'] },
      { id:'control_response', name:'Protected Echo access', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['arcane_boots','blink','bkb','force_staff'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Fissure utility into delayed Blink', scenarioTags:['player_behind'], priority:87, items:['arcane_boots','force_staff','blink','glimmer_cape'], reasons:['player_behind'], optional:['scepter'] },
      { id:'objective', name:'Teamfight win conversion', scenarioTags:['objective_window','player_ahead'], priority:93, items:['arcane_boots','blink','scepter','refresher'], reasons:['objective_window','player_ahead'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'Echo Slam counter-initiation', priority:78, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Echo Slam must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for the full spell sequence'}], permanent:{fight:10,initiation:8}, window:{fight:21,connect:12}, actions:{FIGHT:22,CONNECT:13}, recommendation:'Wait for commitment and clustering; do not spend Echo Slam on a target already controlled.' },
      { id:'blink', name:'Hidden Blink Echo access', priority:94, trigger:[['item_owned','blink']], expectedMinute:17, requires:[{type:'ultimate_ready',message:'Echo Slam should be ready before revealing Blink'},{type:'min_mana_pct',value:0.6,message:'Refill before the Blink sequence'}], permanent:{fight:19,initiation:28,mobility:16}, window:{fight:29,connect:18}, actions:{FIGHT:30,CONNECT:19}, recommendation:'Stay outside vision and counter-initiate only after enemy mobility or saves are committed.' },
      { id:'blink_bkb', name:'Protected Echo breakpoint', priority:98, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:25, requires:[{type:'ultimate_ready',message:'Echo Slam must be ready'}], permanent:{fight:23,survival:20,initiation:12}, window:{fight:31,objective:13}, actions:{FIGHT:32,OBJECTIVE:14}, recommendation:'Use BKB only to guarantee a decisive clustered Echo and convert the fight immediately.' },
      { id:'refresher', name:'Double teamfight control', priority:99, trigger:[['item_owned','refresher']], expectedMinute:36, requires:[{type:'ultimate_ready',message:'Primary ultimate cycle must be available'},{type:'min_mana_pct',value:0.75,message:'Double-cast sequence requires a full mana pool'}], permanent:{fight:27,initiation:15,objective:9}, window:{fight:34,objective:19}, actions:{FIGHT:35,OBJECTIVE:20}, recommendation:'Plan mana and positioning for two separate control waves rather than overlapping every spell.' }
    ]
  },
  {
    id: 'hoodwink', displayName: 'Hoodwink', role: 'support', roles: ['Soft Support'],
    archetypes: ['ranged_pickoff','wave_control','vision_support'],
    draftTags: ['ranged_control','burst','wave_clear','vision'], vulnerabilities: ['gap_close','dispel','tree_loss'],
    identity: 'Control fights from terrain edges, chain reliable setup into Bushwhack and Sharpshooter, and preserve distance instead of trading as a frontline support.',
    basePower: { farm:46, fight:68, push:48, survival:43, initiation:66, objective:44, mobility:72 },
    stageCurves: { early:{fight:9,mobility:8,push:5}, mid:{fight:16,initiation:14,mobility:10}, late:{fight:1,push:5,survival:-8} },
    benchmarkPoints: [[5,195,4],[10,260,7],[20,340,12],[40,420,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Atos or Force before repeated ranged pickoffs', defensiveItem:'Force, Glimmer, or Eul when gap close reaches the backline', objectiveTiming:'after long-range control removes a defender' },
    calibration: { calibrationConfidence:0.67, calibrationSource:'hero-specific Hoodwink review; exact tree geometry and Bushwhack anchor quality are not available in current GameState' },
    plans: [
      { id:'atos_pickoff', name:'Atos into ranged pickoff', scenarioTags:['balanced','team_lacks_control'], priority:89, items:['arcane_boots','atos','force_staff','scepter'], reasons:['balanced_draft','team_lacks_control'], optional:['octarine_core'] },
      { id:'control_response', name:'Backline survival and reset', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:96, items:['arcane_boots','euls','force_staff','glimmer_cape'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['atos'] },
      { id:'recovery', name:'Low-economy ranged utility', scenarioTags:['player_behind'], priority:84, items:['tranquil_boots','force_staff','atos','glimmer_cape'], reasons:['player_behind'], optional:['euls'] },
      { id:'objective', name:'Long-range defender removal', scenarioTags:['objective_window','player_ahead'], priority:91, items:['arcane_boots','atos','scepter','octarine_core'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Sharpshooter pickoff window', priority:76, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Sharpshooter must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep mana for setup and escape'}], permanent:{fight:8,initiation:6}, window:{fight:18,connect:14}, actions:{FIGHT:19,CONNECT:15}, recommendation:'Fire after reliable control from a safe angle; do not channel where the enemy can close distance immediately.' },
      { id:'atos', name:'Reliable Bushwhack setup', priority:85, trigger:[['item_owned','atos']], expectedMinute:16, requires:[{type:'min_mana_pct',value:0.4,message:'Preserve mana for the full control chain'}], permanent:{fight:11,initiation:17}, window:{fight:20,connect:12}, actions:{FIGHT:21,CONNECT:13}, recommendation:'Use Atos to make the control chain deterministic, then reposition before the target is released.' },
      { id:'force_staff', name:'Protected ranged positioning', priority:88, trigger:[['item_owned','force_staff']], expectedMinute:20, permanent:{survival:15,mobility:15,initiation:5}, window:{fight:15,connect:10}, actions:{FIGHT:16,CONNECT:11}, recommendation:'Maintain a second escape line and rescue the ally exposed by your pickoff attempt.' },
      { id:'atos_scepter', name:'Extended pickoff control', priority:95, trigger:[['item_owned','atos'],['item_owned','scepter']], expectedMinute:29, requires:[{type:'min_health_pct',value:0.45,message:'Do not occupy a visible firing angle from low health'}], permanent:{fight:19,initiation:18,objective:8}, window:{fight:25,objective:13}, actions:{FIGHT:26,OBJECTIVE:14}, recommendation:'Remove the defender from range, then pressure the objective while your control tools are still ready.' }
    ]
  },
  {
    id: 'mirana', displayName: 'Mirana', role: 'support', roles: ['Soft Support'],
    archetypes: ['ranged_roamer','team_invisibility_support','flex_utility'],
    draftTags: ['pickoff','team_invisibility','mobility','ranged_control'], vulnerabilities: ['unreliable_setup','detection','silence'],
    identity: 'Use allied setup to make Arrow reliable, protect rotations with Moonlight Shadow, and flex between pickoff and team utility without taking unsafe farm.',
    basePower: { farm:43, fight:64, push:39, survival:54, initiation:61, objective:50, mobility:79 },
    stageCurves: { early:{fight:8,mobility:12,initiation:7}, mid:{fight:14,mobility:13,objective:8}, late:{fight:-2,survival:-4,objective:3} },
    benchmarkPoints: [[5,190,4],[10,255,7],[20,330,12],[40,410,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Vessel or Eul after boots and lane utility', defensiveItem:'Force or Glimmer when detection and silence punish leap paths', objectiveTiming:'after Arrow or Moonlight creates a clean numbers advantage' },
    plans: [
      { id:'arrow_utility', name:'Arrow and Vessel roaming', scenarioTags:['balanced','enemy_healing_high'], priority:87, items:['arcane_boots','spirit_vessel','euls','guardian_greaves'], reasons:['balanced_draft','enemy_healing_high'], optional:['scepter'] },
      { id:'control_response', name:'Protected Moonlight utility', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:95, items:['arcane_boots','euls','glimmer_cape','force_staff'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Low-economy save and setup', scenarioTags:['player_behind'], priority:84, items:['tranquil_boots','force_staff','glimmer_cape','spirit_vessel'], reasons:['player_behind'], optional:['euls'] },
      { id:'objective', name:'Team utility conversion', scenarioTags:['objective_window','team_lacks_sustain'], priority:91, items:['arcane_boots','mekansm','guardian_greaves','scepter'], reasons:['objective_window','team_lacks_sustain'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Moonlight Shadow rotation', priority:75, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Moonlight Shadow must be ready'},{type:'min_mana_pct',value:0.4,message:'Keep mana for Arrow and Leap after the rotation'}], permanent:{mobility:7,fight:5,objective:5}, window:{connect:22,fight:13}, actions:{CONNECT:23,FIGHT:14}, recommendation:'Use Moonlight to cross vision for a coordinated move, not as a substitute for detection control.' },
      { id:'spirit_vessel', name:'Arrow plus anti-sustain', priority:83, trigger:[['item_owned','spirit_vessel']], expectedMinute:15, permanent:{fight:11,objective:6,survival:4}, window:{fight:17,connect:14}, actions:{FIGHT:18,CONNECT:15}, recommendation:'Follow reliable allied control with Arrow and apply Vessel to the target that must die first.' },
      { id:'euls', name:'Reliable control setup', priority:86, trigger:[['item_owned','euls']], expectedMinute:19, requires:[{type:'min_mana_pct',value:0.45,message:'Keep mana for the setup sequence'}], permanent:{fight:9,initiation:14,survival:9}, window:{fight:18,connect:12}, actions:{FIGHT:19,CONNECT:13}, recommendation:'Create a predictable Arrow timing or remove yourself from the first silence layer.' },
      { id:'greaves', name:'Team sustain conversion', priority:93, trigger:[['item_owned','guardian_greaves']], expectedMinute:27, requires:[{type:'min_health_pct',value:0.45,message:'Stay healthy enough to deliver the team reset'}], permanent:{fight:17,survival:18,objective:13}, window:{fight:21,objective:18}, actions:{FIGHT:22,OBJECTIVE:19}, recommendation:'Stabilize the team after the first exchange, then use Moonlight or Arrow to hold the objective area.' }
    ]
  },
  {
    id: 'nyx_assassin', displayName: 'Nyx Assassin', role: 'support', roles: ['Soft Support'],
    archetypes: ['invisible_scout','pickoff_support','counter_caster'],
    draftTags: ['invisibility','pickoff','mana_pressure','counter_spell'], vulnerabilities: ['detection','sustain','instant_disable'],
    identity: 'Scout dangerous routes under Vendetta, punish exposed spellcasters, and deliver information even when a solo kill is not available.',
    basePower: { farm:31, fight:70, push:25, survival:51, initiation:79, objective:39, mobility:76 },
    stageCurves: { early:{fight:7,initiation:8,mobility:6}, mid:{fight:19,initiation:21,mobility:14}, late:{fight:-5,survival:-7,initiation:3} },
    benchmarkPoints: [[5,175,4],[10,235,7],[20,305,12],[40,380,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Dagon, Eul, or Blink after Vendetta roaming begins', defensiveItem:'Force, Lotus, or Glimmer when detection traps the scout', objectiveTiming:'after exposing and removing a key spellcaster' },
    plans: [
      { id:'vendetta_pickoff', name:'Vendetta burst pickoff', scenarioTags:['balanced','enemy_magic_burst_high'], priority:89, items:['arcane_boots','dagon','euls','force_staff'], reasons:['balanced_draft','enemy_magic_burst_high'], optional:['scepter'] },
      { id:'control_response', name:'Protected scouting utility', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:96, items:['arcane_boots','euls','force_staff','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['glimmer_cape'] },
      { id:'recovery', name:'Low-economy information support', scenarioTags:['player_behind'], priority:85, items:['tranquil_boots','force_staff','glimmer_cape','dagon'], reasons:['player_behind'], optional:['euls'] },
      { id:'objective', name:'Scout and remove defender', scenarioTags:['objective_window','player_ahead'], priority:92, items:['arcane_boots','blink','dagon','scepter'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Vendetta scouting and pickoff', priority:79, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Vendetta must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep mana for stun and escape'}], permanent:{fight:7,initiation:11,mobility:9}, window:{connect:21,fight:16}, actions:{CONNECT:22,FIGHT:17}, recommendation:'Scout the approach first; attack only when allies can reach the disabled target.' },
      { id:'dagon', name:'Vendetta burst conversion', priority:86, trigger:[['item_owned','dagon']], expectedMinute:17, requires:[{type:'ultimate_ready',message:'Vendetta should be ready for the burst route'}], permanent:{fight:15,initiation:9}, window:{fight:20,connect:13}, actions:{FIGHT:21,CONNECT:14}, recommendation:'Burst the fragile spellcaster after control lands, then leave before detection arrives.' },
      { id:'euls', name:'Dispel and setup utility', priority:88, trigger:[['item_owned','euls']], expectedMinute:20, requires:[{type:'min_mana_pct',value:0.45,message:'Preserve mana for the follow-up stun'}], permanent:{survival:13,initiation:13,fight:8}, window:{fight:17,connect:12}, actions:{FIGHT:18,CONNECT:13}, recommendation:'Use Eul to create a reliable stun timing or survive the first detection response.' },
      { id:'blink_dagon', name:'Instant backline punishment', priority:95, trigger:[['item_owned','blink'],['item_owned','dagon']], expectedMinute:28, requires:[{type:'min_health_pct',value:0.45,message:'Do not enter detection range from low health'}], permanent:{fight:19,initiation:22,mobility:13}, window:{fight:25,objective:10}, actions:{FIGHT:26,OBJECTIVE:11}, recommendation:'Remove the exposed caster instantly and provide vision for the team to take the nearby objective.' }
    ]
  },
  {
    id: 'pudge', displayName: 'Pudge', role: 'support', roles: ['Soft Support','Offlane'],
    archetypes: ['pickoff_initiator','save_support','frontline_disruptor'],
    draftTags: ['pickoff','save','displacement','frontline'], vulnerabilities: ['missed_setup','percentage_damage','silence'],
    identity: 'Threaten hooks from fog, use Dismember on a target allies can reach, and treat save positioning as equally valuable as aggressive displacement.',
    basePower: { farm:39, fight:73, push:27, survival:79, initiation:77, objective:40, mobility:34 },
    stageCurves: { early:{fight:9,survival:10,initiation:7}, mid:{fight:17,initiation:17,survival:12}, late:{fight:3,survival:3,initiation:2} },
    benchmarkPoints: [[5,185,4],[10,250,7],[20,325,12],[40,405,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens or Blink after lane utility', defensiveItem:'BKB, Lotus, or Force when channeling is interrupted', objectiveTiming:'after Hook or Dismember removes a defender' },
    plans: [
      { id:'hook_dismember', name:'Hook and Dismember access', scenarioTags:['balanced','team_lacks_initiation'], priority:90, items:['tranquil_boots','aether_lens','blink','bkb'], reasons:['balanced_draft','team_lacks_initiation'], optional:['scepter'] },
      { id:'control_response', name:'Protected channel and save', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['tranquil_boots','aether_lens','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['force_staff'] },
      { id:'recovery', name:'Low-economy save positioning', scenarioTags:['player_behind'], priority:86, items:['tranquil_boots','force_staff','aether_lens','glimmer_cape'], reasons:['player_behind'], optional:['lotus_orb'] },
      { id:'objective', name:'Pickoff into frontline control', scenarioTags:['objective_window','player_ahead'], priority:92, items:['tranquil_boots','blink','bkb','scepter'], reasons:['objective_window','player_ahead'], optional:['aether_lens'] }
    ],
    spikes: [
      { id:'level_6', name:'Dismember lockdown window', priority:78, trigger:[['level_gte',6]], expectedMinute:8, requires:[{type:'ultimate_ready',message:'Dismember must be ready'},{type:'min_health_pct',value:0.55,message:'Keep enough health to survive the channel position'}], permanent:{fight:8,initiation:8,survival:4}, window:{fight:19,connect:13}, actions:{FIGHT:20,CONNECT:14}, recommendation:'Channel on the target your allies can damage immediately, or hold the spell to save a core from a diver.' },
      { id:'aether_lens', name:'Safe Hook and save range', priority:83, trigger:[['item_owned','aether_lens']], expectedMinute:15, permanent:{initiation:12,survival:8,mobility:3}, window:{connect:16,fight:13}, actions:{CONNECT:17,FIGHT:14}, recommendation:'Use the extra range to threaten from fog and avoid walking into the same control zone as your target.' },
      { id:'blink', name:'Instant Dismember access', priority:90, trigger:[['item_owned','blink']], expectedMinute:20, requires:[{type:'ultimate_ready',message:'Dismember should be ready before revealing Blink'},{type:'min_health_pct',value:0.6,message:'Enter with enough health to hold the target'}], permanent:{initiation:22,mobility:15,fight:11}, window:{fight:23,connect:17}, actions:{FIGHT:24,CONNECT:18}, recommendation:'Blink only when the target cannot interrupt the channel before allied damage arrives.' },
      { id:'blink_bkb', name:'Protected channel breakpoint', priority:97, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:27, requires:[{type:'ultimate_ready',message:'Dismember must be ready'}], permanent:{fight:20,survival:23,initiation:11}, window:{fight:28,objective:12}, actions:{FIGHT:29,OBJECTIVE:13}, recommendation:'Guarantee the key disable, then stand between the enemy and the objective as the frontline.' }
    ]
  },
  {
    id: 'spirit_breaker', displayName: 'Spirit Breaker', role: 'support', roles: ['Soft Support','Offlane'],
    archetypes: ['global_roamer','frontline_initiator','chaos_support'],
    draftTags: ['global_mobility','initiation','vision','frontline'], vulnerabilities: ['dispel','kite','false_commitment'],
    identity: 'Convert global information into coordinated Charges, reveal movement for the team, and cancel bad commitments instead of completing every long-distance initiation.',
    basePower: { farm:40, fight:75, push:34, survival:74, initiation:86, objective:49, mobility:95 },
    stageCurves: { early:{fight:10,mobility:20,initiation:12}, mid:{fight:18,initiation:20,survival:9}, late:{fight:2,mobility:7,survival:-3} },
    benchmarkPoints: [[5,190,4],[10,255,7],[20,335,12],[40,420,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Shadow Blade or BKB after early Charge pressure', defensiveItem:'BKB or Lotus when control stops the first contact', objectiveTiming:'after a global Charge creates a numbers advantage' },
    plans: [
      { id:'global_charge', name:'Global Charge tempo', scenarioTags:['balanced','split_push_required'], priority:91, items:['phase_boots','drums','shadow_blade','bkb'], reasons:['balanced_draft','split_push_required'], optional:['scepter'] },
      { id:'control_response', name:'Protected global initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['phase_boots','shadow_blade','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['blade_mail'] },
      { id:'recovery', name:'Durable low-economy charge', scenarioTags:['player_behind'], priority:86, items:['phase_boots','drums','blade_mail','shadow_blade'], reasons:['player_behind'], optional:['bkb'] },
      { id:'objective', name:'Global pickoff conversion', scenarioTags:['objective_window','player_ahead'], priority:93, items:['phase_boots','shadow_blade','bkb','scepter'], reasons:['objective_window','player_ahead'], optional:['lotus_orb'] }
    ],
    spikes: [
      { id:'level_6', name:'Nether Strike global threat', priority:78, trigger:[['level_gte',6]], expectedMinute:8, requires:[{type:'ultimate_ready',message:'Nether Strike must be ready'},{type:'min_health_pct',value:0.6,message:'Keep enough health to finish first contact'}], permanent:{fight:8,initiation:10,mobility:6}, window:{connect:22,fight:17}, actions:{CONNECT:23,FIGHT:18}, recommendation:'Charge only when allies can converge or the target is truly isolated; cancel when the map state changes.' },
      { id:'shadow_blade', name:'Hidden Charge approach', priority:88, trigger:[['item_owned','shadow_blade']], expectedMinute:18, requires:[{type:'min_health_pct',value:0.6,message:'Enter with enough health to remain frontline'}], permanent:{mobility:17,initiation:18,fight:9}, window:{connect:22,fight:20}, actions:{CONNECT:23,FIGHT:21}, recommendation:'Use invisibility to protect the approach and reveal the target path to teammates.' },
      { id:'bkb', name:'Protected first contact', priority:94, trigger:[['item_owned','bkb']], expectedMinute:24, requires:[{type:'min_health_pct',value:0.65,message:'Reset before the protected global commitment'}], permanent:{fight:18,survival:24,initiation:9}, window:{fight:25,objective:11}, actions:{FIGHT:26,OBJECTIVE:12}, recommendation:'Cross the control layer, displace the priority target, and avoid chasing beyond allied reach.' },
      { id:'shadow_bkb', name:'Reliable global conversion', priority:98, trigger:[['item_owned','shadow_blade'],['item_owned','bkb']], expectedMinute:28, requires:[{type:'ultimate_ready',message:'Nether Strike should be ready for the full pickoff cycle'}], permanent:{fight:21,survival:18,mobility:13,initiation:13}, window:{fight:29,objective:16}, actions:{FIGHT:30,OBJECTIVE:17}, recommendation:'Create the numbers advantage from across the map and immediately convert it into vision or an objective.' }
    ]
  },
  {
    id: 'tusk', displayName: 'Tusk', role: 'support', roles: ['Soft Support','Offlane'],
    archetypes: ['save_initiator','melee_roamer','single_target_burst'],
    draftTags: ['save','initiation','burst','terrain'], vulnerabilities: ['silence','dispel','extended_fight'],
    identity: 'Use Snowball as both initiation and save, isolate a priority target with terrain, and preserve allied positioning before committing Walrus Punch.',
    basePower: { farm:36, fight:77, push:30, survival:66, initiation:87, objective:43, mobility:74 },
    stageCurves: { early:{fight:14,initiation:13,mobility:9}, mid:{fight:17,initiation:20,survival:7}, late:{fight:-3,survival:-4,initiation:4} },
    benchmarkPoints: [[5,185,4],[10,245,7],[20,315,12],[40,390,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Solar Crest or Blink after early roaming', defensiveItem:'BKB, Lotus, or Force when Snowball cannot protect the entry', objectiveTiming:'after saving a core or bursting the enemy defender' },
    plans: [
      { id:'save_initiation', name:'Snowball save and Blink access', scenarioTags:['balanced','team_lacks_initiation'], priority:91, items:['phase_boots','solar_crest','blink','bkb'], reasons:['balanced_draft','team_lacks_initiation'], optional:['scepter'] },
      { id:'control_response', name:'Protected Blink initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['phase_boots','blink','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['force_staff'] },
      { id:'recovery', name:'Low-economy save utility', scenarioTags:['player_behind'], priority:86, items:['tranquil_boots','solar_crest','force_staff','glimmer_cape'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Burst defender and protect carry', scenarioTags:['objective_window','player_ahead'], priority:93, items:['phase_boots','blink','solar_crest','scepter'], reasons:['objective_window','player_ahead'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'Walrus Punch pickoff window', priority:77, trigger:[['level_gte',6]], expectedMinute:8, requires:[{type:'ultimate_ready',message:'Walrus Punch must be ready'},{type:'min_health_pct',value:0.55,message:'Keep enough health for close-range commitment'}], permanent:{fight:8,initiation:7}, window:{fight:19,connect:14}, actions:{FIGHT:20,CONNECT:15}, recommendation:'Burst the target allies can follow, while keeping Snowball available when a core needs protection.' },
      { id:'solar_crest', name:'Save and ally acceleration', priority:83, trigger:[['item_owned','solar_crest']], expectedMinute:15, permanent:{fight:10,survival:12,objective:10}, window:{fight:16,objective:14}, actions:{FIGHT:17,OBJECTIVE:15}, recommendation:'Use Crest on the ally taking first contact or hitting the objective, not only on yourself before a dive.' },
      { id:'blink', name:'Instant Snowball or Punch access', priority:91, trigger:[['item_owned','blink']], expectedMinute:19, requires:[{type:'min_health_pct',value:0.55,message:'Do not Blink into a fight you cannot survive'}], permanent:{initiation:23,mobility:15,fight:10}, window:{fight:23,connect:17}, actions:{FIGHT:24,CONNECT:18}, recommendation:'Blink from fog to save an ally or isolate a defender before the enemy formation reacts.' },
      { id:'blink_bkb', name:'Protected save-initiation breakpoint', priority:97, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:27, requires:[{type:'ultimate_ready',message:'Walrus Punch should be ready for the protected commitment'}], permanent:{fight:20,survival:22,initiation:12}, window:{fight:27,objective:14}, actions:{FIGHT:28,OBJECTIVE:15}, recommendation:'Guarantee the first control sequence, then return to protecting the core during the objective fight.' }
    ]
  }
];

export const HERO_IDS = Object.freeze(DEFINITIONS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createExplicitProfilePack(DEFINITIONS, dependencies, CALIBRATION); }
