import { createExplicitProfilePack } from './explicit-profile-pack.mjs';

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-frontline-v2',
  calibrationSource: 'hero-specific frontline strategic review; live recordings pending',
  calibrationConfidence: 0.72,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const DEFINITIONS = [
  {
    id: 'axe', displayName: 'Axe', roles: ['Offlane'],
    archetypes: ['counter_initiator','frontliner','execution_core'],
    draftTags: ['initiation','counter_initiation','anti_melee','frontline'],
    vulnerabilities: ['kite','magic_burst','break'],
    identity: "Absorb first contact, punish clustered attacks with Berserker's Call, and convert low-health targets through repeated short-cooldown initiations.",
    basePower: { farm:46, fight:78, push:35, survival:79, initiation:88, objective:48, mobility:36 },
    stageCurves: { early:{fight:8,survival:10,farm:-4}, mid:{fight:18,initiation:22,survival:12,objective:7}, late:{fight:5,initiation:9,survival:-4,push:-5} },
    benchmarkPoints: [[5,305,5],[10,390,8],[20,500,14],[40,590,23]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink after lane durability', defensiveItem:'BKB or Lotus when Call follow-up is interrupted', objectiveTiming:'after Call creates a numbers advantage' },
    plans: [
      { id:'call_blade_mail', name:'Call plus Blade Mail punish', scenarioTags:['balanced','enemy_physical_dps_high'], priority:88, items:['vanguard','blink','blade_mail','bkb'], reasons:['balanced_draft','enemy_physical_dps_high'], optional:['lotus_orb'] },
      { id:'control_response', name:'Protected Call initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:96, items:['vanguard','blink','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['blade_mail'] },
      { id:'recovery', name:'Durable recovery into Blink', scenarioTags:['player_behind'], priority:82, items:['vanguard','blade_mail','blink','bkb'], reasons:['player_behind'], optional:['pipe'] },
      { id:'objective', name:'Frontline aura conversion', scenarioTags:['player_ahead','objective_window'], priority:91, items:['vanguard','blink','pipe','shivas_guard'], reasons:['player_ahead','objective_window'], optional:['blade_mail'] }
    ],
    spikes: [
      { id:'level_6', name:'Culling Blade execution window', priority:70, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Culling Blade must be ready'},{type:'min_health_pct',value:0.45,message:'Recover before taking first contact'}], permanent:{fight:7,survival:4}, window:{fight:14,connect:8}, actions:{FIGHT:15,CONNECT:9}, recommendation:'Join a skirmish where Call exposes an execution target, then pressure the nearby lane.' },
      { id:'blink', name:'Blink Call initiation', priority:88, trigger:[['item_owned','blink']], expectedMinute:14, requires:[{type:'min_health_pct',value:0.55,message:'Do not reveal Blink while too low to tank retaliation'}], permanent:{initiation:27,mobility:15,fight:10}, window:{fight:21,connect:19}, actions:{FIGHT:22,CONNECT:20}, recommendation:'Leave vision and start with Call before the enemy formation spreads.' },
      { id:'blade_mail_blink', name:'Blink plus Blade Mail punish', priority:94, trigger:[['item_owned','blink'],['item_owned','blade_mail']], expectedMinute:18, permanent:{fight:18,survival:13,initiation:7}, window:{fight:24,objective:10}, actions:{FIGHT:25,OBJECTIVE:11}, recommendation:'Force the enemy carry to damage into Call and convert the kill into an objective.' },
      { id:'bkb', name:'BKB Call permission', priority:98, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:24, requires:[{type:'min_health_pct',value:0.6,message:'Reset before the protected initiation'}], permanent:{fight:18,survival:23,initiation:9}, window:{fight:26,objective:15}, actions:{FIGHT:27,OBJECTIVE:16}, recommendation:'Guarantee Call through the first control layer and take the major objective afterward.' }
    ]
  },
  {
    id: 'batrider', displayName: 'Batrider', roles: ['Offlane','Mid'],
    archetypes: ['pickoff_initiator','vision_breaker','tempo_core'],
    draftTags: ['pickoff','mobility','forced_movement','vision'], vulnerabilities: ['dispel','save','burst'],
    identity: 'Create asymmetric fights by crossing vision, isolating one target with Flaming Lasso, and dragging it away from saves.',
    basePower: { farm:58, fight:73, push:39, survival:52, initiation:91, objective:43, mobility:80 },
    stageCurves: { early:{fight:9,mobility:7,farm:3}, mid:{fight:17,initiation:24,mobility:16,objective:5}, late:{fight:-3,initiation:8,survival:-7,push:-4} },
    benchmarkPoints: [[5,320,5],[10,430,8],[20,560,15],[40,635,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Travel or Blink before repeated pickoff cycles', defensiveItem:'BKB before crossing layered control', objectiveTiming:'after Lasso removes a save hero or core' },
    plans: [
      { id:'travel_pickoff', name:'Travel-based Lasso tempo', scenarioTags:['balanced','split_push_required'], priority:86, items:['travel_boots','blink','bkb','force_staff'], reasons:['balanced_draft','split_push_required'], optional:['octarine_core'] },
      { id:'control_response', name:'Protected Lasso extraction', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['travel_boots','blink','bkb','force_staff'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'] },
      { id:'recovery', name:'Low-risk wave and pickoff recovery', scenarioTags:['player_behind'], priority:80, items:['travel_boots','euls','blink','bkb'], reasons:['player_behind'], optional:['force_staff'] },
      { id:'objective', name:'Pickoff into map conversion', scenarioTags:['player_ahead','objective_window'], priority:90, items:['travel_boots','blink','bkb','octarine_core'], reasons:['player_ahead','objective_window'], optional:['refresher'] }
    ],
    spikes: [
      { id:'level_6', name:'Flaming Lasso isolation', priority:78, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Flaming Lasso must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep mana for the full extraction'}], permanent:{fight:7,initiation:9}, window:{fight:19,connect:15}, actions:{FIGHT:20,CONNECT:16}, recommendation:'Attack from fog and drag the least-protected core or save hero away from reinforcement paths.' },
      { id:'travel_boots', name:'Global Firefly tempo', priority:80, trigger:[['item_owned','travel_boots']], expectedMinute:12, requires:[{type:'min_mana_pct',value:0.5,message:'Refill before using the global movement window'}], permanent:{farm:11,mobility:19,push:8}, window:{pressure:15,connect:16}, actions:{PRESSURE:15,CONNECT:17,FARM:8}, recommendation:'Clear a distant wave, disappear, and arrive to the next Lasso angle before the opponent tracks you.' },
      { id:'blink', name:'Blink Lasso access', priority:91, trigger:[['item_owned','blink']], expectedMinute:16, requires:[{type:'ultimate_ready',message:'Lasso must be ready before revealing Blink'},{type:'min_mana_pct',value:0.55,message:'Preserve mana for Firefly and extraction'}], permanent:{initiation:25,mobility:14,fight:9}, window:{fight:23,connect:21}, actions:{FIGHT:24,CONNECT:22}, recommendation:'Use Blink only when the drag path separates the target from saves.' },
      { id:'blink_bkb', name:'Protected Lasso breakpoint', priority:99, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:23, requires:[{type:'ultimate_ready',message:'Lasso must be ready for the protected commitment'}], permanent:{fight:18,survival:20,initiation:12}, window:{fight:27,objective:14}, actions:{FIGHT:28,OBJECTIVE:15}, recommendation:'Cross the first control layer with BKB, remove the key target, and immediately take map control.' }
    ]
  },
  {
    id: 'centaur_warrunner', displayName: 'Centaur Warrunner', roles: ['Offlane'],
    archetypes: ['frontliner','global_initiator','aura_carrier'],
    draftTags: ['frontline','global_mobility','initiation','aura'], vulnerabilities: ['percentage_damage','break','kite'],
    identity: 'Stand in the dangerous lane, unlock global engagement with Stampede, and turn Blink Stomp into clean team access instead of isolated dives.',
    basePower: { farm:51, fight:72, push:42, survival:88, initiation:82, objective:55, mobility:58 },
    stageCurves: { early:{survival:14,fight:6,farm:-2}, mid:{fight:15,initiation:19,survival:14,objective:9}, late:{survival:7,fight:5,initiation:5,objective:5} },
    benchmarkPoints: [[5,300,5],[10,385,8],[20,500,14],[40,585,23]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink after lane durability', defensiveItem:'Pipe, Crimson, or Lotus by enemy damage', objectiveTiming:'after Stampede or Stomp secures the first kill' },
    plans: [
      { id:'blink_frontline', name:'Blink Stomp frontline', scenarioTags:['balanced','team_lacks_initiation'], priority:88, items:['phase_boots','vanguard','blink','pipe'], reasons:['balanced_draft','team_lacks_initiation'], optional:['crimson_guard'] },
      { id:'control_response', name:'Protected global initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:95, items:['phase_boots','vanguard','blink','pipe'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Aura-first recovery', scenarioTags:['player_behind'], priority:84, items:['phase_boots','vanguard','pipe','blink'], reasons:['player_behind'], optional:['crimson_guard'] },
      { id:'objective', name:'Stampede objective conversion', scenarioTags:['player_ahead','objective_window'], priority:91, items:['phase_boots','blink','pipe','shivas_guard'], reasons:['player_ahead','objective_window'], optional:['crimson_guard'] }
    ],
    spikes: [
      { id:'level_6', name:'Stampede global response', priority:74, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Stampede must be ready'},{type:'min_health_pct',value:0.5,message:'Keep enough health to lead the arrival'}], permanent:{mobility:8,fight:5}, window:{connect:22,fight:13}, actions:{CONNECT:23,FIGHT:14}, recommendation:'Turn a nearby fight or save an ally, then occupy the dangerous lane while enemies recover.' },
      { id:'vanguard', name:'Lane durability breakpoint', priority:72, trigger:[['item_owned','vanguard']], expectedMinute:9, permanent:{survival:18,farm:5}, window:{pressure:12,farm:7}, actions:{PRESSURE:13,FARM:7}, recommendation:'Absorb attention in the contested lane and preserve allied map access.' },
      { id:'blink', name:'Blink Hoof Stomp access', priority:90, trigger:[['item_owned','blink']], expectedMinute:15, requires:[{type:'min_health_pct',value:0.6,message:'Lead with enough health to remain frontline'}], permanent:{initiation:25,mobility:13,fight:10}, window:{fight:22,connect:18}, actions:{FIGHT:23,CONNECT:19}, recommendation:'Blink Stomp where allies can immediately follow and save Stampede for pursuit or disengage.' },
      { id:'blink_pipe', name:'Blink plus team durability', priority:96, trigger:[['item_owned','blink'],['item_owned','pipe']], expectedMinute:23, permanent:{fight:16,survival:20,initiation:7,objective:8}, window:{fight:23,objective:17}, actions:{FIGHT:24,OBJECTIVE:18}, recommendation:'Start the fight, protect the team from return burst, and hold the objective area.' }
    ]
  },
  {
    id: 'legion_commander', displayName: 'Legion Commander', roles: ['Offlane','Carry'],
    archetypes: ['single_target_initiator','dispel_core','snowball_duelist'],
    draftTags: ['pickoff','dispel','single_target_control','snowball'], vulnerabilities: ['save','linkens','illusion_bait'],
    identity: 'Use Press the Attack to remove a key disable, select a Duel target allies can burst, and convert every pickoff into vision or objective control.',
    basePower: { farm:57, fight:76, push:50, survival:67, initiation:85, objective:56, mobility:44 },
    stageCurves: { early:{fight:6,survival:7,farm:2}, mid:{fight:19,initiation:23,objective:9,survival:8}, late:{fight:11,initiation:8,push:5,survival:1} },
    benchmarkPoints: [[5,310,5],[10,405,8],[20,535,15],[40,640,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blade Mail and Blink before Duel hunting', defensiveItem:'BKB when Duel access is stopped by control', objectiveTiming:'after a confirmed Duel kill' },
    plans: [
      { id:'duel_burst', name:'Blade Mail Duel burst', scenarioTags:['balanced','enemy_physical_dps_high'], priority:90, items:['phase_boots','blade_mail','blink','bkb'], reasons:['balanced_draft','enemy_physical_dps_high'], optional:['assault_cuirass'] },
      { id:'control_response', name:'Protected Duel entry', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['phase_boots','blink','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['blade_mail'] },
      { id:'recovery', name:'Safe Duel recovery', scenarioTags:['player_behind'], priority:82, items:['phase_boots','blade_mail','blink','bkb'], reasons:['player_behind'], optional:['heavens_halberd'] },
      { id:'objective', name:'Duel lead conversion', scenarioTags:['player_ahead','objective_window'], priority:93, items:['phase_boots','blink','bkb','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['blade_mail'] }
    ],
    spikes: [
      { id:'level_6', name:'First Duel threat', priority:76, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Duel must be ready'},{type:'min_health_pct',value:0.55,message:'Do not Duel from a losing health state'}], permanent:{fight:7,initiation:8}, window:{fight:18,connect:12}, actions:{FIGHT:19,CONNECT:13}, recommendation:'Choose a target allies can reach immediately instead of chasing an isolated low-probability Duel.' },
      { id:'blade_mail', name:'Blade Mail Duel punish', priority:86, trigger:[['item_owned','blade_mail']], expectedMinute:11, requires:[{type:'ultimate_ready',message:'Duel must be ready to convert Blade Mail'}], permanent:{fight:15,survival:8}, window:{fight:21,connect:11}, actions:{FIGHT:22,CONNECT:12}, recommendation:'Punish a high-damage target only when allied burst can finish before saves arrive.' },
      { id:'blink', name:'Blink Duel access', priority:92, trigger:[['item_owned','blink']], expectedMinute:16, requires:[{type:'ultimate_ready',message:'Duel should be ready before revealing Blink'},{type:'min_health_pct',value:0.6,message:'Enter with enough health to survive the Duel'}], permanent:{initiation:26,mobility:14,fight:9}, window:{fight:24,connect:20}, actions:{FIGHT:25,CONNECT:21}, recommendation:'Hide the Blink timing, smoke with burst allies, and Duel the target with the least save coverage.' },
      { id:'blink_bkb', name:'Protected Duel breakpoint', priority:99, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:23, requires:[{type:'ultimate_ready',message:'Duel must be ready for the protected entry'}], permanent:{fight:18,survival:22,initiation:10}, window:{fight:27,objective:14}, actions:{FIGHT:28,OBJECTIVE:15}, recommendation:'Cross the defensive layer with BKB, secure the Duel, and take the nearby tower or Roshan.' }
    ]
  },
  {
    id: 'magnus', displayName: 'Magnus', roles: ['Offlane','Mid'],
    archetypes: ['teamfight_initiator','empower_core','repositioner'],
    draftTags: ['teamfight','reposition','melee_amp','wave_clear'], vulnerabilities: ['vision','save','cooldown_dependency'],
    identity: 'Accelerate allied physical cores with Empower, threaten hidden Skewer angles, and reserve Reverse Polarity for decisive follow-up.',
    basePower: { farm:64, fight:78, push:51, survival:63, initiation:94, objective:58, mobility:55 },
    stageCurves: { early:{farm:8,fight:3,push:4}, mid:{fight:18,initiation:26,farm:8,objective:9}, late:{fight:14,initiation:15,objective:8,survival:2} },
    benchmarkPoints: [[5,315,5],[10,420,8],[20,560,15],[40,655,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink before the first major five-on-five', defensiveItem:'BKB when RP cannot complete through control', objectiveTiming:'after RP or Skewer removes the main defender' },
    plans: [
      { id:'blink_rp', name:'Blink RP initiation', scenarioTags:['balanced','team_lacks_initiation'], priority:92, items:['phase_boots','blink','bkb','refresher'], reasons:['balanced_draft','team_lacks_initiation'], optional:['force_staff'] },
      { id:'control_response', name:'Protected RP execution', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['phase_boots','blink','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['force_staff'] },
      { id:'recovery', name:'Empower recovery into Blink', scenarioTags:['player_behind'], priority:83, items:['phase_boots','echo_sabre','blink','bkb'], reasons:['player_behind'], optional:['force_staff'] },
      { id:'objective', name:'Double-RP objective control', scenarioTags:['player_ahead','objective_window'], priority:95, items:['phase_boots','blink','bkb','refresher'], reasons:['player_ahead','objective_window'], optional:['scepter'] }
    ],
    spikes: [
      { id:'level_6', name:'Reverse Polarity teamfight threat', priority:80, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Reverse Polarity must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep mana for RP and repositioning'}], permanent:{fight:8,initiation:10}, window:{fight:20,connect:14}, actions:{FIGHT:21,CONNECT:15}, recommendation:'Fight only where allied damage reaches the RP area; otherwise build the next timing with Empower.' },
      { id:'blink', name:'Hidden Blink RP access', priority:94, trigger:[['item_owned','blink']], expectedMinute:14, requires:[{type:'ultimate_ready',message:'RP should be ready before revealing Blink'},{type:'min_mana_pct',value:0.55,message:'Preserve mana for follow-up spells'}], permanent:{initiation:30,mobility:16,fight:11}, window:{fight:26,connect:21}, actions:{FIGHT:27,CONNECT:22}, recommendation:'Disappear from lanes and RP only when the follow-up core is in range.' },
      { id:'blink_bkb', name:'Protected RP channel', priority:98, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:22, requires:[{type:'ultimate_ready',message:'RP must be ready for the protected initiation'}], permanent:{fight:19,survival:21,initiation:10}, window:{fight:28,objective:14}, actions:{FIGHT:29,OBJECTIVE:15}, recommendation:'Use BKB before the interrupt lands, group multiple targets, and convert the won fight.' },
      { id:'refresher', name:'Refresher double-RP control', priority:100, trigger:[['item_owned','blink'],['item_owned','refresher']], expectedMinute:34, requires:[{type:'ultimate_ready',message:'RP must be ready before committing Refresher'},{type:'min_mana_pct',value:0.75,message:'Double-RP requires a high mana reserve'}], permanent:{fight:25,initiation:18,objective:11}, window:{fight:31,objective:20}, actions:{FIGHT:32,OBJECTIVE:21}, recommendation:'Use the first RP to force defensive resources and the second to secure the decisive target or area.' }
    ]
  },
  {
    id: 'mars', displayName: 'Mars', roles: ['Offlane'],
    archetypes: ['arena_controller','frontliner','burst_initiator'],
    draftTags: ['teamfight','terrain_control','frontline','burst'], vulnerabilities: ['save','dispel','magic_burst'],
    identity: 'Control a defined fight area with Arena of Blood, pin a priority target against terrain, and protect allies from frontal physical damage.',
    basePower: { farm:50, fight:79, push:44, survival:80, initiation:87, objective:54, mobility:39 },
    stageCurves: { early:{fight:9,survival:9,farm:-2}, mid:{fight:20,initiation:22,survival:10,objective:8}, late:{fight:7,initiation:8,survival:2,objective:4} },
    benchmarkPoints: [[5,305,5],[10,395,8],[20,510,14],[40,600,23]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink before the first decisive Arena fight', defensiveItem:'BKB or Pipe against magic response', objectiveTiming:'after Arena traps the defender or save hero' },
    plans: [
      { id:'arena_blink', name:'Blink Arena control', scenarioTags:['balanced','team_lacks_initiation'], priority:91, items:['phase_boots','blink','bkb','shivas_guard'], reasons:['balanced_draft','team_lacks_initiation'], optional:['pipe'] },
      { id:'control_response', name:'Protected Arena entry', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['phase_boots','blink','bkb','pipe'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Frontline recovery before Blink', scenarioTags:['player_behind'], priority:83, items:['phase_boots','vanguard','pipe','blink'], reasons:['player_behind'], optional:['crimson_guard'] },
      { id:'objective', name:'Arena zone conversion', scenarioTags:['player_ahead','objective_window'], priority:93, items:['phase_boots','blink','bkb','refresher'], reasons:['player_ahead','objective_window'], optional:['shivas_guard'] }
    ],
    spikes: [
      { id:'level_6', name:'Arena of Blood control window', priority:78, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Arena of Blood must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep mana for Arena and Spear'}], permanent:{fight:8,initiation:8}, window:{fight:20,connect:12}, actions:{FIGHT:21,CONNECT:13}, recommendation:'Use Arena where Spear can pin a priority target and allies can enter immediately.' },
      { id:'blink', name:'Blink Arena access', priority:92, trigger:[['item_owned','blink']], expectedMinute:14, requires:[{type:'ultimate_ready',message:'Arena should be ready before revealing Blink'},{type:'min_health_pct',value:0.55,message:'Enter with enough health to hold the arena edge'}], permanent:{initiation:27,mobility:14,fight:10}, window:{fight:25,connect:19}, actions:{FIGHT:26,CONNECT:20}, recommendation:'Start from fog and trap both the target and its escape path.' },
      { id:'blink_bkb', name:'Protected Arena breakpoint', priority:98, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:22, requires:[{type:'ultimate_ready',message:'Arena must be ready for the protected entry'}], permanent:{fight:19,survival:22,initiation:9}, window:{fight:27,objective:15}, actions:{FIGHT:28,OBJECTIVE:16}, recommendation:'Secure the Arena and Spear sequence through the first control layer, then take the objective.' },
      { id:'refresher', name:'Double-Arena objective control', priority:100, trigger:[['item_owned','blink'],['item_owned','refresher']], expectedMinute:35, requires:[{type:'ultimate_ready',message:'Arena must be ready before Refresher'},{type:'min_mana_pct',value:0.75,message:'Double-Arena requires a high mana reserve'}], permanent:{fight:24,initiation:15,objective:13}, window:{fight:30,objective:23}, actions:{FIGHT:31,OBJECTIVE:24}, recommendation:'Use consecutive arenas to deny objective access and split the enemy formation.' }
    ]
  },
  {
    id: 'sand_king', displayName: 'Sand King', roles: ['Offlane'],
    archetypes: ['blink_initiator','area_control','wave_clearer'],
    draftTags: ['aoe_control','initiation','wave_clear','teamfight'], vulnerabilities: ['detection','silence','burst'],
    identity: 'Hide initiation information, control chokepoints with Burrowstrike and Sand Storm, and layer Epicenter after the enemy formation commits.',
    basePower: { farm:61, fight:77, push:48, survival:57, initiation:92, objective:49, mobility:62 },
    stageCurves: { early:{farm:7,fight:4,survival:1}, mid:{fight:21,initiation:25,farm:7,objective:7}, late:{fight:8,initiation:10,survival:-3,push:2} },
    benchmarkPoints: [[5,310,5],[10,410,8],[20,540,15],[40,630,24]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink after reliable wave income', defensiveItem:"BKB or Eul's when channel and exit are interrupted", objectiveTiming:'after Epicenter or Burrowstrike wins the area' },
    plans: [
      { id:'blink_epicenter', name:'Blink Epicenter initiation', scenarioTags:['balanced','team_lacks_initiation'], priority:92, items:['phase_boots','blink','euls','bkb'], reasons:['balanced_draft','team_lacks_initiation'], optional:['shivas_guard'] },
      { id:'control_response', name:'Protected Burrowstrike entry', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['phase_boots','blink','bkb','euls'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'recovery', name:'Wave-clear recovery into Blink', scenarioTags:['player_behind'], priority:82, items:['phase_boots','euls','blink','bkb'], reasons:['player_behind'], optional:['force_staff'] },
      { id:'objective', name:'Area-control objective cycle', scenarioTags:['player_ahead','objective_window'], priority:92, items:['phase_boots','blink','bkb','shivas_guard'], reasons:['player_ahead','objective_window'], optional:['octarine_core'] }
    ],
    spikes: [
      { id:'level_6', name:'Epicenter area threat', priority:77, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Epicenter must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for Epicenter and Burrowstrike'}], permanent:{fight:8,initiation:7}, window:{fight:19,connect:12}, actions:{FIGHT:20,CONNECT:13}, recommendation:'Use Epicenter after the enemy commits into a narrow area; otherwise farm the Blink timing.' },
      { id:'blink', name:'Blink Burrowstrike access', priority:93, trigger:[['item_owned','blink']], expectedMinute:14, requires:[{type:'min_mana_pct',value:0.55,message:'Preserve mana for the full initiation and escape'}], permanent:{initiation:29,mobility:16,fight:10}, window:{fight:25,connect:20}, actions:{FIGHT:26,CONNECT:21}, recommendation:'Stun through multiple heroes and place Sand Storm where the return path is dangerous.' },
      { id:'blink_bkb', name:'Protected Epicenter delivery', priority:98, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:22, requires:[{type:'ultimate_ready',message:'Epicenter must be ready for the protected commitment'},{type:'min_mana_pct',value:0.6,message:'Keep mana for the complete spell sequence'}], permanent:{fight:20,survival:20,initiation:9}, window:{fight:28,objective:14}, actions:{FIGHT:29,OBJECTIVE:15}, recommendation:'Deliver Epicenter through control and hold the objective choke with repeated Burrowstrikes.' },
      { id:'shivas', name:'Shiva area lock', priority:95, trigger:[['item_owned','blink'],['item_owned','shivas_guard']], expectedMinute:29, permanent:{fight:17,survival:14,objective:11}, window:{fight:23,objective:20}, actions:{FIGHT:24,OBJECTIVE:21}, recommendation:"Stack Shiva's slow with Sand Storm and Burrowstrike around the objective." }
    ]
  },
  {
    id: 'slardar', displayName: 'Slardar', roles: ['Offlane','Carry'],
    archetypes: ['melee_initiator','armor_reducer','roshan_enabler'],
    draftTags: ['physical_amp','pickoff','roshan','initiation'], vulnerabilities: ['kite','illusion_bait','magic_burst'],
    identity: 'Use movement and vision advantage to apply Corrosive Haze, close with Blink Crush, and amplify allied physical damage on heroes and Roshan.',
    basePower: { farm:49, fight:81, push:43, survival:72, initiation:86, objective:78, mobility:67 },
    stageCurves: { early:{fight:10,survival:6,objective:5}, mid:{fight:20,initiation:22,objective:17,mobility:8}, late:{fight:9,objective:10,survival:2,push:2} },
    benchmarkPoints: [[5,305,5],[10,395,8],[20,520,14],[40,620,23]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink before repeated Haze pickoffs', defensiveItem:'BKB when Crush follow-up is disabled', objectiveTiming:'Roshan after Haze with allied physical damage' },
    plans: [
      { id:'blink_haze', name:'Blink Crush physical tempo', scenarioTags:['balanced','objective_window'], priority:92, items:['phase_boots','blink','bkb','assault_cuirass'], reasons:['balanced_draft','objective_window'], optional:['heavens_halberd'] },
      { id:'control_response', name:'Protected Crush initiation', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:97, items:['phase_boots','blink','bkb','lotus_orb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['assault_cuirass'] },
      { id:'recovery', name:'Durable pickoff recovery', scenarioTags:['player_behind'], priority:82, items:['phase_boots','vanguard','blink','bkb'], reasons:['player_behind'], optional:['heavens_halberd'] },
      { id:'objective', name:'Haze Roshan conversion', scenarioTags:['player_ahead','objective_window'], priority:97, items:['phase_boots','blink','assault_cuirass','bkb'], reasons:['player_ahead','objective_window'], optional:['satanic'] }
    ],
    spikes: [
      { id:'level_6', name:'Corrosive Haze hunt window', priority:78, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Corrosive Haze must be ready'},{type:'min_health_pct',value:0.5,message:'Keep enough health to stay on the target'}], permanent:{fight:8,objective:8}, window:{fight:19,objective:12}, actions:{FIGHT:20,OBJECTIVE:13}, recommendation:'Apply Haze before the target disappears and threaten Roshan after the kill.' },
      { id:'blink', name:'Blink Slithereen Crush access', priority:92, trigger:[['item_owned','blink']], expectedMinute:14, requires:[{type:'min_health_pct',value:0.55,message:'Enter with enough health to continue chasing'}], permanent:{initiation:27,mobility:14,fight:11}, window:{fight:25,connect:19}, actions:{FIGHT:26,CONNECT:20}, recommendation:'Crush from fog, apply Haze, and keep vision while allies finish the target.' },
      { id:'blink_bkb', name:'Protected Haze pursuit', priority:98, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:22, permanent:{fight:20,survival:22,initiation:9}, window:{fight:27,objective:18}, actions:{FIGHT:28,OBJECTIVE:19}, recommendation:'Remain on the Haze target through control and convert the advantage into Roshan or a tower.' },
      { id:'assault', name:'Maximum physical objective amp', priority:99, trigger:[['item_owned','blink'],['item_owned','assault_cuirass']], expectedMinute:28, permanent:{fight:18,objective:22,push:10,survival:8}, window:{objective:27,fight:22}, actions:{OBJECTIVE:28,FIGHT:23}, recommendation:'Group physical damage around Haze and Assault Cuirass and force objectives quickly.' }
    ]
  },
  {
    id: 'tidehunter', displayName: 'Tidehunter', roles: ['Offlane'],
    archetypes: ['teamfight_anchor','aura_carrier','counter_initiator'],
    draftTags: ['teamfight','aura','frontline','counter_initiation'], vulnerabilities: ['cooldown_dependency','silence','split_push'],
    identity: 'Anchor vision and aura control, absorb the opening spell layer, and release Ravage only when it creates a decisive formation advantage.',
    basePower: { farm:48, fight:84, push:38, survival:91, initiation:89, objective:66, mobility:26 },
    stageCurves: { early:{survival:15,fight:5,farm:-3}, mid:{fight:22,initiation:21,survival:12,objective:13}, late:{fight:13,initiation:12,objective:11,mobility:-3} },
    benchmarkPoints: [[5,300,5],[10,385,8],[20,500,14],[40,590,23]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Pipe or Blink according to team need', defensiveItem:'Lotus or Shiva after the first aura', objectiveTiming:'fight around Ravage readiness and avoid forcing during downtime' },
    plans: [
      { id:'aura_anchor', name:'Aura-first teamfight anchor', scenarioTags:['balanced','enemy_magic_burst_high'], priority:91, items:['phase_boots','pipe','blink','shivas_guard'], reasons:['balanced_draft','enemy_magic_burst_high'], optional:['lotus_orb'] },
      { id:'control_response', name:'Protected Ravage access', scenarioTags:['enemy_control_high','team_lacks_initiation'], priority:96, items:['phase_boots','blink','pipe','lotus_orb'], reasons:['enemy_control_high','team_lacks_initiation'], optional:['bkb'] },
      { id:'recovery', name:'Low-economy aura recovery', scenarioTags:['player_behind'], priority:86, items:['phase_boots','pipe','crimson_guard','blink'], reasons:['player_behind'], optional:['lotus_orb'] },
      { id:'objective', name:'Ravage objective lock', scenarioTags:['player_ahead','objective_window'], priority:95, items:['phase_boots','blink','pipe','refresher'], reasons:['player_ahead','objective_window'], optional:['shivas_guard'] }
    ],
    spikes: [
      { id:'level_6', name:'Ravage teamfight permission', priority:82, trigger:[['level_gte',6]], expectedMinute:7, requires:[{type:'ultimate_ready',message:'Ravage must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep mana for Ravage and follow-up'}], permanent:{fight:9,initiation:9}, window:{fight:22,objective:14}, actions:{FIGHT:23,OBJECTIVE:15}, recommendation:'Group around an objective while Ravage is ready and avoid spending it on an unconvertible target.' },
      { id:'pipe', name:'Pipe frontline anchor', priority:84, trigger:[['item_owned','pipe']], expectedMinute:14, requires:[{type:'min_health_pct',value:0.55,message:'Lead with enough health to hold the area'}], permanent:{survival:22,fight:10,objective:9}, window:{fight:18,objective:18}, actions:{FIGHT:19,OBJECTIVE:19}, recommendation:'Absorb the magic opening and hold Ravage until multiple heroes commit.' },
      { id:'blink', name:'Blink Ravage reach', priority:94, trigger:[['item_owned','blink']], expectedMinute:18, requires:[{type:'ultimate_ready',message:'Ravage should be ready before revealing Blink'},{type:'min_mana_pct',value:0.55,message:'Preserve mana for Ravage and follow-up'}], permanent:{initiation:27,mobility:14,fight:11}, window:{fight:26,connect:19}, actions:{FIGHT:27,CONNECT:20}, recommendation:'Blink only when Ravage hits the formation protecting the objective or carry.' },
      { id:'refresher', name:'Double-Ravage objective lock', priority:100, trigger:[['item_owned','blink'],['item_owned','refresher']], expectedMinute:35, requires:[{type:'ultimate_ready',message:'Ravage must be ready before Refresher'},{type:'min_mana_pct',value:0.8,message:'Double-Ravage requires a high mana reserve'}], permanent:{fight:27,initiation:18,objective:18}, window:{fight:33,objective:29}, actions:{FIGHT:34,OBJECTIVE:30}, recommendation:'Use the first Ravage to force defensive resources and the second to secure the objective area.' }
    ]
  }
];

export const HERO_IDS = Object.freeze(DEFINITIONS.map((entry) => entry.id));
export function createProfilePack(dependencies) {
  return createExplicitProfilePack(DEFINITIONS, dependencies, CALIBRATION);
}
