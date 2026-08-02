import { createExplicitProfilePack } from './explicit-profile-pack.mjs';

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-control-support-v2',
  calibrationSource: 'hero-specific lane control and teamfight support strategic review; live recordings pending',
  calibrationConfidence: 0.70,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const DEFINITIONS = [
  {
    id: 'ancient_apparition', displayName: 'Ancient Apparition', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['anti_heal_support','global_teamfight','long_range_setup'],
    draftTags: ['anti_heal','global_pressure','magic_damage','teamfight'], vulnerabilities: ['backline_jump','silence','missed_setup'],
    identity: 'Play behind the first line, pair Cold Feet with reliable control, and use Ice Blast to deny healing before allies commit rather than after the target has already recovered.',
    basePower: { farm:30, fight:78, push:31, survival:35, initiation:53, objective:57, mobility:28 },
    stageCurves: { early:{fight:8,initiation:5}, mid:{fight:21,objective:12,initiation:10}, late:{fight:15,objective:8,survival:-6} },
    benchmarkPoints: [[5,165,4],[10,220,7],[20,290,12],[40,360,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Force Staff or Aether Lens before repeated global fights', defensiveItem:'Glimmer or Force when the backline is jumped', objectiveTiming:'after Ice Blast connects before enemy sustain is used' },
    plans: [
      { id:'global_anti_heal', name:'Global anti-heal coverage', scenarioTags:['balanced','enemy_healing_high'], priority:96, items:['arcane_boots','aether_lens','force_staff','scepter'], reasons:['balanced_draft','enemy_healing_high'], optional:['refresher'] },
      { id:'jump_response', name:'Protected backline casting', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, items:['tranquil_boots','glimmer_cape','force_staff','aether_lens'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['scepter'] },
      { id:'recovery', name:'Low-economy Ice Blast access', scenarioTags:['player_behind'], priority:86, items:['tranquil_boots','force_staff','glimmer_cape','aether_lens'], reasons:['player_behind'], optional:['atos'] },
      { id:'objective', name:'Anti-sustain objective siege', scenarioTags:['objective_window','player_ahead'], priority:94, items:['arcane_boots','aether_lens','scepter','refresher'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Ice Blast anti-heal window', priority:84, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Ice Blast must be ready before the team commits'},{type:'min_mana_pct',value:0.45,message:'Keep mana for Ice Blast and follow-up control'}], permanent:{fight:11,objective:8}, window:{fight:22,connect:13}, actions:{FIGHT:23,CONNECT:14}, recommendation:'Launch Ice Blast before allied burst lands and only call the commit after the projectile path is credible.' },
      { id:'aether_lens', name:'Safe setup range', priority:87, trigger:[['item_owned','aether_lens']], expectedMinute:16, requires:[{type:'min_health_pct',value:0.45,message:'Do not step into jump range to apply Cold Feet'}], permanent:{fight:12,survival:8,initiation:7}, window:{fight:18,connect:11}, actions:{FIGHT:19,CONNECT:12}, recommendation:'Stay outside first contact, layer Cold Feet onto confirmed control, and preserve vision for the Ice Blast line.' },
      { id:'scepter', name:'Extended anti-sustain pressure', priority:92, trigger:[['item_owned','scepter']], expectedMinute:24, requires:[{type:'min_mana_pct',value:0.55,message:'Enter with enough mana for the extended spell cycle'}], permanent:{fight:18,objective:13}, window:{fight:23,objective:17}, actions:{FIGHT:24,OBJECTIVE:18}, recommendation:'Pressure long fights only while anti-heal coverage remains active and the backline is protected.' },
      { id:'scepter_refresher', name:'Double global denial', priority:97, trigger:[['item_owned','scepter'],['item_owned','refresher']], expectedMinute:34, requires:[{type:'min_mana_pct',value:0.75,message:'Double Ice Blast requires a full mana reserve'}], permanent:{fight:24,objective:19}, window:{fight:30,objective:22}, actions:{FIGHT:31,OBJECTIVE:23}, recommendation:'Stagger the two global windows across enemy sustain and buyback responses instead of overlapping them.' }
    ]
  },
  {
    id: 'bane', displayName: 'Bane', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['single_target_control','lane_dominator','channel_support'],
    draftTags: ['disable','save_setup','pickoff','channel'], vulnerabilities: ['channel_interrupt','dispel','multiple_threats'],
    identity: 'Win the lane through isolated trades, use Nightmare to protect or set up, and channel Fiend’s Grip only after interrupting threats are controlled or forced away.',
    basePower: { farm:28, fight:79, push:24, survival:47, initiation:76, objective:42, mobility:32 },
    stageCurves: { early:{fight:15,initiation:11,survival:5}, mid:{fight:21,initiation:22}, late:{fight:8,initiation:13,objective:-4} },
    benchmarkPoints: [[5,170,4],[10,225,7],[20,295,12],[40,365,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens or Blink before repeated pickoffs', defensiveItem:'Glimmer or BKB when Fiend’s Grip is interrupted', objectiveTiming:'after a high-value target is removed from the defense' },
    plans: [
      { id:'grip_range', name:'Fiend’s Grip cast range', scenarioTags:['balanced','enemy_control_high'], priority:95, items:['tranquil_boots','aether_lens','glimmer_cape','scepter'], reasons:['balanced_draft','enemy_control_high'], optional:['blink'] },
      { id:'blink_pickoff', name:'Blink single-target pickoff', scenarioTags:['team_lacks_initiation','player_ahead'], priority:98, items:['tranquil_boots','blink','aether_lens','bkb'], reasons:['team_lacks_initiation','player_ahead'], optional:['glimmer_cape'] },
      { id:'recovery', name:'Low-economy channel protection', scenarioTags:['player_behind'], priority:87, items:['tranquil_boots','glimmer_cape','force_staff','aether_lens'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Remove the objective defender', scenarioTags:['objective_window'], priority:93, items:['arcane_boots','aether_lens','blink','scepter'], reasons:['objective_window'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'Fiend’s Grip removal window', priority:86, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Fiend’s Grip must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep mana for Nightmare plus Grip'}], permanent:{fight:12,initiation:16}, window:{fight:23,connect:16}, actions:{FIGHT:24,CONNECT:17}, recommendation:'Grip the highest-value isolated target only after likely interrupts are slept, disabled, or out of range.' },
      { id:'aether_lens', name:'Protected control range', priority:88, trigger:[['item_owned','aether_lens']], expectedMinute:16, requires:[{type:'min_health_pct',value:0.5,message:'Stay healthy enough to hold the channel position'}], permanent:{fight:13,survival:9,initiation:11}, window:{fight:19,connect:14}, actions:{FIGHT:20,CONNECT:15}, recommendation:'Start control from fog or high ground and preserve Nightmare for the interrupting hero.' },
      { id:'blink', name:'Instant pickoff access', priority:92, trigger:[['item_owned','blink']], expectedMinute:21, requires:[{type:'min_mana_pct',value:0.55,message:'Keep mana for the full control chain'}], permanent:{fight:15,initiation:19,mobility:10}, window:{connect:23,fight:19}, actions:{CONNECT:24,FIGHT:20}, recommendation:'Blink only onto a target your team can reach immediately; do not trade your channel for a low-value support.' },
      { id:'blink_bkb', name:'Protected full channel', priority:97, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:31, requires:[{type:'ultimate_ready',message:'Fiend’s Grip must be ready before the protected jump'}], permanent:{fight:22,survival:17,initiation:22}, window:{fight:29,connect:20}, actions:{FIGHT:30,CONNECT:21}, recommendation:'Use spell immunity to guarantee the decisive channel, then reset before the enemy can punish your exposed position.' }
    ]
  },
  {
    id: 'crystal_maiden', displayName: 'Crystal Maiden', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['mana_support','area_control','fragile_channel'],
    draftTags: ['mana_aura','root','slow','teamfight'], vulnerabilities: ['backline_jump','silence','channel_interrupt'],
    identity: 'Enable the map with mana, hold Frostbite for the target that must be stopped, and channel Freezing Field only after enemy interrupts and mobility have been committed.',
    basePower: { farm:35, fight:76, push:34, survival:29, initiation:58, objective:51, mobility:24 },
    stageCurves: { early:{fight:14,initiation:8,objective:4}, mid:{fight:20,objective:10,survival:-5}, late:{fight:10,survival:-10,objective:4} },
    benchmarkPoints: [[5,170,4],[10,230,7],[20,300,12],[40,370,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Glimmer Cape before first protected Freezing Field', defensiveItem:'Force, Glimmer, or BKB against jump and interruption', objectiveTiming:'after enemy mobility is spent inside the control zone' },
    plans: [
      { id:'glimmer_channel', name:'Protected Freezing Field', scenarioTags:['balanced','enemy_magic_burst_high'], priority:96, items:['tranquil_boots','glimmer_cape','force_staff','bkb'], reasons:['balanced_draft','enemy_magic_burst_high'], optional:['blink'] },
      { id:'blink_control', name:'Blink Frostbite control', scenarioTags:['team_lacks_initiation','player_ahead'], priority:95, items:['tranquil_boots','blink','glimmer_cape','bkb'], reasons:['team_lacks_initiation','player_ahead'], optional:['scepter'] },
      { id:'recovery', name:'Low-economy mana and save', scenarioTags:['player_behind'], priority:88, items:['tranquil_boots','glimmer_cape','force_staff','aether_lens'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Area-control objective defense', scenarioTags:['objective_window','enemy_physical_dps_high'], priority:92, items:['arcane_boots','glimmer_cape','scepter','bkb'], reasons:['objective_window','enemy_physical_dps_high'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Freezing Field punish window', priority:82, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Freezing Field must be ready'},{type:'min_mana_pct',value:0.6,message:'Keep enough mana for Frostbite and the full channel'}], permanent:{fight:12,objective:6}, window:{fight:22,objective:12}, actions:{FIGHT:23,OBJECTIVE:13}, recommendation:'Wait for enemy movement and interrupts to be committed, then channel from fog or behind allied control.' },
      { id:'glimmer_cape', name:'Protected channel access', priority:88, trigger:[['item_owned','glimmer_cape']], expectedMinute:15, requires:[{type:'min_health_pct',value:0.5,message:'Do not begin the channel from lethal health'}], permanent:{fight:14,survival:15}, window:{fight:22,connect:10}, actions:{FIGHT:23,CONNECT:11}, recommendation:'Use Glimmer after committing to the channel or to survive the jump that would otherwise prevent it.' },
      { id:'blink', name:'Instant root positioning', priority:91, trigger:[['item_owned','blink']], expectedMinute:21, requires:[{type:'min_mana_pct',value:0.55,message:'Keep mana for Frostbite and retreat utility'}], permanent:{fight:15,initiation:15,mobility:11}, window:{connect:20,fight:18}, actions:{CONNECT:21,FIGHT:19}, recommendation:'Blink to secure the first root only when allies can immediately occupy the controlled area.' },
      { id:'blink_bkb', name:'Reliable late teamfight channel', priority:97, trigger:[['item_owned','blink'],['item_owned','bkb']], expectedMinute:31, requires:[{type:'ultimate_ready',message:'Freezing Field must be available for the protected timing'}], permanent:{fight:23,survival:18,objective:13}, window:{fight:30,objective:19}, actions:{FIGHT:31,OBJECTIVE:20}, recommendation:'Enter after the first wave of spells, protect the channel, and end it early if repositioning preserves your next control cycle.' }
    ]
  },
  {
    id: 'disruptor', displayName: 'Disruptor', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['teamfight_controller','anti_mobility','catch_support'],
    draftTags: ['silence','leash','reposition_punish','teamfight'], vulnerabilities: ['backline_jump','long_cooldowns','poor_vision'],
    identity: 'Track retreat paths, Glimpse only when it creates a numbers advantage, and layer Kinetic Field with Static Storm after mobility or dispels are committed.',
    basePower: { farm:31, fight:84, push:29, survival:36, initiation:77, objective:58, mobility:30 },
    stageCurves: { early:{fight:10,initiation:8}, mid:{fight:24,initiation:21,objective:12}, late:{fight:16,initiation:14,objective:8} },
    benchmarkPoints: [[5,165,4],[10,225,7],[20,295,12],[40,370,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens or Blink before decisive Static Storm fights', defensiveItem:'Force or Glimmer when the backline is jumped', objectiveTiming:'after a key defender is trapped without mobility or dispel' },
    plans: [
      { id:'field_storm', name:'Field and Static Storm control', scenarioTags:['balanced','enemy_control_high'], priority:96, items:['arcane_boots','aether_lens','force_staff','scepter'], reasons:['balanced_draft','enemy_control_high'], optional:['refresher'] },
      { id:'blink_catch', name:'Blink catch and Glimpse', scenarioTags:['team_lacks_initiation','player_ahead'], priority:98, items:['tranquil_boots','blink','aether_lens','scepter'], reasons:['team_lacks_initiation','player_ahead'], optional:['glimmer_cape'] },
      { id:'recovery', name:'Low-economy counter-initiation', scenarioTags:['player_behind'], priority:88, items:['tranquil_boots','force_staff','glimmer_cape','aether_lens'], reasons:['player_behind'], optional:['scepter'] },
      { id:'objective', name:'Static Storm objective lock', scenarioTags:['objective_window'], priority:95, items:['arcane_boots','aether_lens','scepter','refresher'], reasons:['objective_window'], optional:['blink'] }
    ],
    spikes: [
      { id:'level_6', name:'Static Storm containment', priority:85, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Static Storm must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for Field, Storm, and Glimpse'}], permanent:{fight:14,initiation:15,objective:7}, window:{fight:24,connect:16}, actions:{FIGHT:25,CONNECT:17}, recommendation:'Trap the target after mobility is spent and keep Glimpse for the hero trying to escape or reinforce.' },
      { id:'aether_lens', name:'Safe Glimpse and Field range', priority:88, trigger:[['item_owned','aether_lens']], expectedMinute:16, permanent:{fight:13,survival:8,initiation:12}, window:{connect:19,fight:17}, actions:{CONNECT:20,FIGHT:18}, recommendation:'Control from fog and avoid showing before the enemy has revealed the movement you intend to punish.' },
      { id:'scepter', name:'High-value Storm lockdown', priority:94, trigger:[['item_owned','scepter']], expectedMinute:24, requires:[{type:'ultimate_ready',message:'Static Storm must be ready for the upgraded lockdown'}], permanent:{fight:21,initiation:18,objective:13}, window:{fight:27,objective:18}, actions:{FIGHT:28,OBJECTIVE:19}, recommendation:'Reserve the upgraded Storm for the core whose defensive timing would otherwise break the fight.' },
      { id:'scepter_refresher', name:'Double containment cycle', priority:98, trigger:[['item_owned','scepter'],['item_owned','refresher']], expectedMinute:35, requires:[{type:'min_mana_pct',value:0.78,message:'Two full control cycles require nearly full mana'}], permanent:{fight:27,initiation:22,objective:19}, window:{fight:32,objective:24}, actions:{FIGHT:33,OBJECTIVE:25}, recommendation:'Separate the two Storms across the first commitment and the buyback or second-wave response.' }
    ]
  },
  {
    id: 'jakiro', displayName: 'Jakiro', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['lane_pressure','area_denial','siege_support'],
    draftTags: ['wave_clear','tower_pressure','teamfight_zone','slow'], vulnerabilities: ['mobility','backline_jump','slow_casting'],
    identity: 'Win space through persistent lane pressure, place Ice Path where movement is forced, and use Macropyre to deny the ground enemies must cross rather than chasing mobile targets.',
    basePower: { farm:48, fight:78, push:76, survival:52, initiation:61, objective:82, mobility:25 },
    stageCurves: { early:{fight:13,push:16,objective:12}, mid:{fight:18,push:22,objective:21}, late:{fight:8,push:10,objective:12} },
    benchmarkPoints: [[5,190,4],[10,250,7],[20,330,12],[40,410,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Force Staff or Aether Lens before repeated zone fights', defensiveItem:'Force or Glimmer against mobile backline access', objectiveTiming:'when Liquid Fire pressure and Macropyre deny the defense area' },
    plans: [
      { id:'lane_siege', name:'Lane pressure into siege', scenarioTags:['balanced','objective_window'], priority:95, items:['arcane_boots','force_staff','aether_lens','scepter'], reasons:['balanced_draft','objective_window'], optional:['shivas_guard'] },
      { id:'mobility_response', name:'Protected area denial', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['arcane_boots','glimmer_cape','force_staff','aether_lens'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['scepter'] },
      { id:'recovery', name:'Low-economy wave and zone control', scenarioTags:['player_behind'], priority:88, items:['arcane_boots','force_staff','glimmer_cape','aether_lens'], reasons:['player_behind'], optional:['euls'] },
      { id:'objective', name:'Macropyre objective denial', scenarioTags:['player_ahead','objective_window'], priority:97, items:['arcane_boots','aether_lens','scepter','shivas_guard'], reasons:['player_ahead','objective_window'], optional:['refresher'] }
    ],
    spikes: [
      { id:'level_6', name:'Macropyre zone-control window', priority:82, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Macropyre must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep mana for Ice Path and Macropyre'}], permanent:{fight:11,push:10,objective:13}, window:{fight:20,objective:18}, actions:{FIGHT:21,OBJECTIVE:19}, recommendation:'Cast Macropyre across the route enemies must take and place Ice Path on the forced exit.' },
      { id:'aether_lens', name:'Safe Ice Path placement', priority:87, trigger:[['item_owned','aether_lens']], expectedMinute:16, permanent:{fight:13,survival:8,initiation:10,objective:7}, window:{fight:18,objective:13}, actions:{FIGHT:19,OBJECTIVE:14}, recommendation:'Control ramps and narrow approaches from outside first-contact range.' },
      { id:'scepter', name:'Persistent objective denial', priority:93, trigger:[['item_owned','scepter']], expectedMinute:24, requires:[{type:'min_mana_pct',value:0.58,message:'Keep mana for the full area-control sequence'}], permanent:{fight:19,push:16,objective:21}, window:{fight:24,objective:25}, actions:{FIGHT:25,OBJECTIVE:26}, recommendation:'Force defenders to choose between abandoning the area and fighting through sustained ground damage.' },
      { id:'scepter_shivas', name:'Late siege control engine', priority:97, trigger:[['item_owned','scepter'],['item_owned','shivas_guard']], expectedMinute:33, requires:[{type:'min_health_pct',value:0.55,message:'Enter the siege healthy enough to survive counter-jump'}], permanent:{fight:24,push:20,survival:15,objective:27}, window:{fight:29,objective:30}, actions:{FIGHT:30,OBJECTIVE:31}, recommendation:'Slow the counter-engage, maintain the denied zone, and hit the objective only while defenders cannot occupy the ground.' }
    ]
  },
  {
    id: 'lich', displayName: 'Lich', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['lane_protector','anti_physical_support','bounce_teamfight'],
    draftTags: ['armor','slow','teamfight','save'], vulnerabilities: ['spread_formation','backline_jump','dispel'],
    identity: 'Protect the core with Frost Shield before physical commitment, isolate clustered targets for Chain Frost, and avoid spending the ultimate into a formation that can immediately spread.',
    basePower: { farm:32, fight:80, push:35, survival:48, initiation:57, objective:55, mobility:28 },
    stageCurves: { early:{fight:14,survival:9}, mid:{fight:21,survival:12,objective:10}, late:{fight:12,survival:5,objective:7} },
    benchmarkPoints: [[5,175,4],[10,235,7],[20,305,12],[40,380,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Glimmer or Aether Lens before repeated Chain Frost fights', defensiveItem:'Force or Glimmer when the backline is jumped', objectiveTiming:'after Frost Shield absorbs the first physical commitment' },
    plans: [
      { id:'shield_teamfight', name:'Frost Shield teamfight support', scenarioTags:['balanced','enemy_physical_dps_high'], priority:96, items:['tranquil_boots','glimmer_cape','aether_lens','scepter'], reasons:['balanced_draft','enemy_physical_dps_high'], optional:['force_staff'] },
      { id:'jump_response', name:'Protected Chain Frost casting', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['tranquil_boots','force_staff','glimmer_cape','aether_lens'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['scepter'] },
      { id:'recovery', name:'Low-economy shield coverage', scenarioTags:['player_behind'], priority:88, items:['tranquil_boots','glimmer_cape','force_staff','arcane_boots'], reasons:['player_behind'], optional:['aether_lens'] },
      { id:'objective', name:'Shielded objective conversion', scenarioTags:['objective_window','player_ahead'], priority:93, items:['arcane_boots','aether_lens','scepter','refresher'], reasons:['objective_window','player_ahead'], optional:['glimmer_cape'] }
    ],
    spikes: [
      { id:'level_6', name:'Chain Frost cluster punish', priority:83, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Chain Frost must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep mana for Frost Shield and Chain Frost'}], permanent:{fight:13,objective:6}, window:{fight:23,connect:12}, actions:{FIGHT:24,CONNECT:13}, recommendation:'Cast into a controlled cluster with limited escape routes and shield the ally holding enemies in place.' },
      { id:'glimmer_cape', name:'Protected shield and ultimate range', priority:87, trigger:[['item_owned','glimmer_cape']], expectedMinute:15, permanent:{fight:11,survival:15}, window:{fight:19,connect:10}, actions:{FIGHT:20,CONNECT:11}, recommendation:'Use Glimmer to survive the first jump or protect the core while Frost Shield reduces physical damage.' },
      { id:'scepter', name:'Extended control teamfight', priority:93, trigger:[['item_owned','scepter']], expectedMinute:24, requires:[{type:'min_mana_pct',value:0.58,message:'Keep mana for the full control and shield cycle'}], permanent:{fight:20,initiation:13,objective:11}, window:{fight:26,objective:16}, actions:{FIGHT:27,OBJECTIVE:17}, recommendation:'Fight around confined terrain where the upgraded control and Chain Frost can punish regrouping enemies.' },
      { id:'scepter_refresher', name:'Double cluster punishment', priority:97, trigger:[['item_owned','scepter'],['item_owned','refresher']], expectedMinute:34, requires:[{type:'min_mana_pct',value:0.76,message:'Two ultimate cycles require a full mana reserve'}], permanent:{fight:26,objective:17}, window:{fight:31,objective:21}, actions:{FIGHT:32,OBJECTIVE:22}, recommendation:'Hold the second ultimate for the enemy regroup or buyback wave instead of overlapping both casts.' }
    ]
  },
  {
    id: 'lion', displayName: 'Lion', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['instant_disable','pickoff_support','burst_finisher'],
    draftTags: ['hex','stun','mana_drain','burst'], vulnerabilities: ['backline_jump','spell_immunity','low_economy'],
    identity: 'Prioritize instant Hex on the highest-impact threat, chain Earth Spike only after allies are ready, and treat Finger of Death as secure burst rather than a reason to overextend.',
    basePower: { farm:34, fight:82, push:27, survival:37, initiation:85, objective:43, mobility:34 },
    stageCurves: { early:{fight:13,initiation:12}, mid:{fight:24,initiation:25}, late:{fight:14,initiation:17,objective:-3} },
    benchmarkPoints: [[5,170,4],[10,230,7],[20,305,12],[40,380,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Blink before repeated instant-disable pickoffs', defensiveItem:'Force or Glimmer when Blink positioning is punished', objectiveTiming:'after the key defender is disabled and removed' },
    plans: [
      { id:'blink_hex', name:'Blink instant Hex', scenarioTags:['balanced','team_lacks_initiation'], priority:99, items:['tranquil_boots','blink','aether_lens','force_staff'], reasons:['balanced_draft','team_lacks_initiation'], optional:['scepter'] },
      { id:'survival_control', name:'Protected disable coverage', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, items:['tranquil_boots','glimmer_cape','force_staff','aether_lens'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['blink'] },
      { id:'recovery', name:'Low-economy disable chain', scenarioTags:['player_behind'], priority:89, items:['tranquil_boots','force_staff','glimmer_cape','blink'], reasons:['player_behind'], optional:['aether_lens'] },
      { id:'objective', name:'Remove the objective defender', scenarioTags:['objective_window','player_ahead'], priority:94, items:['arcane_boots','blink','aether_lens','scepter'], reasons:['objective_window','player_ahead'], optional:['force_staff'] }
    ],
    spikes: [
      { id:'level_6', name:'Finger burst pickoff', priority:84, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Finger of Death must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for the full disable and burst chain'}], permanent:{fight:13,initiation:10}, window:{fight:22,connect:15}, actions:{FIGHT:23,CONNECT:16}, recommendation:'Secure the kill after Hex and Earth Spike connect; do not expose first merely to use the ultimate.' },
      { id:'blink', name:'Instant Hex initiation', priority:92, trigger:[['item_owned','blink']], expectedMinute:18, requires:[{type:'min_mana_pct',value:0.5,message:'Keep mana for Hex, Spike, and retreat utility'}], permanent:{fight:16,initiation:22,mobility:12}, window:{connect:25,fight:21}, actions:{CONNECT:26,FIGHT:22}, recommendation:'Blink-Hex the target that can disrupt your team’s first spell, then chain the stun toward allied damage.' },
      { id:'aether_lens', name:'Safe disable follow-up', priority:88, trigger:[['item_owned','aether_lens']], expectedMinute:21, permanent:{fight:12,survival:9,initiation:13}, window:{fight:18,connect:13}, actions:{FIGHT:19,CONNECT:14}, recommendation:'After the first Hex, reposition to maintain cast range without standing inside counter-initiation.' },
      { id:'blink_scepter', name:'Late pickoff burst engine', priority:97, trigger:[['item_owned','blink'],['item_owned','scepter']], expectedMinute:31, requires:[{type:'ultimate_ready',message:'Finger of Death should be ready for the decisive pickoff'}], permanent:{fight:24,initiation:23,objective:8}, window:{connect:28,fight:26}, actions:{CONNECT:29,FIGHT:27}, recommendation:'Remove one high-value defender, disengage from buyback response, and only then convert the objective.' }
    ]
  },
  {
    id: 'shadow_shaman', displayName: 'Shadow Shaman', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['long_disable','tower_siege','pickoff_support'],
    draftTags: ['hex','channel_disable','summon_objective','push'], vulnerabilities: ['channel_interrupt','backline_jump','wave_clear'],
    identity: 'Use instant Hex to secure the first target, channel Shackles only when interruption is controlled, and convert every clean pickoff into Serpent Wards on a meaningful objective.',
    basePower: { farm:40, fight:81, push:88, survival:38, initiation:82, objective:91, mobility:31 },
    stageCurves: { early:{fight:14,initiation:12,push:7}, mid:{fight:22,push:26,objective:27}, late:{fight:12,push:18,objective:20} },
    benchmarkPoints: [[5,180,4],[10,245,7],[20,325,12],[40,405,20]],
    benchmarkContract: { levelTiming:6, keyItemTiming:'Aether Lens or Blink before repeated pickoffs', defensiveItem:'Glimmer, Force, or BKB when Shackles is interrupted', objectiveTiming:'immediately after a pickoff creates a safe Serpent Ward window' },
    plans: [
      { id:'lens_shackles', name:'Safe Hex and Shackles range', scenarioTags:['balanced','enemy_control_high'], priority:96, items:['arcane_boots','aether_lens','glimmer_cape','scepter'], reasons:['balanced_draft','enemy_control_high'], optional:['blink'] },
      { id:'blink_pickoff', name:'Blink Hex pickoff', scenarioTags:['team_lacks_initiation','player_ahead'], priority:99, items:['tranquil_boots','blink','aether_lens','bkb'], reasons:['team_lacks_initiation','player_ahead'], optional:['refresher'] },
      { id:'recovery', name:'Low-economy disable coverage', scenarioTags:['player_behind'], priority:89, items:['tranquil_boots','glimmer_cape','force_staff','aether_lens'], reasons:['player_behind'], optional:['blink'] },
      { id:'objective', name:'Serpent Ward objective conversion', scenarioTags:['objective_window'], priority:98, items:['arcane_boots','aether_lens','scepter','refresher'], reasons:['objective_window'], optional:['bkb'] }
    ],
    spikes: [
      { id:'level_6', name:'Serpent Ward objective window', priority:87, trigger:[['level_gte',6]], expectedMinute:9, requires:[{type:'ultimate_ready',message:'Mass Serpent Ward must be ready'},{type:'min_mana_pct',value:0.55,message:'Keep mana for Hex, Shackles, and Wards'}], permanent:{fight:12,push:17,objective:20}, window:{objective:27,fight:17}, actions:{OBJECTIVE:28,FIGHT:18}, recommendation:'Take a tower or Roshan only after the first defender is controlled and the Wards can survive in a protected position.' },
      { id:'aether_lens', name:'Protected Shackles range', priority:88, trigger:[['item_owned','aether_lens']], expectedMinute:16, requires:[{type:'min_health_pct',value:0.5,message:'Do not channel from lethal health'}], permanent:{fight:13,survival:9,initiation:13}, window:{fight:19,connect:14}, actions:{FIGHT:20,CONNECT:15}, recommendation:'Hex first, channel from maximum safe range, and release early if movement preserves the next disable cycle.' },
      { id:'blink', name:'Instant Hex pickoff access', priority:93, trigger:[['item_owned','blink']], expectedMinute:21, requires:[{type:'min_mana_pct',value:0.55,message:'Keep mana for the full pickoff and objective conversion'}], permanent:{fight:17,initiation:21,mobility:11,objective:9}, window:{connect:24,fight:20}, actions:{CONNECT:25,FIGHT:21}, recommendation:'Blink-Hex a defender your team can burst, then move directly to the nearest valuable objective.' },
      { id:'scepter_refresher', name:'Double Ward siege', priority:98, trigger:[['item_owned','scepter'],['item_owned','refresher']], expectedMinute:34, requires:[{type:'min_mana_pct',value:0.78,message:'Double Wards require a full mana reserve'},{type:'ultimate_ready',message:'Mass Serpent Ward must be ready'}], permanent:{fight:24,push:31,objective:34}, window:{objective:38,fight:25}, actions:{OBJECTIVE:39,FIGHT:26}, recommendation:'Layer the second Ward field only after the first forces movement or a buyback; do not stack both into the same clear.' }
    ]
  }
];

export const HERO_IDS = Object.freeze(DEFINITIONS.map((entry) => entry.id));
export function createProfilePack(dependencies) {
  return createExplicitProfilePack(DEFINITIONS, dependencies, CALIBRATION);
}
