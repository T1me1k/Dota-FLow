const EXTRA_ITEMS = Object.freeze({
  aether_lens: { id: 'item_aether_lens', name: 'Aether Lens', cost: 2275 },
  euls: { id: 'item_cyclone', name: "Eul's Scepter", cost: 2625 },
  shadow_blade: { id: 'item_invis_sword', name: 'Shadow Blade', cost: 3000 },
  dagon: { id: 'item_dagon', name: 'Dagon', cost: 2850 }
});

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.38-mid-tempo-v2',
  calibrationSource: 'hero-specific strategic review; live recordings pending',
  calibrationConfidence: 0.72,
  patchVersion: '7.38-review-required',
  patchReviewRequired: true
});

export const HERO_IDS = Object.freeze([
  'broodmother',
  'huskar',
  'meepo',
  'pugna',
  'shadow_fiend',
  'sniper',
  'tinker',
  'viper'
]);

function getItem(ITEMS, key) {
  const value = ITEMS[key] ?? EXTRA_ITEMS[key];
  if (!value) throw new Error(`Unknown item key in mid/tempo profile pack: ${key}`);
  return value;
}

function makePlan(ITEMS, heroId, {
  id,
  name,
  scenarioTags,
  priority,
  itemKeys,
  reasons,
  optional = [],
  situational = [],
  avoidWhen = [],
  requiredSignals = []
}) {
  const coreItems = itemKeys.map((key) => getItem(ITEMS, key));
  return {
    id: `${heroId}_${id}`,
    name,
    role: 'core',
    scenarioTags,
    priority,
    coreItems,
    optionalItems: optional.map((key) => getItem(ITEMS, key)),
    situationalItems: situational.map((key) => getItem(ITEMS, key)),
    avoidWhen,
    reasons,
    requiredSignals,
    confidence: CALIBRATION.calibrationConfidence,
    calibrationVersion: CALIBRATION.calibrationVersion,
    items: coreItems
  };
}

function makeSpike(condition, heroId, {
  id,
  name,
  priority,
  trigger,
  expectedMinute,
  earlyToleranceMin,
  lateToleranceMin,
  activeDurationSec,
  fadeDurationSec,
  permanent,
  window,
  actions,
  recommendation,
  requires = []
}) {
  return {
    id: `${heroId}_${id}`,
    name,
    priority,
    trigger: { all: trigger.map(([type, value]) => condition(type, value)) },
    expectedMinute,
    earlyToleranceMin,
    lateToleranceMin,
    activeDurationSec,
    fadeDurationSec,
    permanent,
    window,
    actions,
    recommendation,
    requires,
    calibrationVersion: CALIBRATION.calibrationVersion
  };
}

function makeProfile({
  id,
  displayName,
  roles,
  archetypes,
  draftTags,
  vulnerabilities,
  identity,
  basePower,
  stageCurves,
  benchmarkPoints,
  benchmarkContract,
  buildPlans,
  spikes
}, benchmark) {
  return {
    id,
    displayName,
    role: 'core',
    primaryRole: 'core',
    roles,
    archetypes,
    draftTags,
    vulnerabilities,
    playstyleIdentity: identity,
    basePower,
    stageCurves,
    benchmarks: benchmark(benchmarkPoints),
    benchmarkContract,
    buildPlans,
    spikes,
    ...CALIBRATION,
    profileConfidence: CALIBRATION.calibrationConfidence,
    balanceCalibration: 'prototype calibration'
  };
}

export function createProfilePack({ ITEMS, benchmark, condition }) {
  const profiles = {};

  profiles.broodmother = makeProfile({
    id: 'broodmother',
    displayName: 'Broodmother',
    roles: ['Mid', 'Offlane'],
    archetypes: ['lane_occupier', 'split_pusher', 'pickoff_core'],
    draftTags: ['split_push', 'summons', 'pickoff', 'objective'],
    vulnerabilities: ['control', 'burst', 'wave_clear'],
    identity: 'Own one side of the map through web mobility, isolate supports, and convert forced rotations into towers or Roshan.',
    basePower: { farm: 74, fight: 58, push: 84, survival: 55, initiation: 38, objective: 72, mobility: 76 },
    stageCurves: {
      early: { farm: 8, push: 12, mobility: 10, fight: 2 },
      mid: { fight: 12, push: 16, objective: 13, mobility: 8 },
      late: { fight: -6, push: 8, survival: -5, objective: 4 }
    },
    benchmarkPoints: [[5,350,5],[10,470,8],[15,555,12],[20,620,16],[30,680,22],[40,710,26]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Orchid before the first map lock window', defensiveItem: 'BKB or Linken before sustained high-ground pressure', objectiveTiming: 'after enemy rotations are forced to the web lane' },
    buildPlans: [
      makePlan(ITEMS, 'broodmother', { id:'balanced', name:'Orchid map lock', scenarioTags:['balanced','split_push_required'], priority:78, itemKeys:['orchid','bkb','bloodthorn'], reasons:['balanced_draft','split_push_required'], optional:['assault_cuirass'], situational:['linken'] }),
      makePlan(ITEMS, 'broodmother', { id:'control_response', name:'Protected pickoff pressure', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:92, itemKeys:['orchid','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['bloodthorn'], situational:['manta'] }),
      makePlan(ITEMS, 'broodmother', { id:'recovery', name:'Safe web recovery', scenarioTags:['player_behind'], priority:80, itemKeys:['orchid','manta','bkb'], reasons:['player_behind'], optional:['bloodthorn'], situational:['linken'] }),
      makePlan(ITEMS, 'broodmother', { id:'objective', name:'Web-side objective conversion', scenarioTags:['player_ahead','objective_window'], priority:88, itemKeys:['orchid','assault_cuirass','bkb'], reasons:['player_ahead','objective_window'], optional:['bloodthorn'], situational:['linken'] })
    ],
    spikes: [
      makeSpike(condition, 'broodmother', { id:'level_6', name:'Insatiable Hunger lane kill window', priority:66, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:150, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Insatiable Hunger must be ready'},{type:'min_health_pct',value:0.45,message:'Do not force the lane kill while too low'}], permanent:{fight:5,survival:3}, window:{fight:14,pressure:12}, actions:{FIGHT:13,PRESSURE:12}, recommendation:'Use the level-six sustain advantage to remove the lane defender, then hit the nearby tower.' }),
      makeSpike(condition, 'broodmother', { id:'orchid', name:'Orchid isolation timing', priority:82, trigger:[['item_owned',getItem(ITEMS,'orchid').id]], expectedMinute:14, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, permanent:{fight:12,initiation:9,mobility:3}, window:{fight:18,pressure:15}, actions:{FIGHT:16,PRESSURE:15,CONNECT:8}, recommendation:'Hunt an isolated support inside the web network and force reactions away from the next objective.' }),
      makeSpike(condition, 'broodmother', { id:'bkb', name:'BKB siege permission', priority:88, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:21, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:220, requires:[{type:'min_health_pct',value:0.6,message:'Reset before committing to the siege'}], permanent:{survival:18,fight:11}, window:{pressure:18,objective:14,fight:10}, actions:{PRESSURE:18,OBJECTIVE:15,FIGHT:10}, recommendation:'Use BKB to stay on the occupied side of the map and convert the forced response into a tower or Roshan.' }),
      makeSpike(condition, 'broodmother', { id:'orchid_bkb', name:'Protected map-control breakpoint', priority:96, trigger:[['item_owned',getItem(ITEMS,'orchid').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:22, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:360, fadeDurationSec:240, permanent:{fight:16,push:17,survival:15,objective:12}, window:{pressure:22,objective:18}, actions:{PRESSURE:23,OBJECTIVE:19,FIGHT:11}, recommendation:'Split the enemy formation, kill the first isolated defender, and immediately convert the numbers advantage.' })
    ]
  }, benchmark);

  profiles.huskar = makeProfile({
    id: 'huskar',
    displayName: 'Huskar',
    roles: ['Mid', 'Carry'],
    archetypes: ['snowball_core', 'roshan_core', 'sustain_fighter'],
    draftTags: ['sustain', 'early_fight', 'roshan', 'anti_magic'],
    vulnerabilities: ['physical_burst', 'break', 'kite'],
    identity: 'Exploit Armlet and level advantages to force early Roshan and repeated fights before enemy physical damage and break effects scale.',
    basePower: { farm: 45, fight: 82, push: 50, survival: 72, initiation: 54, objective: 79, mobility: 34 },
    stageCurves: {
      early: { fight: 14, survival: 9, objective: 8, farm: -7 },
      mid: { fight: 18, objective: 18, survival: 10, push: 5 },
      late: { fight: -9, survival: -8, objective: -5, mobility: -4 }
    },
    benchmarkPoints: [[5,330,5],[10,420,8],[15,500,12],[20,560,16],[30,620,21],[40,650,25]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Armlet before the first Roshan attempt', defensiveItem: 'BKB or Linken before committing into disables', objectiveTiming: 'Roshan after Armlet with healthy resources and vision' },
    buildPlans: [
      makePlan(ITEMS, 'huskar', { id:'balanced', name:'Armlet snowball', scenarioTags:['balanced','objective_window'], priority:84, itemKeys:['armlet','sange_and_yasha','bkb','satanic'], reasons:['balanced_draft','objective_window'], optional:['assault_cuirass'], situational:['linken'] }),
      makePlan(ITEMS, 'huskar', { id:'control_response', name:'Protected Life Break', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:94, itemKeys:['armlet','bkb','linken','satanic'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['sange_and_yasha'], situational:['assault_cuirass'] }),
      makePlan(ITEMS, 'huskar', { id:'recovery', name:'Durable recovery', scenarioTags:['player_behind','enemy_physical_dps_high'], priority:82, itemKeys:['armlet','sange_and_yasha','satanic'], reasons:['player_behind','enemy_physical_dps_high'], optional:['assault_cuirass'], situational:['bkb'] }),
      makePlan(ITEMS, 'huskar', { id:'objective', name:'Roshan conversion', scenarioTags:['player_ahead','objective_window'], priority:96, itemKeys:['armlet','bkb','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['satanic'], situational:['linken'] })
    ],
    spikes: [
      makeSpike(condition, 'huskar', { id:'level_6', name:'Life Break kill window', priority:76, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1, lateToleranceMin:2.2, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Life Break must be ready'},{type:'min_health_pct',value:0.35,message:'Do not jump from a lethal health threshold'}], permanent:{fight:8,initiation:6}, window:{fight:20,objective:8}, actions:{FIGHT:20,CONNECT:9,OBJECTIVE:7}, recommendation:'Force a clean Life Break target, then turn the kill into ward control or an early Roshan setup.' }),
      makeSpike(condition, 'huskar', { id:'armlet', name:'Armlet sustain breakpoint', priority:90, trigger:[['item_owned',getItem(ITEMS,'armlet').id]], expectedMinute:11, earlyToleranceMin:1.8, lateToleranceMin:3, activeDurationSec:300, fadeDurationSec:180, requires:[{type:'min_health_pct',value:0.4,message:'Stabilize health before starting the objective'}], permanent:{fight:17,survival:15,objective:12}, window:{fight:22,objective:20}, actions:{FIGHT:22,OBJECTIVE:21,PRESSURE:8}, recommendation:'Use Armlet to threaten Roshan and force the enemy to fight before their anti-Huskar tools arrive.' }),
      makeSpike(condition, 'huskar', { id:'bkb', name:'BKB commitment window', priority:94, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:19, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:220, requires:[{type:'ultimate_ready',message:'Life Break should be ready for the commitment'},{type:'min_health_pct',value:0.5,message:'Do not begin the BKB fight at critical health'}], permanent:{fight:18,survival:22}, window:{fight:22,objective:15}, actions:{FIGHT:24,OBJECTIVE:16}, recommendation:'Commit through control with BKB and immediately secure the nearest major objective.' }),
      makeSpike(condition, 'huskar', { id:'armlet_bkb', name:'Armlet plus BKB peak', priority:99, trigger:[['item_owned',getItem(ITEMS,'armlet').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.55,message:'Heal before forcing the peak timing'}], permanent:{fight:22,survival:20,objective:19}, window:{fight:25,objective:23,pressure:12}, actions:{FIGHT:26,OBJECTIVE:24,PRESSURE:12}, recommendation:'This is the main snowball peak: take Roshan, invade the enemy triangle, and shorten the game.' })
    ]
  }, benchmark);

  profiles.meepo = makeProfile({
    id: 'meepo',
    displayName: 'Meepo',
    roles: ['Mid', 'Carry'],
    archetypes: ['level_accelerator', 'multi_unit_core', 'pickoff_core'],
    draftTags: ['flash_farm', 'root_control', 'roshan', 'snowball'],
    vulnerabilities: ['area_control', 'burst', 'save'],
    identity: 'Turn an early level and net-worth lead into isolated pickoffs, Roshan, and map compression before area control catches up.',
    basePower: { farm: 86, fight: 71, push: 69, survival: 42, initiation: 58, objective: 77, mobility: 64 },
    stageCurves: {
      early: { farm: 12, fight: 5, objective: 5 },
      mid: { farm: 15, fight: 18, push: 12, objective: 17, initiation: 10 },
      late: { fight: -12, survival: -14, objective: -5, push: 3 }
    },
    benchmarkPoints: [[5,370,6],[10,510,10],[15,610,14],[20,690,18],[30,760,24],[40,800,28]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Blink before the enemy groups as five', defensiveItem: 'Scepter, Heart, or Linken according to the main punish', objectiveTiming: 'Roshan after a pickoff with all Meepos healthy' },
    buildPlans: [
      makePlan(ITEMS, 'meepo', { id:'balanced', name:'Blink pickoff scaling', scenarioTags:['balanced'], priority:86, itemKeys:['blink','scepter','skadi','heart'], reasons:['balanced_draft'], optional:['assault_cuirass'], situational:['linken'] }),
      makePlan(ITEMS, 'meepo', { id:'control_response', name:'Anti-catch durability', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:95, itemKeys:['blink','linken','heart','skadi'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['scepter'], situational:['bkb'] }),
      makePlan(ITEMS, 'meepo', { id:'recovery', name:'Farm-first recovery', scenarioTags:['player_behind'], priority:84, itemKeys:['scepter','heart','skadi'], reasons:['player_behind'], optional:['blink'], situational:['assault_cuirass'] }),
      makePlan(ITEMS, 'meepo', { id:'objective', name:'Pickoff into Roshan', scenarioTags:['player_ahead','objective_window'], priority:94, itemKeys:['blink','scepter','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['skadi'], situational:['heart'] })
    ],
    spikes: [
      makeSpike(condition, 'meepo', { id:'level_6', name:'First clone acceleration', priority:72, trigger:[['level_gte',6]], expectedMinute:6.5, earlyToleranceMin:1, lateToleranceMin:2, activeDurationSec:210, fadeDurationSec:150, requires:[{type:'min_health_pct',value:0.65,message:'All units need enough health before invading'}], permanent:{farm:16,fight:6,objective:5}, window:{farm:18,pressure:9}, actions:{FARM:18,PRESSURE:9}, recommendation:'Use the additional unit to accelerate camps and threaten the first support rotation without splitting into unsafe areas.' }),
      makeSpike(condition, 'meepo', { id:'blink', name:'Blink net pickoff timing', priority:90, trigger:[['item_owned',getItem(ITEMS,'blink').id]], expectedMinute:13, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, requires:[{type:'min_health_pct',value:0.7,message:'Do not start the pickoff with a damaged Meepo'}], permanent:{fight:14,initiation:20,mobility:10}, window:{fight:22,objective:12}, actions:{FIGHT:22,CONNECT:14,OBJECTIVE:11}, recommendation:'Smoke or play from fog, burst one isolated hero, and convert immediately before the enemy groups.' }),
      makeSpike(condition, 'meepo', { id:'scepter', name:'Scepter durability breakpoint', priority:86, trigger:[['item_owned',getItem(ITEMS,'scepter').id]], expectedMinute:18, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:210, permanent:{survival:18,fight:12,farm:5}, window:{fight:16,objective:14}, actions:{FIGHT:16,OBJECTIVE:14}, recommendation:'Use the durability increase to take longer fights only when every unit can enter together.' }),
      makeSpike(condition, 'meepo', { id:'blink_scepter', name:'Blink plus Scepter map compression', priority:98, trigger:[['item_owned',getItem(ITEMS,'blink').id],['item_owned',getItem(ITEMS,'scepter').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.75,message:'Reset every Meepo before the decisive move'}], permanent:{fight:20,initiation:20,survival:16,objective:18}, window:{fight:24,objective:22,pressure:15}, actions:{FIGHT:24,OBJECTIVE:23,PRESSURE:15}, recommendation:'Collapse the playable map: pick off the first hero outside formation, then secure Roshan or high ground vision.' })
    ]
  }, benchmark);

  profiles.pugna = makeProfile({
    id: 'pugna',
    displayName: 'Pugna',
    roles: ['Mid', 'Support'],
    archetypes: ['magic_pusher', 'save_core', 'tempo_caster'],
    draftTags: ['magic_burst', 'push', 'save', 'anti_attack'],
    vulnerabilities: ['burst', 'silence', 'gap_close'],
    identity: 'Use early spell damage and Nether Blast pressure to take outer towers while preserving Life Drain as damage or save.',
    basePower: { farm: 59, fight: 68, push: 81, survival: 44, initiation: 30, objective: 67, mobility: 41 },
    stageCurves: {
      early: { fight: 9, push: 13, farm: 4 },
      mid: { fight: 15, push: 18, objective: 14, survival: 4 },
      late: { fight: -3, push: 6, survival: -6, objective: 3 }
    },
    benchmarkPoints: [[5,345,5],[10,445,8],[15,520,12],[20,580,16],[30,640,21],[40,675,25]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Cast-range or Scepter before the second tower cycle', defensiveItem: 'BKB, Eul, or Linken against silence and gap close', objectiveTiming: 'push after enemy wave clear or catch is unavailable' },
    buildPlans: [
      makePlan(ITEMS, 'pugna', { id:'balanced', name:'Cast range into tower pressure', scenarioTags:['balanced'], priority:80, itemKeys:['aether_lens','scepter','bkb'], reasons:['balanced_draft'], optional:['refresher'], situational:['linken'] }),
      makePlan(ITEMS, 'pugna', { id:'control_response', name:'Anti-silence survival', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:94, itemKeys:['euls','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens'], situational:['scepter'] }),
      makePlan(ITEMS, 'pugna', { id:'recovery', name:'Low-risk cast recovery', scenarioTags:['player_behind'], priority:82, itemKeys:['aether_lens','euls','scepter'], reasons:['player_behind'], optional:['bkb'], situational:['linken'] }),
      makePlan(ITEMS, 'pugna', { id:'objective', name:'Nether Blast conversion', scenarioTags:['player_ahead','objective_window'], priority:91, itemKeys:['scepter','bkb','refresher'], reasons:['player_ahead','objective_window'], optional:['aether_lens'], situational:['linken'] })
    ],
    spikes: [
      makeSpike(condition, 'pugna', { id:'level_6', name:'Life Drain sustain window', priority:68, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Life Drain must be ready'},{type:'min_mana_pct',value:0.45,message:'Restore mana before forcing the drain fight'}], permanent:{fight:7,survival:5}, window:{fight:15,push:10}, actions:{FIGHT:14,PRESSURE:11}, recommendation:'Win the first extended fight with Life Drain and use the surviving wave to damage the tower.' }),
      makeSpike(condition, 'pugna', { id:'aether_lens', name:'Safe cast-range breakpoint', priority:78, trigger:[['item_owned',getItem(ITEMS,'aether_lens').id]], expectedMinute:12, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, requires:[{type:'min_mana_pct',value:0.4,message:'Do not start the tower cycle without spell mana'}], permanent:{fight:8,push:10,survival:7}, window:{pressure:16,fight:10}, actions:{PRESSURE:17,FIGHT:10}, recommendation:'Play outside the first disable range and repeat Blast pressure instead of walking into the tower.' }),
      makeSpike(condition, 'pugna', { id:'scepter', name:'Scepter drain conversion', priority:89, trigger:[['item_owned',getItem(ITEMS,'scepter').id]], expectedMinute:18, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:210, requires:[{type:'min_mana_pct',value:0.55,message:'Scepter is not a fight window without enough mana'}], permanent:{fight:16,survival:10,objective:8}, window:{fight:20,objective:12}, actions:{FIGHT:20,OBJECTIVE:12}, recommendation:'Take an extended fight around Life Drain, then keep the healthy core on the map for the objective.' }),
      makeSpike(condition, 'pugna', { id:'scepter_bkb', name:'Protected channel breakpoint', priority:96, trigger:[['item_owned',getItem(ITEMS,'scepter').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:23, earlyToleranceMin:2.5, lateToleranceMin:4.5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'ultimate_ready',message:'Life Drain must be ready'},{type:'min_mana_pct',value:0.6,message:'Refill mana before the protected channel fight'}], permanent:{fight:20,survival:20,push:10,objective:10}, window:{fight:24,pressure:17,objective:16}, actions:{FIGHT:24,PRESSURE:17,OBJECTIVE:16}, recommendation:'Use BKB to complete the decisive drain channel, then convert the won fight into buildings.' })
    ]
  }, benchmark);

  profiles.shadow_fiend = makeProfile({
    id: 'shadow_fiend',
    displayName: 'Shadow Fiend',
    roles: ['Mid', 'Carry'],
    archetypes: ['lane_dominator', 'flash_farmer', 'physical_tempo_core'],
    draftTags: ['burst', 'right_click', 'tower_damage', 'fear'],
    vulnerabilities: ['control', 'burst', 'gap_close'],
    identity: 'Translate lane souls and fast farming into either protected physical damage or a fog-based Requiem initiation.',
    basePower: { farm: 82, fight: 71, push: 69, survival: 39, initiation: 45, objective: 68, mobility: 36 },
    stageCurves: {
      early: { farm: 12, fight: 9, push: 5, survival: -5 },
      mid: { farm: 15, fight: 16, push: 13, objective: 12 },
      late: { fight: 10, push: 8, survival: -4, objective: 8 }
    },
    benchmarkPoints: [[5,380,6],[10,510,9],[15,600,13],[20,675,17],[30,740,23],[40,780,27]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'first mobility or range item before the enemy groups', defensiveItem: 'BKB before standing in the center of a fight', objectiveTiming: 'tower or Roshan after winning the first BKB fight' },
    buildPlans: [
      makePlan(ITEMS, 'shadow_fiend', { id:'balanced', name:'Protected physical tempo', scenarioTags:['balanced'], priority:84, itemKeys:['dragon_lance','bkb','daedalus','satanic'], reasons:['balanced_draft'], optional:['butterfly'], situational:['linken'] }),
      makePlan(ITEMS, 'shadow_fiend', { id:'control_response', name:'BKB against hard catch', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:96, itemKeys:['dragon_lance','bkb','linken','daedalus'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['satanic'], situational:['hurricane_pike'] }),
      makePlan(ITEMS, 'shadow_fiend', { id:'recovery', name:'Farm back into protected damage', scenarioTags:['player_behind'], priority:82, itemKeys:['maelstrom','dragon_lance','bkb','satanic'], reasons:['player_behind'], optional:['daedalus'], situational:['linken'] }),
      makePlan(ITEMS, 'shadow_fiend', { id:'objective', name:'Fog Requiem conversion', scenarioTags:['player_ahead','objective_window'], priority:92, itemKeys:['shadow_blade','bkb','daedalus'], reasons:['player_ahead','objective_window'], optional:['satanic'], situational:['hurricane_pike'] })
    ],
    spikes: [
      makeSpike(condition, 'shadow_fiend', { id:'level_6', name:'Requiem threat', priority:72, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1, lateToleranceMin:2.2, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Requiem must be ready'},{type:'min_mana_pct',value:0.5,message:'Keep enough mana for Requiem and follow-up razes'}], permanent:{fight:8,initiation:4}, window:{fight:18,pressure:8}, actions:{FIGHT:17,PRESSURE:8}, recommendation:'Threaten Requiem from fog or allied control; do not walk into the center without setup.' }),
      makeSpike(condition, 'shadow_fiend', { id:'shadow_blade', name:'Shadow Blade Requiem setup', priority:88, trigger:[['item_owned',getItem(ITEMS,'shadow_blade').id]], expectedMinute:15, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, requires:[{type:'ultimate_ready',message:'Requiem must be ready for the invisibility setup'},{type:'min_mana_pct',value:0.55,message:'Restore mana before looking for the pickoff'}], permanent:{initiation:17,mobility:9,fight:10}, window:{fight:22,pressure:10}, actions:{FIGHT:21,CONNECT:12,PRESSURE:8}, recommendation:'Approach from an unwarded angle, secure the first burst kill, and leave before the counter-initiation.' }),
      makeSpike(condition, 'shadow_fiend', { id:'bkb', name:'BKB damage uptime', priority:92, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:220, requires:[{type:'min_health_pct',value:0.65,message:'Reset before using the BKB timing'}], permanent:{fight:18,survival:21,objective:8}, window:{fight:22,objective:14}, actions:{FIGHT:23,OBJECTIVE:14}, recommendation:'Use BKB for uninterrupted right-click uptime and convert the won fight into Roshan or a tower.' }),
      makeSpike(condition, 'shadow_fiend', { id:'bkb_daedalus', name:'BKB plus Daedalus high-ground damage', priority:98, trigger:[['item_owned',getItem(ITEMS,'bkb').id],['item_owned',getItem(ITEMS,'daedalus').id]], expectedMinute:27, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.7,message:'Do not begin the decisive damage window while chipped'}], permanent:{fight:23,push:18,survival:17,objective:15}, window:{fight:25,pressure:20,objective:18}, actions:{FIGHT:25,PRESSURE:20,OBJECTIVE:18}, recommendation:'Hit from behind the frontline, preserve BKB for the enemy commit, and use the damage lead to break high ground.' })
    ]
  }, benchmark);

  profiles.sniper = makeProfile({
    id: 'sniper',
    displayName: 'Sniper',
    roles: ['Mid', 'Carry'],
    archetypes: ['backline_carry', 'high_ground_defender', 'range_scaler'],
    draftTags: ['ranged_core', 'high_ground', 'physical_damage', 'siege'],
    vulnerabilities: ['gap_close', 'control', 'burst'],
    identity: 'Deal sustained damage from protected range; every plan is built around surviving the first gap close rather than starting the fight.',
    basePower: { farm: 72, fight: 70, push: 67, survival: 31, initiation: 12, objective: 62, mobility: 24 },
    stageCurves: {
      early: { farm: 5, fight: 2, survival: -8 },
      mid: { farm: 11, fight: 12, push: 9, survival: -5 },
      late: { fight: 22, push: 17, objective: 13, survival: -4 }
    },
    benchmarkPoints: [[5,350,5],[10,470,8],[15,555,12],[20,625,16],[30,700,22],[40,750,26]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Dragon Lance before grouped fights', defensiveItem: 'Pike, BKB, or Linken before the first reliable dive', objectiveTiming: 'siege only with vision and a frontline between Sniper and the enemy' },
    buildPlans: [
      makePlan(ITEMS, 'sniper', { id:'balanced', name:'Range and farming progression', scenarioTags:['balanced'], priority:82, itemKeys:['dragon_lance','maelstrom','hurricane_pike','daedalus'], reasons:['balanced_draft'], optional:['satanic'], situational:['bkb'] }),
      makePlan(ITEMS, 'sniper', { id:'control_response', name:'Anti-dive protection', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:98, itemKeys:['dragon_lance','hurricane_pike','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['satanic'], situational:['butterfly'] }),
      makePlan(ITEMS, 'sniper', { id:'recovery', name:'Safe ranged recovery', scenarioTags:['player_behind'], priority:84, itemKeys:['maelstrom','dragon_lance','hurricane_pike','bkb'], reasons:['player_behind'], optional:['satanic'], situational:['linken'] }),
      makePlan(ITEMS, 'sniper', { id:'objective', name:'Protected high-ground damage', scenarioTags:['player_ahead','objective_window'], priority:90, itemKeys:['dragon_lance','daedalus','satanic','butterfly'], reasons:['player_ahead','objective_window'], optional:['hurricane_pike'], situational:['bkb'] })
    ],
    spikes: [
      makeSpike(condition, 'sniper', { id:'level_6', name:'Assassinate finishing threat', priority:58, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1.2, lateToleranceMin:2.5, activeDurationSec:150, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Assassinate must be ready'},{type:'min_mana_pct',value:0.4,message:'Keep mana for Assassinate and one defensive spell cycle'}], permanent:{fight:5}, window:{fight:9,connect:7}, actions:{FIGHT:7,CONNECT:8}, recommendation:'Finish a retreating target from safe range; do not step forward merely to create an Assassinate angle.' }),
      makeSpike(condition, 'sniper', { id:'dragon_lance', name:'Dragon Lance safe range', priority:76, trigger:[['item_owned',getItem(ITEMS,'dragon_lance').id]], expectedMinute:12, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, permanent:{fight:10,survival:8,push:8}, window:{fight:12,pressure:10}, actions:{FIGHT:10,PRESSURE:11}, recommendation:'Use the extra range to hit while remaining behind the frontline; never convert range into unnecessary proximity.' }),
      makeSpike(condition, 'sniper', { id:'hurricane_pike', name:'Hurricane Pike anti-dive window', priority:91, trigger:[['item_owned',getItem(ITEMS,'hurricane_pike').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:330, fadeDurationSec:220, requires:[{type:'min_health_pct',value:0.65,message:'Heal before taking the protected damage position'}], permanent:{survival:20,mobility:13,fight:11}, window:{fight:18,pressure:12}, actions:{FIGHT:16,PRESSURE:12,RESET:-4}, recommendation:'Hold Pike for the first diver and continue dealing damage only after distance is restored.' }),
      makeSpike(condition, 'sniper', { id:'pike_bkb', name:'Pike plus BKB protected carry window', priority:98, trigger:[['item_owned',getItem(ITEMS,'hurricane_pike').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:26, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.75,message:'Enter the decisive fight at high health'}], permanent:{fight:22,survival:25,push:13,objective:12}, window:{fight:24,pressure:18,objective:15}, actions:{FIGHT:22,PRESSURE:18,OBJECTIVE:15}, recommendation:'Take a protected backline position, survive the first jump with Pike or BKB, then maintain uninterrupted damage.' })
    ]
  }, benchmark);

  profiles.tinker = makeProfile({
    id: 'tinker',
    displayName: 'Tinker',
    roles: ['Mid'],
    archetypes: ['map_caster', 'high_apm_core', 'split_defender'],
    draftTags: ['global_pressure', 'magic_burst', 'wave_clear', 'high_ground'],
    vulnerabilities: ['silence', 'instant_catch', 'vision'],
    identity: 'Reach Boots of Travel and Blink, then pressure waves and join only from hidden angles with enough mana for the full spell cycle.',
    basePower: { farm: 78, fight: 67, push: 74, survival: 35, initiation: 32, objective: 42, mobility: 88 },
    stageCurves: {
      early: { farm: 1, fight: -5, mobility: -12 },
      mid: { farm: 18, fight: 15, push: 17, mobility: 22 },
      late: { fight: 13, push: 16, survival: -8, mobility: 12 }
    },
    benchmarkPoints: [[5,350,5],[10,465,8],[15,560,12],[20,640,16],[30,710,22],[40,755,26]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Boots of Travel followed by Blink', defensiveItem: 'BKB, Eul, or Linken against instant catch', objectiveTiming: 'join after waves are pushed and the first enemy catch spell is shown' },
    buildPlans: [
      makePlan(ITEMS, 'tinker', { id:'balanced', name:'Travel and Blink map engine', scenarioTags:['balanced'], priority:88, itemKeys:['travel_boots','blink','scepter','bkb'], reasons:['balanced_draft'], optional:['dagon'], situational:['linken'] }),
      makePlan(ITEMS, 'tinker', { id:'control_response', name:'Anti-catch spell cycle', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99, itemKeys:['travel_boots','blink','euls','bkb'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['linken'], situational:['scepter'] }),
      makePlan(ITEMS, 'tinker', { id:'recovery', name:'Wave-clear recovery', scenarioTags:['player_behind'], priority:86, itemKeys:['travel_boots','blink','scepter'], reasons:['player_behind'], optional:['euls'], situational:['bkb'] }),
      makePlan(ITEMS, 'tinker', { id:'objective', name:'Burst after map control', scenarioTags:['player_ahead','objective_window'], priority:93, itemKeys:['travel_boots','blink','dagon','scepter'], reasons:['player_ahead','objective_window'], optional:['bkb'], situational:['linken'] })
    ],
    spikes: [
      makeSpike(condition, 'tinker', { id:'level_6', name:'Rearm spell-cycle unlock', priority:63, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1, lateToleranceMin:2.3, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Rearm must be ready'},{type:'min_mana_pct',value:0.6,message:'A low-mana Rearm cycle is not a fight window'}], permanent:{farm:8,fight:5}, window:{farm:12,fight:7}, actions:{FARM:13,FIGHT:6}, recommendation:'Use Rearm to accelerate farm and lane control; avoid committing before the mobility items are ready.' }),
      makeSpike(condition, 'tinker', { id:'travel_boots', name:'Boots of Travel map access', priority:84, trigger:[['item_owned',getItem(ITEMS,'travel_boots').id]], expectedMinute:11, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:360, fadeDurationSec:210, requires:[{type:'min_mana_pct',value:0.55,message:'Refill mana before starting the map cycle'}], permanent:{farm:18,push:17,mobility:24}, window:{farm:18,pressure:15}, actions:{FARM:18,PRESSURE:16}, recommendation:'Push the dangerous wave remotely and preserve your physical position until Blink is complete.' }),
      makeSpike(condition, 'tinker', { id:'travel_blink', name:'Travel plus Blink hidden-angle timing', priority:96, trigger:[['item_owned',getItem(ITEMS,'travel_boots').id],['item_owned',getItem(ITEMS,'blink').id]], expectedMinute:16, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_mana_pct',value:0.65,message:'Join only with mana for multiple cycles'},{type:'min_health_pct',value:0.7,message:'Do not reveal from a chipped position'}], permanent:{fight:18,mobility:28,survival:9,push:12}, window:{fight:22,pressure:18}, actions:{FIGHT:20,PRESSURE:19,CONNECT:14}, recommendation:'Enter from fog after the enemy shows catch, complete the spell cycle, and Blink to the next hidden angle.' }),
      makeSpike(condition, 'tinker', { id:'blink_bkb', name:'Protected spell-cycle breakpoint', priority:99, trigger:[['item_owned',getItem(ITEMS,'blink').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:24, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_mana_pct',value:0.7,message:'BKB does not replace the mana required for repeated cycles'}], permanent:{fight:22,survival:24,mobility:18}, window:{fight:25,objective:10}, actions:{FIGHT:24,CONNECT:15,OBJECTIVE:9}, recommendation:'Use BKB only when instant catch would stop the decisive cycle; remain off vision between casts.' })
    ]
  }, benchmark);

  profiles.viper = makeProfile({
    id: 'viper',
    displayName: 'Viper',
    roles: ['Mid', 'Offlane'],
    archetypes: ['lane_dominator', 'frontline_ranged_core', 'anti_passive_core'],
    draftTags: ['lane_pressure', 'break', 'slow', 'frontline'],
    vulnerabilities: ['kite', 'burst', 'mobility'],
    identity: 'Convert lane dominance into early towers and front-to-back fights before limited mobility becomes a larger problem.',
    basePower: { farm: 55, fight: 78, push: 66, survival: 67, initiation: 34, objective: 69, mobility: 25 },
    stageCurves: {
      early: { fight: 15, push: 10, survival: 8, farm: 2 },
      mid: { fight: 16, push: 12, objective: 14, survival: 7 },
      late: { fight: -5, mobility: -8, survival: -3, push: 3 }
    },
    benchmarkPoints: [[5,345,5],[10,445,8],[15,520,12],[20,580,16],[30,635,21],[40,670,25]],
    benchmarkContract: { levelTiming: 6, keyItemTiming: 'Dragon Lance or durability before grouped pressure', defensiveItem: 'BKB or Linken before walking into layered control', objectiveTiming: 'take outer towers while the lane advantage is still active' },
    buildPlans: [
      makePlan(ITEMS, 'viper', { id:'balanced', name:'Ranged frontline pressure', scenarioTags:['balanced'], priority:84, itemKeys:['dragon_lance','hurricane_pike','bkb','skadi'], reasons:['balanced_draft'], optional:['satanic'], situational:['linken'] }),
      makePlan(ITEMS, 'viper', { id:'control_response', name:'Protected front-to-back fight', scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:96, itemKeys:['dragon_lance','bkb','linken'], reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['hurricane_pike'], situational:['sange_and_yasha'] }),
      makePlan(ITEMS, 'viper', { id:'recovery', name:'Durable recovery', scenarioTags:['player_behind','enemy_physical_dps_high'], priority:84, itemKeys:['sange_and_yasha','bkb','satanic'], reasons:['player_behind','enemy_physical_dps_high'], optional:['butterfly'], situational:['hurricane_pike'] }),
      makePlan(ITEMS, 'viper', { id:'objective', name:'Early tower conversion', scenarioTags:['player_ahead','objective_window'], priority:93, itemKeys:['dragon_lance','bkb','assault_cuirass'], reasons:['player_ahead','objective_window'], optional:['skadi'], situational:['hurricane_pike'] })
    ],
    spikes: [
      makeSpike(condition, 'viper', { id:'level_6', name:'Viper Strike lane conversion', priority:70, trigger:[['level_gte',6]], expectedMinute:7, earlyToleranceMin:1, lateToleranceMin:2.3, activeDurationSec:180, fadeDurationSec:120, requires:[{type:'ultimate_ready',message:'Viper Strike must be ready'},{type:'min_mana_pct',value:0.45,message:'Keep mana for the full slowing sequence'}], permanent:{fight:8,initiation:4}, window:{fight:17,pressure:10}, actions:{FIGHT:17,PRESSURE:10}, recommendation:'Force the lane defender out with Viper Strike and immediately damage the nearby tower or invade the closest camp.' }),
      makeSpike(condition, 'viper', { id:'dragon_lance', name:'Dragon Lance pressure range', priority:78, trigger:[['item_owned',getItem(ITEMS,'dragon_lance').id]], expectedMinute:12, earlyToleranceMin:2, lateToleranceMin:3.5, activeDurationSec:300, fadeDurationSec:180, permanent:{fight:10,push:10,survival:6}, window:{pressure:16,fight:12}, actions:{PRESSURE:17,FIGHT:12}, recommendation:'Stand in front of the tower while preserving attack range; force the enemy to commit into your slowing field.' }),
      makeSpike(condition, 'viper', { id:'bkb', name:'BKB frontline permission', priority:91, trigger:[['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:20, earlyToleranceMin:2.5, lateToleranceMin:4, activeDurationSec:300, fadeDurationSec:220, requires:[{type:'min_health_pct',value:0.65,message:'Heal before taking the frontline position'}], permanent:{fight:18,survival:22,objective:9}, window:{fight:21,objective:14}, actions:{FIGHT:22,OBJECTIVE:14}, recommendation:'Use BKB to hold ground in a front-to-back fight, not to chase beyond your team.' }),
      makeSpike(condition, 'viper', { id:'pike_bkb', name:'Pike plus BKB positioning breakpoint', priority:97, trigger:[['item_owned',getItem(ITEMS,'hurricane_pike').id],['item_owned',getItem(ITEMS,'bkb').id]], expectedMinute:25, earlyToleranceMin:3, lateToleranceMin:5, activeDurationSec:360, fadeDurationSec:240, requires:[{type:'min_health_pct',value:0.7,message:'Start the objective fight with enough health to hold ground'}], permanent:{fight:21,survival:24,mobility:12,push:10}, window:{fight:24,pressure:16,objective:16}, actions:{FIGHT:24,PRESSURE:16,OBJECTIVE:16}, recommendation:'Use Pike to correct positioning and BKB to hold the chosen area; do not turn the fight into a long chase.' })
    ]
  }, benchmark);

  return profiles;
}
