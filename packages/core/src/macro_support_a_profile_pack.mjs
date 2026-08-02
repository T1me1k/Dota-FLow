import { createExplicitProfilePack } from './explicit-profile-pack.mjs';

const CALIBRATION = Object.freeze({
  calibrationVersion: 'prototype-7.41-macro-support-a-v2',
  calibrationSource: 'hero-specific macro and teamfight support strategic review; live recordings pending',
  calibrationConfidence: 0.70,
  patchVersion: '7.41-review-required',
  patchReviewRequired: true
});

const DEFINITIONS = [
  {
    id: 'chen', displayName: 'Chen', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['controlled_unit_commander','early_objective_support','global_sustain'],
    draftTags: ['summons','early_push','global_save','aura'],
    vulnerabilities: ['area_damage','creep_clear','late_scaling'],
    identity: 'Use converted units to create an early numbers advantage, sustain the first engagement with Hand of God, and turn every won skirmish into tower or Roshan pressure before the army loses relative value.',
    basePower: { farm:44, fight:72, push:86, survival:56, initiation:63, objective:91, mobility:58 },
    stageCurves: {
      early: { fight:14, push:18, objective:20, mobility:7 },
      mid: { fight:12, push:13, objective:16, survival:8 },
      late: { fight:-8, push:-10, objective:-6, survival:3 }
    },
    benchmarkPoints: [[5,180,4],[10,245,7],[20,325,12],[40,405,20]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Mekansm before the first coordinated tower or Roshan attempt',
      defensiveItem: 'Glimmer, Lotus, or Pipe when the army and backline are erased by burst',
      objectiveTiming: 'immediately after a creep-assisted kill or Hand of God wins the first exchange'
    },
    plans: [
      {
        id:'aura_objective', name:'Early aura objective army',
        scenarioTags:['balanced','objective_window'], priority:96,
        items:['arcane_boots','mekansm','vladmir','guardian_greaves'],
        reasons:['balanced_draft','objective_window'], optional:['solar_crest']
      },
      {
        id:'control_response', name:'Protected global sustain',
        scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99,
        items:['arcane_boots','mekansm','glimmer_cape','lotus_orb'],
        reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['pipe']
      },
      {
        id:'recovery', name:'Low-economy army recovery',
        scenarioTags:['player_behind'], priority:88,
        items:['tranquil_boots','mekansm','drums','glimmer_cape'],
        reasons:['player_behind'], optional:['vladmir']
      },
      {
        id:'siege_conversion', name:'Creep army siege conversion',
        scenarioTags:['player_ahead','team_lacks_push'], priority:97,
        items:['arcane_boots','vladmir','solar_crest','guardian_greaves'],
        reasons:['player_ahead','team_lacks_push'], optional:['pipe']
      }
    ],
    spikes: [
      {
        id:'level_3', name:'First controlled-unit pressure',
        priority:74, trigger:[['level_gte',3]], expectedMinute:3,
        requires:[{type:'min_mana_pct',value:0.35,message:'Keep mana to control and sustain the first creep rotation'}],
        permanent:{push:10,objective:9,mobility:5}, window:{pressure:18,objective:15,connect:10},
        actions:{PRESSURE:19,OBJECTIVE:16,CONNECT:11},
        recommendation:'Bring a useful neutral creep to the contested lane, force a support rotation, and hit the nearby tower only while the army remains healthy.'
      },
      {
        id:'level_6', name:'Hand of God global sustain',
        priority:86, trigger:[['level_gte',6]], expectedMinute:8,
        requires:[
          {type:'ultimate_ready',message:'Hand of God must be ready'},
          {type:'min_mana_pct',value:0.55,message:'Preserve mana for the global heal'}
        ],
        permanent:{fight:10,survival:10,objective:7}, window:{fight:22,objective:17,connect:15},
        actions:{FIGHT:23,OBJECTIVE:18,CONNECT:16},
        recommendation:'Take the first coordinated fight with the army already in position, use Hand of God after enemy burst lands, and convert surviving units into an objective.'
      },
      {
        id:'mekansm', name:'Mekansm five-unit timing',
        priority:91, trigger:[['item_owned','mekansm']], expectedMinute:13,
        requires:[{type:'min_mana_pct',value:0.45,message:'Refill before the Mekansm objective fight'}],
        permanent:{fight:15,survival:14,objective:12}, window:{fight:23,objective:24,pressure:15},
        actions:{FIGHT:24,OBJECTIVE:25,PRESSURE:16},
        recommendation:'Group before opponents finish their first major defensive item and force a tower or Roshan fight around the sustain advantage.'
      },
      {
        id:'greaves_vladmir', name:'Sustained army objective breakpoint',
        priority:98, trigger:[['item_owned','guardian_greaves'],['item_owned','vladmir']], expectedMinute:25,
        permanent:{fight:18,push:18,survival:20,objective:25}, window:{objective:28,pressure:21,fight:16},
        actions:{OBJECTIVE:29,PRESSURE:22,FIGHT:17},
        recommendation:'Keep the army together behind vision, heal through the first area damage cycle, and finish the objective before the enemy can reset.'
      }
    ]
  },
  {
    id: 'dark_willow', displayName: 'Dark Willow', role: 'support', roles: ['Soft Support','Hard Support'],
    archetypes: ['area_control_support','burst_followup','fear_counter_initiator'],
    draftTags: ['area_control','fear','magic_burst','counter_initiation'],
    vulnerabilities: ['dispel','magic_immunity','gap_close'],
    identity: 'Layer delayed control where movement is already constrained, punish an isolated target with Bedlam, and hold Terrorize for counter-initiation or displacement rather than spending both ultimates on the first visible hero.',
    basePower: { farm:38, fight:81, push:31, survival:52, initiation:73, objective:43, mobility:59 },
    stageCurves: {
      early: { fight:11, initiation:8, survival:3 },
      mid: { fight:22, initiation:17, mobility:8, objective:4 },
      late: { fight:7, initiation:8, survival:-5, push:-4 }
    },
    benchmarkPoints: [[5,180,4],[10,245,7],[20,320,12],[40,405,20]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: "Eul's or Blink before repeated Bramble and Cursed Crown setups",
      defensiveItem: 'Glimmer or Force Staff when enemy jump reaches the casting position',
      objectiveTiming: 'after Terrorize breaks the enemy formation or Bedlam removes one defender'
    },
    plans: [
      {
        id:'euls_control', name:'Eul control layering',
        scenarioTags:['balanced','team_lacks_control'], priority:93,
        items:['tranquil_boots','euls','aether_lens','blink'],
        reasons:['balanced_draft','team_lacks_control'], optional:['scepter']
      },
      {
        id:'control_response', name:'Protected counter-initiation',
        scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99,
        items:['tranquil_boots','glimmer_cape','force_staff','lotus_orb'],
        reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['euls']
      },
      {
        id:'recovery', name:'Low-economy zone control',
        scenarioTags:['player_behind'], priority:87,
        items:['tranquil_boots','force_staff','glimmer_cape','euls'],
        reasons:['player_behind'], optional:['aether_lens']
      },
      {
        id:'blink_teamfight', name:'Blink fear and burst conversion',
        scenarioTags:['objective_window','player_ahead'], priority:95,
        items:['tranquil_boots','blink','scepter','octarine_core'],
        reasons:['objective_window','player_ahead'], optional:['aether_lens']
      }
    ],
    spikes: [
      {
        id:'level_6', name:'Bedlam and Terrorize decision window',
        priority:84, trigger:[['level_gte',6]], expectedMinute:9,
        requires:[
          {type:'ultimate_ready',message:'An ultimate must be ready for the commitment'},
          {type:'min_mana_pct',value:0.58,message:'Keep mana for control plus the chosen ultimate'}
        ],
        permanent:{fight:12,initiation:9}, window:{fight:24,connect:15},
        actions:{FIGHT:25,CONNECT:16},
        recommendation:'Use Bedlam only on an isolated target; keep Terrorize for the enemy response or use it first to split the formation.'
      },
      {
        id:'euls', name:'Reliable delayed-control setup',
        priority:88, trigger:[['item_owned','euls']], expectedMinute:15,
        requires:[{type:'min_mana_pct',value:0.45,message:'Refill before the Eul control sequence'}],
        permanent:{fight:13,initiation:16,survival:7}, window:{fight:22,connect:17},
        actions:{FIGHT:23,CONNECT:18},
        recommendation:'Use Eul to align Bramble or delayed control, then disengage if the target receives immediate save support.'
      },
      {
        id:'blink', name:'Hidden Terrorize angle',
        priority:93, trigger:[['item_owned','blink']], expectedMinute:21,
        requires:[
          {type:'ultimate_ready',message:'Terrorize should be ready before revealing Blink'},
          {type:'min_health_pct',value:0.5,message:'Do not hold the counter-initiation angle while already exposed'}
        ],
        permanent:{initiation:20,mobility:15,fight:11}, window:{fight:24,objective:11},
        actions:{FIGHT:25,OBJECTIVE:12},
        recommendation:'Stay off vision until the enemy commits, then fear across the escape path and isolate the hero that cannot retreat with the group.'
      },
      {
        id:'scepter', name:'Scaling Shadow Realm pressure',
        priority:96, trigger:[['item_owned','scepter']], expectedMinute:29,
        requires:[{type:'min_mana_pct',value:0.5,message:'Keep enough mana for control after the damage sequence'}],
        permanent:{fight:22,survival:13,objective:7}, window:{fight:26,objective:13},
        actions:{FIGHT:27,OBJECTIVE:14},
        recommendation:'Attack from protected range while preserving control for the enemy jump; do not trade the casting position for low-value damage.'
      }
    ]
  },
  {
    id: 'enchantress', displayName: 'Enchantress', role: 'support', roles: ['Soft Support','Offlane'],
    archetypes: ['lane_dominator','controlled_unit_support','ranged_scaler'],
    draftTags: ['lane_pressure','summons','dispel','ranged_damage'],
    vulnerabilities: ['magic_burst','break','gap_close'],
    identity: 'Win the lane through converted-creep pressure and dispel utility, then transition into a hard-to-hit ranged support whose damage matters only while spacing and mana remain intact.',
    basePower: { farm:49, fight:72, push:61, survival:76, initiation:54, objective:62, mobility:57 },
    stageCurves: {
      early: { fight:17, push:12, survival:11, objective:8 },
      mid: { fight:13, survival:13, objective:9, mobility:6 },
      late: { fight:14, survival:7, push:3, objective:6 }
    },
    benchmarkPoints: [[5,195,4],[10,270,7],[20,365,13],[40,470,22]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Hurricane Pike before enemy gap close repeatedly reaches attack range',
      defensiveItem: 'Glimmer, Force, or Lotus against magic burst and hard disable',
      objectiveTiming: 'after lane domination or a dispelled defender creates a safe ranged approach'
    },
    plans: [
      {
        id:'lane_scaling', name:'Lane pressure into ranged scaling',
        scenarioTags:['balanced','player_ahead'], priority:92,
        items:['phase_boots','solar_crest','hurricane_pike','scepter'],
        reasons:['balanced_draft','player_ahead'], optional:['bkb']
      },
      {
        id:'control_response', name:'Protected ranged support',
        scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99,
        items:['tranquil_boots','force_staff','glimmer_cape','lotus_orb'],
        reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['hurricane_pike']
      },
      {
        id:'recovery', name:'Low-economy dispel utility',
        scenarioTags:['player_behind'], priority:86,
        items:['tranquil_boots','solar_crest','force_staff','glimmer_cape'],
        reasons:['player_behind'], optional:['hurricane_pike']
      },
      {
        id:'objective', name:'Ranged objective support',
        scenarioTags:['objective_window','team_lacks_push'], priority:94,
        items:['phase_boots','solar_crest','hurricane_pike','vladmir'],
        reasons:['objective_window','team_lacks_push'], optional:['scepter']
      }
    ],
    spikes: [
      {
        id:'level_3', name:'Converted-creep lane takeover',
        priority:75, trigger:[['level_gte',3]], expectedMinute:3,
        requires:[{type:'min_mana_pct',value:0.35,message:'Keep mana for Enchant and lane sustain'}],
        permanent:{fight:8,push:9,objective:5}, window:{pressure:20,connect:8},
        actions:{PRESSURE:21,CONNECT:9},
        recommendation:'Use a useful neutral creep to control the pull and trading area, then damage the tower only after the enemy support is forced away.'
      },
      {
        id:'level_6', name:'Untouchable frontline tolerance',
        priority:82, trigger:[['level_gte',6]], expectedMinute:8,
        requires:[{type:'min_health_pct',value:0.55,message:'Do not overestimate Untouchable while already low'}],
        permanent:{survival:18,fight:8}, window:{fight:18,pressure:12},
        actions:{FIGHT:19,PRESSURE:13},
        recommendation:'Occupy the edge of the fight against attack-based heroes, but retreat from magic burst and save the dispel for the key effect.'
      },
      {
        id:'hurricane_pike', name:'Safe Impetus spacing',
        priority:91, trigger:[['item_owned','hurricane_pike']], expectedMinute:23,
        requires:[
          {type:'min_health_pct',value:0.55,message:'Reset before using Pike as the only escape'},
          {type:'min_mana_pct',value:0.4,message:'Keep mana for sustained ranged pressure'}
        ],
        permanent:{fight:18,survival:17,mobility:13,objective:8}, window:{fight:23,objective:14},
        actions:{FIGHT:24,OBJECTIVE:15},
        recommendation:'Maintain maximum distance, use Pike to break the first gap close, and keep attacking only while the escape route stays open.'
      },
      {
        id:'pike_scepter', name:'Late ranged support breakpoint',
        priority:97, trigger:[['item_owned','hurricane_pike'],['item_owned','scepter']], expectedMinute:32,
        requires:[{type:'min_mana_pct',value:0.5,message:'Refill before a prolonged ranged fight'}],
        permanent:{fight:24,survival:15,objective:12}, window:{fight:27,objective:18},
        actions:{FIGHT:28,OBJECTIVE:19},
        recommendation:'Pressure the nearest safe target from range, preserve the dispel for the decisive effect, and convert the sustained damage into the objective.'
      }
    ]
  },
  {
    id: 'grimstroke', displayName: 'Grimstroke', role: 'support', roles: ['Soft Support','Hard Support'],
    archetypes: ['combo_enabler','silence_support','linked_target_controller'],
    draftTags: ['teamfight_combo','silence','linked_control','wave_clear'],
    vulnerabilities: ['dispel','spread_formation','gap_close'],
    identity: 'Attach Ink Swell to a reliable delivery hero, use Soulbind only when allied single-target spells can exploit it, and treat every fight as a coordination problem rather than a solo damage sequence.',
    basePower: { farm:43, fight:83, push:48, survival:48, initiation:71, objective:49, mobility:46 },
    stageCurves: {
      early: { fight:10, push:7, initiation:6 },
      mid: { fight:24, initiation:17, objective:7 },
      late: { fight:12, initiation:10, survival:-6, objective:4 }
    },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Aether Lens before repeated Soulbind and save-range fights',
      defensiveItem: 'Force or Glimmer when enemy jump reaches the backline',
      objectiveTiming: 'after a Soulbind combo removes two defenders or Ink Swell secures first contact'
    },
    plans: [
      {
        id:'combo_range', name:'Soulbind combo range',
        scenarioTags:['balanced','team_has_single_target_spells'], priority:94,
        items:['arcane_boots','aether_lens','force_staff','scepter'],
        reasons:['balanced_draft','team_has_single_target_spells'], optional:['octarine_core']
      },
      {
        id:'control_response', name:'Protected combo casting',
        scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99,
        items:['arcane_boots','glimmer_cape','force_staff','lotus_orb'],
        reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens']
      },
      {
        id:'recovery', name:'Low-economy Ink Swell utility',
        scenarioTags:['player_behind'], priority:87,
        items:['arcane_boots','force_staff','glimmer_cape','aether_lens'],
        reasons:['player_behind'], optional:['euls']
      },
      {
        id:'objective', name:'Soulbind defender removal',
        scenarioTags:['objective_window','player_ahead'], priority:95,
        items:['arcane_boots','aether_lens','scepter','octarine_core'],
        reasons:['objective_window','player_ahead'], optional:['force_staff']
      }
    ],
    spikes: [
      {
        id:'level_6', name:'Soulbind combo window',
        priority:86, trigger:[['level_gte',6]], expectedMinute:9,
        requires:[
          {type:'ultimate_ready',message:'Soulbind must be ready'},
          {type:'min_mana_pct',value:0.58,message:'Keep mana for Soulbind and the follow-up spell'}
        ],
        permanent:{fight:13,initiation:10}, window:{fight:25,connect:18},
        actions:{FIGHT:26,CONNECT:19},
        recommendation:'Bind two reachable heroes only when an ally can immediately duplicate a valuable single-target spell; otherwise keep the ultimate for the next formation.'
      },
      {
        id:'aether_lens', name:'Safe combo-cast range',
        priority:87, trigger:[['item_owned','aether_lens']], expectedMinute:15,
        permanent:{fight:11,survival:10,initiation:9}, window:{fight:18,connect:13},
        actions:{FIGHT:19,CONNECT:14},
        recommendation:'Cast Ink Swell and Soulbind from outside the first jump radius, then reposition instead of following the delivery hero into danger.'
      },
      {
        id:'scepter', name:'Expanded linked-fight pressure',
        priority:94, trigger:[['item_owned','scepter']], expectedMinute:25,
        requires:[{type:'min_mana_pct',value:0.52,message:'Refill before the extended combo sequence'}],
        permanent:{fight:21,initiation:13,objective:8}, window:{fight:25,objective:13},
        actions:{FIGHT:26,OBJECTIVE:14},
        recommendation:'Use the upgraded fight tools after Soulbind fixes the formation and preserve silence for the hero that can break the combo.'
      },
      {
        id:'scepter_octarine', name:'Repeated teamfight control',
        priority:98, trigger:[['item_owned','scepter'],['item_owned','octarine_core']], expectedMinute:34,
        requires:[
          {type:'ultimate_ready',message:'Soulbind should be ready before the major objective fight'},
          {type:'min_mana_pct',value:0.65,message:'Enter with mana for repeated casts'}
        ],
        permanent:{fight:25,initiation:18,objective:14}, window:{fight:28,objective:20},
        actions:{FIGHT:29,OBJECTIVE:21},
        recommendation:'Take a long fight around vision, link the correct pair, and cycle silence and Ink Swell without exposing the backline.'
      }
    ]
  },
  {
    id: 'keeper_of_the_light', displayName: 'Keeper of the Light', role: 'support', roles: ['Soft Support','Hard Support'],
    archetypes: ['wave_control_support','mana_enabler','global_mobility_support'],
    draftTags: ['wave_clear','mana_sustain','global_mobility','teamfight_zone'],
    vulnerabilities: ['gap_close','silence','vision_loss'],
    identity: 'Control distant waves with Illuminate, refill the ally whose spell cycle matters most, and use Spirit Form mobility to create a temporary numbers advantage without abandoning the team to a forced fight.',
    basePower: { farm:61, fight:68, push:67, survival:50, initiation:49, objective:57, mobility:87 },
    stageCurves: {
      early: { farm:14, push:12, mobility:8, fight:4 },
      mid: { fight:14, push:15, mobility:19, objective:10 },
      late: { fight:7, push:12, mobility:13, survival:-5 }
    },
    benchmarkPoints: [[5,195,4],[10,275,7],[20,380,13],[40,485,21]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Force Staff and Aether Lens before contested mid-game objectives',
      defensiveItem: 'Glimmer or Lotus when gap close and silence punish the backline',
      objectiveTiming: 'after a distant wave is cleared and the team can arrive with full mana'
    },
    plans: [
      {
        id:'wave_mobility', name:'Wave control and mobility',
        scenarioTags:['balanced','split_push_required'], priority:93,
        items:['tranquil_boots','force_staff','aether_lens','octarine_core'],
        reasons:['balanced_draft','split_push_required'], optional:['travel_boots']
      },
      {
        id:'control_response', name:'Protected backline enable',
        scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99,
        items:['tranquil_boots','glimmer_cape','force_staff','lotus_orb'],
        reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens']
      },
      {
        id:'recovery', name:'Safe wave-cut recovery',
        scenarioTags:['player_behind','split_push_required'], priority:89,
        items:['tranquil_boots','force_staff','glimmer_cape','aether_lens'],
        reasons:['player_behind','split_push_required'], optional:['travel_boots']
      },
      {
        id:'objective', name:'Mana and zone objective setup',
        scenarioTags:['objective_window','player_ahead'], priority:95,
        items:['arcane_boots','solar_crest','guardian_greaves','octarine_core'],
        reasons:['objective_window','player_ahead'], optional:['force_staff']
      }
    ],
    spikes: [
      {
        id:'level_6', name:'Spirit Form map-tempo window',
        priority:82, trigger:[['level_gte',6]], expectedMinute:9,
        requires:[
          {type:'ultimate_ready',message:'Spirit Form must be ready'},
          {type:'min_mana_pct',value:0.55,message:'Keep mana for the full spell cycle'}
        ],
        permanent:{fight:8,push:10,mobility:14}, window:{connect:22,pressure:18,objective:9},
        actions:{CONNECT:23,PRESSURE:19,OBJECTIVE:10},
        recommendation:'Clear the dangerous wave, accelerate the key ally, and join the next fight before the enemy can exploit the temporary split.'
      },
      {
        id:'force_staff', name:'Backline reposition breakpoint',
        priority:85, trigger:[['item_owned','force_staff']], expectedMinute:14,
        permanent:{survival:12,mobility:14,fight:6}, window:{connect:15,fight:13},
        actions:{CONNECT:16,FIGHT:14},
        recommendation:'Hold Force Staff for the first gap close or to preserve the ally carrying the current spell cycle.'
      },
      {
        id:'aether_lens', name:'Safe Illuminate and enable range',
        priority:88, trigger:[['item_owned','aether_lens']], expectedMinute:19,
        requires:[{type:'min_mana_pct',value:0.45,message:'Refill before repeated long-range casts'}],
        permanent:{fight:11,push:12,survival:9}, window:{pressure:17,connect:14},
        actions:{PRESSURE:18,CONNECT:15},
        recommendation:'Control the approach from outside vision and keep Chakra Mana on the ally whose cooldown creates the next objective window.'
      },
      {
        id:'octarine_core', name:'Repeated global spell-cycle control',
        priority:97, trigger:[['item_owned','octarine_core']], expectedMinute:31,
        requires:[{type:'min_mana_pct',value:0.65,message:'Enter the objective setup with mana for repeated cycles'}],
        permanent:{fight:19,push:20,mobility:18,objective:14}, window:{objective:22,pressure:20,connect:16},
        actions:{OBJECTIVE:23,PRESSURE:21,CONNECT:17},
        recommendation:'Keep side waves controlled, refill the core repeatedly, and force the objective while the opponent must answer multiple lanes.'
      }
    ]
  },
  {
    id: 'ringmaster', displayName: 'Ringmaster', role: 'support', roles: ['Soft Support','Hard Support'],
    archetypes: ['control_support','timed_save_support','channel_zone_controller'],
    draftTags: ['save','fear','area_control','long_range_disable'],
    vulnerabilities: ['silence','gap_close','channel_interrupt'],
    identity: 'Alternate between a timed ally save and layered area control, channel from protected terrain, and commit the major spectacle only after movement is constrained instead of using it as unsupported initiation.',
    basePower: { farm:39, fight:77, push:36, survival:58, initiation:69, objective:47, mobility:51 },
    stageCurves: {
      early: { fight:9, survival:7, initiation:5 },
      mid: { fight:21, initiation:16, survival:11, objective:6 },
      late: { fight:11, initiation:7, survival:3, objective:4 }
    },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Force Staff or Aether Lens before repeated save and channel fights',
      defensiveItem: 'Glimmer or Lotus when silence and jump prevent protected channels',
      objectiveTiming: 'after the save absorbs first commitment and area control splits the defenders'
    },
    calibration: {
      calibrationConfidence: 0.62,
      calibrationSource: 'conservative Ringmaster strategic model; souvenir and ability-specific telemetry unavailable'
    },
    plans: [
      {
        id:'save_control', name:'Timed save and control range',
        scenarioTags:['balanced','team_lacks_save'], priority:94,
        items:['arcane_boots','force_staff','aether_lens','scepter'],
        reasons:['balanced_draft','team_lacks_save'], optional:['glimmer_cape']
      },
      {
        id:'control_response', name:'Protected channel response',
        scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99,
        items:['arcane_boots','glimmer_cape','force_staff','lotus_orb'],
        reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens']
      },
      {
        id:'recovery', name:'Low-economy save utility',
        scenarioTags:['player_behind'], priority:88,
        items:['arcane_boots','force_staff','glimmer_cape','euls'],
        reasons:['player_behind'], optional:['aether_lens']
      },
      {
        id:'objective', name:'Spectacle zone objective control',
        scenarioTags:['objective_window','player_ahead'], priority:95,
        items:['arcane_boots','aether_lens','scepter','octarine_core'],
        reasons:['objective_window','player_ahead'], optional:['force_staff']
      }
    ],
    spikes: [
      {
        id:'level_6', name:'Major spectacle control window',
        priority:83, trigger:[['level_gte',6]], expectedMinute:9,
        requires:[
          {type:'ultimate_ready',message:'The major control ultimate must be ready'},
          {type:'min_mana_pct',value:0.58,message:'Keep mana for the control and save sequence'}
        ],
        permanent:{fight:11,initiation:10}, window:{fight:23,objective:10},
        actions:{FIGHT:24,OBJECTIVE:11},
        recommendation:'Wait for allied control or a narrow approach, commit the spectacle across the retreat path, and keep the ally save for the counter-jump.'
      },
      {
        id:'force_staff', name:'Save-positioning breakpoint',
        priority:86, trigger:[['item_owned','force_staff']], expectedMinute:15,
        permanent:{survival:14,mobility:12,fight:8}, window:{connect:16,fight:14},
        actions:{CONNECT:17,FIGHT:15},
        recommendation:'Use Force Staff to preserve the ally after the timed save ends or to reach protected terrain for the next channel.'
      },
      {
        id:'aether_lens', name:'Protected control range',
        priority:89, trigger:[['item_owned','aether_lens']], expectedMinute:20,
        requires:[{type:'min_mana_pct',value:0.45,message:'Refill before the layered control sequence'}],
        permanent:{fight:12,survival:10,initiation:11}, window:{fight:20,connect:14},
        actions:{FIGHT:21,CONNECT:15},
        recommendation:'Cast from outside the enemy jump radius and keep the save available until the first real commitment is visible.'
      },
      {
        id:'scepter_octarine', name:'Repeated spectacle and save cycle',
        priority:97, trigger:[['item_owned','scepter'],['item_owned','octarine_core']], expectedMinute:33,
        requires:[
          {type:'ultimate_ready',message:'The major control ultimate should be ready for the objective fight'},
          {type:'min_mana_pct',value:0.65,message:'Enter with mana for repeated control and save casts'}
        ],
        permanent:{fight:24,initiation:17,survival:15,objective:13}, window:{fight:28,objective:20},
        actions:{FIGHT:29,OBJECTIVE:21},
        recommendation:'Take a long fight around vision, alternate control and save windows, and deny the enemy a clean second engagement.'
      }
    ]
  },
  {
    id: 'shadow_demon', displayName: 'Shadow Demon', role: 'support', roles: ['Hard Support','Soft Support'],
    archetypes: ['disruption_save_support','single_target_dispel','stacking_magic_support'],
    draftTags: ['save','dispel','illusion_setup','single_target_control'],
    vulnerabilities: ['gap_close','silence','dispel'],
    identity: 'Use Disruption deliberately as either a save or a setup, build poison only while the target remains safely reachable, and reserve Demonic Purge for the core whose buffs, movement, or immunity timing decides the fight.',
    basePower: { farm:41, fight:82, push:38, survival:51, initiation:72, objective:46, mobility:44 },
    stageCurves: {
      early: { fight:12, initiation:8, push:4 },
      mid: { fight:23, initiation:17, survival:7, objective:5 },
      late: { fight:15, initiation:9, survival:-4, objective:4 }
    },
    benchmarkPoints: [[5,180,4],[10,240,7],[20,315,12],[40,395,20]],
    benchmarkContract: {
      levelTiming: 6,
      keyItemTiming: 'Aether Lens before repeated Disruption and Purge fights',
      defensiveItem: 'Force, Glimmer, or Lotus when the enemy can jump the save position',
      objectiveTiming: 'after Disruption protects the first target or Demonic Purge removes the key defender'
    },
    plans: [
      {
        id:'disruption_range', name:'Disruption and Purge range',
        scenarioTags:['balanced','enemy_buff_dependent'], priority:94,
        items:['arcane_boots','aether_lens','force_staff','scepter'],
        reasons:['balanced_draft','enemy_buff_dependent'], optional:['octarine_core']
      },
      {
        id:'control_response', name:'Protected save position',
        scenarioTags:['enemy_control_high','enemy_magic_burst_high'], priority:99,
        items:['arcane_boots','glimmer_cape','force_staff','lotus_orb'],
        reasons:['enemy_control_high','enemy_magic_burst_high'], optional:['aether_lens']
      },
      {
        id:'recovery', name:'Low-economy save and poison',
        scenarioTags:['player_behind'], priority:87,
        items:['arcane_boots','force_staff','glimmer_cape','aether_lens'],
        reasons:['player_behind'], optional:['euls']
      },
      {
        id:'objective', name:'Purge defender objective control',
        scenarioTags:['objective_window','player_ahead'], priority:95,
        items:['arcane_boots','aether_lens','scepter','refresher'],
        reasons:['objective_window','player_ahead'], optional:['force_staff']
      }
    ],
    spikes: [
      {
        id:'level_6', name:'Demonic Purge control window',
        priority:86, trigger:[['level_gte',6]], expectedMinute:9,
        requires:[
          {type:'ultimate_ready',message:'Demonic Purge must be ready'},
          {type:'min_mana_pct',value:0.58,message:'Keep mana for Purge and Disruption'}
        ],
        permanent:{fight:13,initiation:11}, window:{fight:24,connect:16},
        actions:{FIGHT:25,CONNECT:17},
        recommendation:'Purge the hero whose buffs or mobility create the fight, then use Disruption according to the preselected save-or-setup purpose.'
      },
      {
        id:'aether_lens', name:'Safe Disruption breakpoint',
        priority:88, trigger:[['item_owned','aether_lens']], expectedMinute:15,
        permanent:{fight:11,survival:12,initiation:10}, window:{fight:19,connect:14},
        actions:{FIGHT:20,CONNECT:15},
        recommendation:'Hold the backline angle and cast Disruption without stepping into the enemy initiation radius.'
      },
      {
        id:'scepter', name:'Expanded Purge control',
        priority:95, trigger:[['item_owned','scepter']], expectedMinute:25,
        requires:[
          {type:'ultimate_ready',message:'Demonic Purge should be ready for the priority target'},
          {type:'min_mana_pct',value:0.55,message:'Refill before repeated control casts'}
        ],
        permanent:{fight:22,initiation:17,objective:8}, window:{fight:26,objective:14},
        actions:{FIGHT:27,OBJECTIVE:15},
        recommendation:'Spend the upgraded control on the buffed or mobility-dependent core and keep Disruption for the first counter-initiation.'
      },
      {
        id:'scepter_refresher', name:'Double-purge objective fight',
        priority:99, trigger:[['item_owned','scepter'],['item_owned','refresher']], expectedMinute:34,
        requires:[
          {type:'ultimate_ready',message:'Demonic Purge must be ready before refreshing'},
          {type:'min_mana_pct',value:0.78,message:'Enter with mana for both ultimate and save cycles'}
        ],
        permanent:{fight:27,initiation:20,objective:15}, window:{fight:30,objective:22},
        actions:{FIGHT:31,OBJECTIVE:23},
        recommendation:'Control two separate priority targets or extend one decisive disable sequence, then preserve Disruption for the ally carrying the objective fight.'
      }
    ]
  }
];

export const HERO_IDS = Object.freeze(DEFINITIONS.map((entry) => entry.id));
export function createProfilePack(dependencies) {
  return createExplicitProfilePack(DEFINITIONS, dependencies, CALIBRATION);
}
