const PRESETS = {
  flash_farmer: {
    archetypes: ['flash_farmer', 'late_game_carry'],
    basePower: { farm: 79, fight: 43, push: 60, survival: 48, initiation: 24, objective: 57, mobility: 45 },
    stageCurves: { early: { farm: -5, fight: -7 }, mid: { farm: 13, fight: 9, push: 8 }, late: { fight: 16, survival: 9, objective: 9 } },
    benchmarks: [[5,350,5],[10,470,8],[15,565,12],[20,635,16],[25,690,19],[30,730,22],[40,770,27]]
  },
  illusion: {
    archetypes: ['illusion_carry', 'split_pusher'],
    basePower: { farm: 76, fight: 47, push: 78, survival: 54, initiation: 22, objective: 61, mobility: 55 },
    stageCurves: { early: { fight: -6 }, mid: { farm: 14, push: 17, pressure: 10 }, late: { fight: 15, push: 15, survival: 11 } },
    benchmarks: [[5,345,5],[10,460,8],[15,555,12],[20,625,16],[25,680,19],[30,720,22],[40,760,27]]
  },
  fighting: {
    archetypes: ['fighting_carry', 'tempo_core'],
    basePower: { farm: 58, fight: 72, push: 53, survival: 61, initiation: 44, objective: 59, mobility: 57 },
    stageCurves: { early: { fight: 7 }, mid: { fight: 17, initiation: 8, objective: 8 }, late: { fight: 8, survival: 9 } },
    benchmarks: [[5,335,5],[10,435,8],[15,515,12],[20,580,16],[25,630,19],[30,670,22],[40,710,26]]
  },
  ranged: {
    archetypes: ['ranged_carry', 'siege_core'],
    basePower: { farm: 68, fight: 59, push: 70, survival: 38, initiation: 24, objective: 65, mobility: 40 },
    stageCurves: { early: { fight: -2 }, mid: { farm: 10, fight: 13, push: 12 }, late: { fight: 16, push: 12, objective: 10 } },
    benchmarks: [[5,345,5],[10,455,8],[15,540,12],[20,605,16],[25,660,19],[30,700,22],[40,745,27]]
  },
  pickoff: {
    archetypes: ['pickoff_carry', 'mobile_core'],
    basePower: { farm: 57, fight: 69, push: 51, survival: 52, initiation: 62, objective: 49, mobility: 73 },
    stageCurves: { early: { fight: 5 }, mid: { fight: 16, initiation: 13, pressure: 8 }, late: { fight: 10, survival: 8 } },
    benchmarks: [[5,335,5],[10,435,8],[15,515,12],[20,580,16],[25,630,19],[30,670,22],[40,710,26]]
  },
  durable: {
    archetypes: ['durable_carry', 'frontliner'],
    basePower: { farm: 58, fight: 67, push: 58, survival: 75, initiation: 48, objective: 63, mobility: 38 },
    stageCurves: { early: { survival: 8 }, mid: { fight: 15, survival: 11, objective: 8 }, late: { fight: 11, push: 8 } },
    benchmarks: [[5,335,5],[10,430,8],[15,510,12],[20,575,16],[25,625,19],[30,665,22],[40,705,26]]
  },
  global: {
    archetypes: ['global_carry', 'late_game_carry'],
    basePower: { farm: 67, fight: 56, push: 51, survival: 64, initiation: 57, objective: 50, mobility: 70 },
    stageCurves: { early: { fight: -4 }, mid: { farm: 9, fight: 13, connect: 14 }, late: { fight: 18, survival: 10 } },
    benchmarks: [[5,335,5],[10,440,8],[15,525,12],[20,595,16],[25,650,19],[30,690,22],[40,735,27]]
  }
};

function mergeDimensions(base, override = {}) {
  return { ...base, ...override };
}

function item(items, key) {
  const found = items[key];
  if (!found) throw new Error(`Unknown carry profile item key: ${key}`);
  return found;
}

function buildTrigger(trigger, items, condition) {
  if (trigger.level) return { all: [condition('level_gte', trigger.level)] };
  const itemKeys = trigger.items ?? [trigger.item];
  return { all: itemKeys.map((key) => condition('item_owned', item(items, key).id)) };
}

function makeProfile(config, { items, benchmark, condition }) {
  const preset = PRESETS[config.preset];
  return {
    id: config.id,
    displayName: config.displayName,
    role: 'carry',
    archetypes: config.archetypes ?? preset.archetypes,
    vulnerabilities: config.vulnerabilities ?? ['control', 'burst'],
    basePower: mergeDimensions(preset.basePower, config.basePower),
    stageCurves: {
      early: mergeDimensions(preset.stageCurves.early, config.stageCurves?.early),
      mid: mergeDimensions(preset.stageCurves.mid, config.stageCurves?.mid),
      late: mergeDimensions(preset.stageCurves.late, config.stageCurves?.late)
    },
    benchmarks: benchmark(config.benchmarks ?? preset.benchmarks),
    buildPlans: config.buildPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      items: plan.items.map((key) => item(items, key))
    })),
    spikes: config.spikes.map((spike) => ({
      id: `${config.id}_${spike.id}`,
      name: spike.name,
      priority: spike.priority,
      trigger: buildTrigger(spike.trigger, items, condition),
      expectedMinute: spike.expectedMinute,
      earlyToleranceMin: spike.earlyToleranceMin ?? 2,
      lateToleranceMin: spike.lateToleranceMin ?? 3.5,
      activeDurationSec: spike.activeDurationSec ?? 240,
      fadeDurationSec: spike.fadeDurationSec ?? 180,
      ...(spike.requiresUltimate ? { requires: [{ type: 'ultimate_ready', message: spike.ultimateMessage ?? 'Ключевой ультимейт должен быть готов' }] } : {}),
      permanent: spike.permanent ?? {},
      window: spike.window ?? {},
      actions: spike.actions ?? {},
      recommendation: spike.recommendation,
      balanceCalibration: 'prototype_v0_9'
    })),
    balanceCalibration: 'prototype_v0_9'
  };
}

const CONFIGS = [
  {
    id: 'anti_mage', displayName: 'Anti-Mage', preset: 'flash_farmer', vulnerabilities: ['control', 'tempo', 'physical_burst'],
    basePower: { mobility: 78, push: 68 },
    buildPlans: [
      { id: 'bf_manta_butterfly', name: 'Battle Fury → Manta → Butterfly', items: ['battle_fury','manta','butterfly','abyssal'] },
      { id: 'bf_manta_bkb', name: 'Battle Fury → Manta → BKB', items: ['battle_fury','manta','bkb','abyssal'] }
    ],
    spikes: [
      { id: 'battle_fury', name: 'Battle Fury acceleration', priority: 72, trigger: { item: 'battle_fury' }, expectedMinute: 14, permanent: { farm: 24, push: 8 }, window: { farm: 18, pressure: 6 }, actions: { FARM: 24, PRESSURE: 6 }, recommendation: 'Ускоряй три ближайших безопасных зоны и не отдавай темп до Manta.' },
      { id: 'manta', name: 'Manta split-push', priority: 86, trigger: { item: 'manta' }, expectedMinute: 21, permanent: { farm: 12, push: 24, survival: 10 }, window: { pressure: 22, farm: 8 }, actions: { PRESSURE: 24, FARM: 8 }, recommendation: 'Растягивай карту иллюзиями и вынуждай врага показывать героев.' },
      { id: 'manta_abyssal', name: 'Manta + Abyssal kill threat', priority: 97, trigger: { items: ['manta','abyssal'] }, expectedMinute: 31, permanent: { fight: 24, initiation: 16 }, window: { fight: 22, pressure: 14 }, actions: { FIGHT: 24, PRESSURE: 14 }, recommendation: 'Ищи изолированного core, сохраняя Blink для выхода.' }
    ]
  },
  {
    id: 'drow_ranger', displayName: 'Drow Ranger', preset: 'ranged', vulnerabilities: ['gap_close', 'burst', 'control'],
    basePower: { fight: 64, push: 76 },
    buildPlans: [
      { id: 'lance_manta_pike', name: 'Dragon Lance → Manta → Pike', items: ['dragon_lance','manta','hurricane_pike','butterfly'] },
      { id: 'lance_bkb_daedalus', name: 'Dragon Lance → BKB → Daedalus', items: ['dragon_lance','bkb','daedalus','hurricane_pike'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Marksmanship level 1', priority: 54, trigger: { level: 6 }, expectedMinute: 7, requiresUltimate: true, permanent: { fight: 7, farm: 5 }, window: { pressure: 9 }, actions: { PRESSURE: 9, FARM: 5 }, recommendation: 'Держи дистанцию и используй преимущество дальности для давления линии.' },
      { id: 'manta', name: 'Manta defensive timing', priority: 80, trigger: { item: 'manta' }, expectedMinute: 18, permanent: { survival: 15, push: 14, farm: 10 }, window: { pressure: 15, fight: 9 }, actions: { PRESSURE: 16, CONNECT: 9 }, recommendation: 'Толкай безопасную линию и подключайся только из задней позиции.' },
      { id: 'pike_bkb', name: 'Pike + BKB positioning window', priority: 95, trigger: { items: ['hurricane_pike','bkb'] }, expectedMinute: 27, permanent: { fight: 22, survival: 23 }, window: { fight: 20, objective: 10 }, actions: { FIGHT: 22, OBJECTIVE: 10 }, recommendation: 'Играй вокруг обзора и форсируй объект, пока защитные предметы свежие.' }
    ]
  },
  {
    id: 'faceless_void', displayName: 'Faceless Void', preset: 'fighting', vulnerabilities: ['cooldown_dependency', 'silence'],
    basePower: { fight: 78, initiation: 70, mobility: 68 },
    buildPlans: [
      { id: 'mom_mjollnir_bkb', name: 'MoM → Mjollnir → BKB', items: ['mask_of_madness','mjollnir','bkb','butterfly'] },
      { id: 'maelstrom_manta_bkb', name: 'Maelstrom → Manta → BKB', items: ['maelstrom','manta','bkb','daedalus'] }
    ],
    spikes: [
      { id: 'chrono_1', name: 'Chronosphere level 1', priority: 68, trigger: { level: 6 }, expectedMinute: 7.5, requiresUltimate: true, permanent: { fight: 7, initiation: 10 }, window: { fight: 20, connect: 17 }, actions: { FIGHT: 20, CONNECT: 17 }, recommendation: 'Ищи гарантированную Chronosphere вместе с уроном союзников.' },
      { id: 'mjollnir', name: 'Mjollnir damage spike', priority: 82, trigger: { item: 'mjollnir' }, expectedMinute: 20, permanent: { farm: 14, fight: 16 }, window: { fight: 15, farm: 8 }, actions: { FIGHT: 16, FARM: 8 }, recommendation: 'Дерись только под Chronosphere, между cooldown продолжай ускоряться.' },
      { id: 'bkb', name: 'BKB Chronosphere window', priority: 97, trigger: { item: 'bkb' }, expectedMinute: 25, requiresUltimate: true, permanent: { survival: 24, fight: 17 }, window: { fight: 25, objective: 10 }, actions: { FIGHT: 27, OBJECTIVE: 10 }, recommendation: 'Форсируй ключевую драку до сокращения длительности BKB.' }
    ]
  },
  {
    id: 'medusa', displayName: 'Medusa', preset: 'ranged', vulnerabilities: ['mana_burn', 'tempo'],
    basePower: { farm: 78, survival: 75, fight: 62, mobility: 27 },
    buildPlans: [
      { id: 'manta_skadi_butterfly', name: 'Manta → Skadi → Butterfly', items: ['manta','skadi','butterfly','daedalus'] },
      { id: 'manta_bkb_daedalus', name: 'Manta → BKB → Daedalus', items: ['manta','bkb','daedalus','butterfly'] }
    ],
    spikes: [
      { id: 'manta', name: 'Manta farming breakpoint', priority: 78, trigger: { item: 'manta' }, expectedMinute: 17, permanent: { farm: 18, push: 14, survival: 8 }, window: { farm: 16, pressure: 10 }, actions: { FARM: 18, PRESSURE: 10 }, recommendation: 'Ускоряй две линии и ближайший лес, избегая ранней пятёрки врага.' },
      { id: 'skadi', name: 'Eye of Skadi frontline timing', priority: 90, trigger: { item: 'skadi' }, expectedMinute: 24, permanent: { fight: 18, survival: 17, objective: 9 }, window: { fight: 18, objective: 12 }, actions: { FIGHT: 19, OBJECTIVE: 12 }, recommendation: 'Занимай центр драки под Stone Gaze и конвертируй победу в Roshan.' },
      { id: 'butterfly', name: 'Butterfly late carry window', priority: 96, trigger: { item: 'butterfly' }, expectedMinute: 31, permanent: { fight: 24, survival: 18 }, window: { fight: 20, pressure: 12 }, actions: { FIGHT: 22, PRESSURE: 12 }, recommendation: 'Используй преимущество до появления у врага MKB.' }
    ]
  },
  {
    id: 'morphling', displayName: 'Morphling', preset: 'pickoff', vulnerabilities: ['silence', 'instant_disable', 'burst'],
    basePower: { farm: 68, survival: 72, mobility: 75, fight: 73 },
    buildPlans: [
      { id: 'manta_linken_daedalus', name: 'Manta → Linken → Daedalus', items: ['manta','linken','daedalus','satanic'] },
      { id: 'manta_bkb_butterfly', name: 'Manta → BKB → Butterfly', items: ['manta','bkb','butterfly','satanic'] }
    ],
    spikes: [
      { id: 'manta', name: 'Manta dispel and waveform pressure', priority: 80, trigger: { item: 'manta' }, expectedMinute: 18, permanent: { farm: 12, survival: 14, push: 10 }, window: { pressure: 12, fight: 10 }, actions: { PRESSURE: 13, CONNECT: 10 }, recommendation: 'Показывай линии только при наличии Waveform и безопасного attribute shift.' },
      { id: 'linken', name: "Linken's Sphere safety window", priority: 88, trigger: { item: 'linken' }, expectedMinute: 23, permanent: { survival: 24, fight: 10 }, window: { fight: 15, pressure: 10 }, actions: { FIGHT: 16, PRESSURE: 10 }, recommendation: 'Ищи агрессивный угол против одиночного ключевого контроля.' },
      { id: 'satanic', name: 'Satanic full-commit timing', priority: 97, trigger: { item: 'satanic' }, expectedMinute: 32, permanent: { fight: 25, survival: 23 }, window: { fight: 22, objective: 10 }, actions: { FIGHT: 24, OBJECTIVE: 10 }, recommendation: 'Можно принимать длинную драку, но не расходуй Waveform только для входа.' }
    ]
  },
  {
    id: 'naga_siren', displayName: 'Naga Siren', preset: 'illusion', vulnerabilities: ['aoe_clear', 'silence'],
    basePower: { farm: 82, push: 84, fight: 48 },
    buildPlans: [
      { id: 'manta_heart_butterfly', name: 'Manta → Heart → Butterfly', items: ['manta','heart','butterfly','skadi'] },
      { id: 'manta_diffusal_heart', name: 'Manta → Diffusal → Heart', items: ['manta','diffusal','heart','butterfly'] }
    ],
    spikes: [
      { id: 'manta', name: 'Manta map acceleration', priority: 84, trigger: { item: 'manta' }, expectedMinute: 16, permanent: { farm: 22, push: 24 }, window: { pressure: 22, farm: 12 }, actions: { PRESSURE: 23, FARM: 12 }, recommendation: 'Разделяй иллюзии по линиям и не показывай настоящего героя без причины.' },
      { id: 'heart', name: 'Heart illusion sustain', priority: 93, trigger: { item: 'heart' }, expectedMinute: 24, permanent: { survival: 22, push: 20, fight: 10 }, window: { pressure: 20, objective: 10 }, actions: { PRESSURE: 22, OBJECTIVE: 10 }, recommendation: 'Души карту постоянными волнами и готовь Song для безопасного отхода или входа.' },
      { id: 'butterfly', name: 'Butterfly high-ground window', priority: 98, trigger: { item: 'butterfly' }, expectedMinute: 30, permanent: { fight: 22, survival: 18, push: 14 }, window: { fight: 18, objective: 14 }, actions: { FIGHT: 19, OBJECTIVE: 14 }, recommendation: 'Форсируй Roshan или строения до появления массового ответа на иллюзии.' }
    ]
  },
  {
    id: 'phantom_lancer', displayName: 'Phantom Lancer', preset: 'illusion', vulnerabilities: ['aoe_clear', 'early_pressure'],
    buildPlans: [
      { id: 'diffusal_manta_heart', name: 'Diffusal → Manta → Heart', items: ['diffusal','manta','heart','butterfly'] },
      { id: 'manta_diffusal_skadi', name: 'Manta → Diffusal → Skadi', items: ['manta','diffusal','skadi','heart'] }
    ],
    spikes: [
      { id: 'diffusal', name: 'Diffusal kill pressure', priority: 80, trigger: { item: 'diffusal' }, expectedMinute: 14, permanent: { fight: 14, farm: 8 }, window: { fight: 16, pressure: 12 }, actions: { FIGHT: 16, PRESSURE: 12 }, recommendation: 'Наказывай медленные цели, но не меняй безопасный фарм на долгую погоню.' },
      { id: 'manta', name: 'Manta split pressure', priority: 88, trigger: { item: 'manta' }, expectedMinute: 20, permanent: { farm: 14, push: 20, survival: 12 }, window: { pressure: 20 }, actions: { PRESSURE: 22, FARM: 8 }, recommendation: 'Растягивай линии и заставляй противника раскрывать AoE cooldown.' },
      { id: 'heart', name: 'Heart attrition timing', priority: 97, trigger: { item: 'heart' }, expectedMinute: 28, permanent: { fight: 24, survival: 25, push: 10 }, window: { fight: 20, objective: 10 }, actions: { FIGHT: 22, OBJECTIVE: 10 }, recommendation: 'Принимай длинную драку после расхода массового урона врага.' }
    ]
  },
  {
    id: 'slark', displayName: 'Slark', preset: 'pickoff', vulnerabilities: ['burst', 'instant_disable'],
    basePower: { survival: 69, mobility: 76, initiation: 68 },
    buildPlans: [
      { id: 'diffusal_aghs_bkb', name: 'Diffusal → Aghanim → BKB', items: ['diffusal','scepter','bkb','basher'] },
      { id: 'echo_aghs_skadi', name: 'Echo Sabre → Aghanim → Skadi', items: ['echo_sabre','scepter','skadi','abyssal'] }
    ],
    spikes: [
      { id: 'diffusal', name: 'Diffusal pickoff timing', priority: 79, trigger: { item: 'diffusal' }, expectedMinute: 13, permanent: { fight: 15, initiation: 10 }, window: { fight: 18, pressure: 9 }, actions: { FIGHT: 18, PRESSURE: 9 }, recommendation: 'Ищи изолированную цель и сразу выходи после Dark Pact/Shadow Dance.' },
      { id: 'aghs', name: 'Aghanim double-pounce window', priority: 91, trigger: { item: 'scepter' }, expectedMinute: 20, permanent: { mobility: 20, initiation: 17, survival: 10 }, window: { connect: 19, fight: 18 }, actions: { CONNECT: 20, FIGHT: 18 }, recommendation: 'Играй из тумана и накапливай Essence Shift короткими входами.' },
      { id: 'bkb', name: 'BKB committed fight timing', priority: 97, trigger: { item: 'bkb' }, expectedMinute: 25, permanent: { fight: 20, survival: 22 }, window: { fight: 23, objective: 9 }, actions: { FIGHT: 25, OBJECTIVE: 9 }, recommendation: 'Форсируй драку до сокращения BKB, сохраняя Shadow Dance на ответ.' }
    ]
  },
  {
    id: 'spectre', displayName: 'Spectre', preset: 'global', vulnerabilities: ['tempo', 'break'],
    basePower: { survival: 76, fight: 60 },
    buildPlans: [
      { id: 'radiance_manta_heart', name: 'Radiance → Manta → Heart', items: ['radiance','manta','heart','abyssal'] },
      { id: 'blade_mail_manta_aghs', name: 'Blade Mail → Manta → Aghanim', items: ['blade_mail','manta','scepter','heart'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Global connect level 1', priority: 62, trigger: { level: 6 }, expectedMinute: 8, requiresUltimate: true, permanent: { initiation: 10, fight: 5 }, window: { connect: 20 }, actions: { CONNECT: 20, FIGHT: 8 }, recommendation: 'Продолжай фармить до появления гарантированного добивания на другой линии.' },
      { id: 'radiance', name: 'Radiance map presence', priority: 84, trigger: { item: 'radiance' }, expectedMinute: 19, permanent: { farm: 17, fight: 14, push: 8 }, window: { farm: 12, connect: 16 }, actions: { FARM: 12, CONNECT: 16 }, recommendation: 'Фарми безопасно и подключайся глобально только к выгодным дракам.' },
      { id: 'manta', name: 'Manta global pressure', priority: 94, trigger: { item: 'manta' }, expectedMinute: 25, permanent: { push: 16, survival: 14, fight: 12 }, window: { pressure: 16, fight: 15 }, actions: { PRESSURE: 17, FIGHT: 15 }, recommendation: 'Растягивай карту иллюзиями и входи после раскрытия ключевого контроля.' }
    ]
  },
  {
    id: 'terrorblade', displayName: 'Terrorblade', preset: 'illusion', vulnerabilities: ['magic_burst', 'metamorphosis_cooldown'],
    basePower: { push: 86, objective: 75, fight: 65 },
    buildPlans: [
      { id: 'manta_skadi_bkb', name: 'Manta → Skadi → BKB', items: ['manta','skadi','bkb','butterfly'] },
      { id: 'dragon_lance_manta_daedalus', name: 'Dragon Lance → Manta → Daedalus', items: ['dragon_lance','manta','daedalus','satanic'] }
    ],
    spikes: [
      { id: 'manta', name: 'Manta illusion economy', priority: 82, trigger: { item: 'manta' }, expectedMinute: 17, permanent: { farm: 18, push: 20 }, window: { pressure: 18, farm: 10 }, actions: { PRESSURE: 19, FARM: 10 }, recommendation: 'Дави линии иллюзиями, сохраняя Metamorphosis для объекта.' },
      { id: 'skadi', name: 'Skadi Metamorphosis fight', priority: 93, trigger: { item: 'skadi' }, expectedMinute: 24, requiresUltimate: false, permanent: { fight: 20, survival: 14 }, window: { fight: 22, objective: 16 }, actions: { FIGHT: 23, OBJECTIVE: 16 }, recommendation: 'Собирай команду под Metamorphosis и забирай Roshan или башню.' },
      { id: 'bkb', name: 'BKB high-ground window', priority: 98, trigger: { item: 'bkb' }, expectedMinute: 28, permanent: { survival: 24, fight: 17 }, window: { objective: 20, fight: 18 }, actions: { OBJECTIVE: 21, FIGHT: 18 }, recommendation: 'Форсируй строение, пока BKB и Metamorphosis дают безопасное окно.' }
    ]
  },
  {
    id: 'lifestealer', displayName: 'Lifestealer', preset: 'durable', vulnerabilities: ['kite', 'armor'],
    basePower: { survival: 82, objective: 68 },
    buildPlans: [
      { id: 'armlet_desolator_bkb', name: 'Armlet → Desolator → BKB', items: ['armlet','desolator','bkb','basher'] },
      { id: 'radiance_manta_basher', name: 'Radiance → Manta → Basher', items: ['radiance','manta','basher','satanic'] }
    ],
    spikes: [
      { id: 'armlet', name: 'Armlet lane-break timing', priority: 72, trigger: { item: 'armlet' }, expectedMinute: 11, permanent: { fight: 14, survival: 10 }, window: { fight: 16, pressure: 8 }, actions: { FIGHT: 16, PRESSURE: 8 }, recommendation: 'Дави уязвимого силовика или вышку, не гоняясь за мобильными героями.' },
      { id: 'desolator', name: 'Desolator objective timing', priority: 87, trigger: { item: 'desolator' }, expectedMinute: 17, permanent: { fight: 16, objective: 20, push: 12 }, window: { objective: 20, fight: 16 }, actions: { OBJECTIVE: 21, FIGHT: 16 }, recommendation: 'Конвертируй урон в Roshan и внешние башни.' },
      { id: 'bkb', name: 'Rage + BKB sustained fight', priority: 96, trigger: { item: 'bkb' }, expectedMinute: 23, permanent: { survival: 24, fight: 18 }, window: { fight: 22 }, actions: { FIGHT: 24, CONNECT: 12 }, recommendation: 'Входи через Infest-бомбу или после первого контроля врага.' }
    ]
  },
  {
    id: 'wraith_king', displayName: 'Wraith King', preset: 'durable', vulnerabilities: ['mana_burn', 'kite'],
    basePower: { objective: 72, survival: 84 },
    buildPlans: [
      { id: 'armlet_radiance_blink', name: 'Armlet → Radiance → Blink', items: ['armlet','radiance','blink','assault_cuirass'] },
      { id: 'armlet_desolator_blink', name: 'Armlet → Desolator → Blink', items: ['armlet','desolator','blink','bkb'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Reincarnation level 1', priority: 66, trigger: { level: 6 }, expectedMinute: 7.5, requiresUltimate: true, permanent: { survival: 16, fight: 7 }, window: { fight: 15, pressure: 8 }, actions: { FIGHT: 15, PRESSURE: 8 }, recommendation: 'Занимай опасное пространство, но проверь запас маны на Reincarnation.' },
      { id: 'radiance', name: 'Radiance farm and fight timing', priority: 86, trigger: { item: 'radiance' }, expectedMinute: 18, permanent: { farm: 17, fight: 14, push: 9 }, window: { pressure: 14, fight: 14 }, actions: { PRESSURE: 14, FIGHT: 14 }, recommendation: 'Толкай линию скелетами и вынуждай врага тратить ресурсы на первую жизнь.' },
      { id: 'blink', name: 'Blink initiation timing', priority: 94, trigger: { item: 'blink' }, expectedMinute: 23, requiresUltimate: true, permanent: { initiation: 23, fight: 14 }, window: { connect: 20, fight: 19 }, actions: { CONNECT: 21, FIGHT: 19 }, recommendation: 'Начинай по ключевой цели, когда команда готова продолжить после первой жизни.' }
    ]
  },
  {
    id: 'chaos_knight', displayName: 'Chaos Knight', preset: 'durable', vulnerabilities: ['aoe_clear', 'kite'],
    basePower: { fight: 76, push: 70, farm: 50 },
    buildPlans: [
      { id: 'armlet_manta_heart', name: 'Armlet → Manta → Heart', items: ['armlet','manta','heart','assault_cuirass'] },
      { id: 'echo_manta_bkb', name: 'Echo Sabre → Manta → BKB', items: ['echo_sabre','manta','bkb','heart'] }
    ],
    spikes: [
      { id: 'armlet', name: 'Armlet burst timing', priority: 75, trigger: { item: 'armlet' }, expectedMinute: 11, permanent: { fight: 16, survival: 8 }, window: { fight: 18, pressure: 8 }, actions: { FIGHT: 18, PRESSURE: 8 }, recommendation: 'Ищи короткий Reality Rift по уязвимой цели.' },
      { id: 'manta', name: 'Manta Phantasm pressure', priority: 89, trigger: { item: 'manta' }, expectedMinute: 18, permanent: { push: 18, fight: 15, survival: 10 }, window: { pressure: 16, fight: 17 }, actions: { FIGHT: 18, PRESSURE: 16 }, recommendation: 'Конвертируй Phantasm в убийство или башню, не трать его на пустой фарм.' },
      { id: 'heart', name: 'Heart illusion frontline', priority: 97, trigger: { item: 'heart' }, expectedMinute: 27, permanent: { survival: 25, fight: 22, push: 12 }, window: { fight: 20, objective: 13 }, actions: { FIGHT: 22, OBJECTIVE: 13 }, recommendation: 'Принимай длинную драку после расхода массового урона противника.' }
    ]
  },
  {
    id: 'gyrocopter', displayName: 'Gyrocopter', preset: 'ranged', vulnerabilities: ['burst', 'range'],
    basePower: { fight: 72, farm: 72, objective: 62 },
    buildPlans: [
      { id: 'maelstrom_aghs_bkb', name: 'Maelstrom → Aghanim → BKB', items: ['maelstrom','scepter','bkb','satanic'] },
      { id: 'dragon_lance_aghs_butterfly', name: 'Dragon Lance → Aghanim → Butterfly', items: ['dragon_lance','scepter','butterfly','satanic'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Call Down level 1', priority: 57, trigger: { level: 6 }, expectedMinute: 7, requiresUltimate: true, permanent: { fight: 7 }, window: { fight: 15, connect: 10 }, actions: { FIGHT: 15, CONNECT: 10 }, recommendation: 'Подключайся к узкой драке, где Call Down накрывает несколько целей.' },
      { id: 'aghs', name: 'Side Gunner scaling', priority: 87, trigger: { item: 'scepter' }, expectedMinute: 19, permanent: { farm: 14, fight: 18 }, window: { fight: 17, objective: 10 }, actions: { FIGHT: 18, OBJECTIVE: 10 }, recommendation: 'Собирайся с командой и используй Flak Cannon до начала полного входа.' },
      { id: 'bkb', name: 'BKB Flak teamfight', priority: 97, trigger: { item: 'bkb' }, expectedMinute: 24, permanent: { survival: 24, fight: 20 }, window: { fight: 24, objective: 12 }, actions: { FIGHT: 26, OBJECTIVE: 12 }, recommendation: 'Форсируй массовую драку, пока BKB позволяет наносить полный Flak-урон.' }
    ]
  },
  {
    id: 'bloodseeker', displayName: 'Bloodseeker', preset: 'fighting', vulnerabilities: ['kite', 'save'],
    basePower: { mobility: 75, initiation: 62 },
    buildPlans: [
      { id: 'maelstrom_bkb_basher', name: 'Maelstrom → BKB → Basher', items: ['maelstrom','bkb','basher','butterfly'] },
      { id: 'radiance_manta_bkb', name: 'Radiance → Manta → BKB', items: ['radiance','manta','bkb','abyssal'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Rupture level 1', priority: 64, trigger: { level: 6 }, expectedMinute: 7, requiresUltimate: true, permanent: { initiation: 10, fight: 6 }, window: { fight: 18, connect: 12 }, actions: { FIGHT: 18, CONNECT: 12 }, recommendation: 'Используй Rupture против мобильной цели и не перелезай за башню без обзора.' },
      { id: 'maelstrom', name: 'Maelstrom tempo farm', priority: 76, trigger: { item: 'maelstrom' }, expectedMinute: 14, permanent: { farm: 15, fight: 9 }, window: { farm: 10, pressure: 8 }, actions: { FARM: 11, PRESSURE: 8 }, recommendation: 'Ускоряй фарм между Rupture-окнами и дави низкие по здоровью цели.' },
      { id: 'bkb', name: 'BKB chase timing', priority: 95, trigger: { item: 'bkb' }, expectedMinute: 22, permanent: { survival: 23, fight: 19 }, window: { fight: 23, objective: 9 }, actions: { FIGHT: 24, OBJECTIVE: 9 }, recommendation: 'Начинай по цели без сейва и используй скорость для добивания задней линии.' }
    ]
  },
  {
    id: 'arc_warden', displayName: 'Arc Warden', preset: 'ranged', vulnerabilities: ['gap_close', 'tempo'],
    basePower: { farm: 82, push: 82, fight: 55, mobility: 32 },
    buildPlans: [
      { id: 'midas_maelstrom_travel', name: 'Midas → Maelstrom → Travels', items: ['hand_of_midas','maelstrom','travel_boots','gleipnir'] },
      { id: 'maelstrom_manta_daedalus', name: 'Maelstrom → Manta → Daedalus', items: ['maelstrom','manta','daedalus','butterfly'] }
    ],
    spikes: [
      { id: 'midas', name: 'Double Midas economy', priority: 72, trigger: { item: 'hand_of_midas' }, expectedMinute: 10, permanent: { farm: 20 }, window: { farm: 18 }, actions: { FARM: 22 }, recommendation: 'Максимизируй независимый фарм Tempest Double и не отдавай основного героя.' },
      { id: 'maelstrom', name: 'Tempest Double lane pressure', priority: 85, trigger: { item: 'maelstrom' }, expectedMinute: 16, permanent: { farm: 16, push: 18 }, window: { pressure: 20 }, actions: { PRESSURE: 22, FARM: 8 }, recommendation: 'Толкай дальнюю линию клоном и сохраняй основного героя рядом с безопасным ресурсом.' },
      { id: 'travel', name: 'Global split map timing', priority: 94, trigger: { item: 'travel_boots' }, expectedMinute: 21, permanent: { mobility: 25, push: 18 }, window: { pressure: 23, objective: 8 }, actions: { PRESSURE: 25, OBJECTIVE: 8 }, recommendation: 'Создавай численное преимущество телепортом после реакции врага на клона.' }
    ]
  },
  {
    id: 'clinkz', displayName: 'Clinkz', preset: 'pickoff', vulnerabilities: ['detection', 'control'],
    basePower: { push: 65, initiation: 72 },
    buildPlans: [
      { id: 'orchid_desolator_bkb', name: 'Orchid → Desolator → BKB', items: ['orchid','desolator','bkb','bloodthorn'] },
      { id: 'maelstrom_orchid_bkb', name: 'Maelstrom → Orchid → BKB', items: ['maelstrom','orchid','bkb','daedalus'] }
    ],
    spikes: [
      { id: 'orchid', name: 'Orchid solo-kill timing', priority: 82, trigger: { item: 'orchid' }, expectedMinute: 14, permanent: { initiation: 17, fight: 14 }, window: { fight: 20, pressure: 8 }, actions: { FIGHT: 20, PRESSURE: 8 }, recommendation: 'Ищи героя без диспела и атакуй только с заранее подготовленным путём выхода.' },
      { id: 'desolator', name: 'Desolator tower conversion', priority: 90, trigger: { item: 'desolator' }, expectedMinute: 19, permanent: { push: 18, objective: 14, fight: 12 }, window: { objective: 17, pressure: 14 }, actions: { OBJECTIVE: 18, PRESSURE: 14 }, recommendation: 'После убийства сразу переводись на башню или Roshan.' },
      { id: 'bkb', name: 'BKB backline dive', priority: 96, trigger: { item: 'bkb' }, expectedMinute: 24, permanent: { survival: 23, fight: 18 }, window: { fight: 22 }, actions: { FIGHT: 24, CONNECT: 11 }, recommendation: 'Заходи на заднюю линию после раскрытия вижена и ключевого контроля.' }
    ]
  },
  {
    id: 'muerta', displayName: 'Muerta', preset: 'ranged', vulnerabilities: ['gap_close', 'silence'],
    basePower: { fight: 75, objective: 60 },
    buildPlans: [
      { id: 'maelstrom_dragon_lance_bkb', name: 'Maelstrom → Dragon Lance → BKB', items: ['maelstrom','dragon_lance','bkb','daedalus'] },
      { id: 'manta_gleipnir_bkb', name: 'Manta → Gleipnir → BKB', items: ['manta','gleipnir','bkb','satanic'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Pierce the Veil level 1', priority: 64, trigger: { level: 6 }, expectedMinute: 7.5, requiresUltimate: true, permanent: { fight: 9 }, window: { fight: 18 }, actions: { FIGHT: 18, CONNECT: 9 }, recommendation: 'Используй ультимейт после физического контроля врага, а не для входа вслепую.' },
      { id: 'maelstrom', name: 'Maelstrom farm and Gunslinger', priority: 76, trigger: { item: 'maelstrom' }, expectedMinute: 14, permanent: { farm: 14, fight: 8 }, window: { farm: 10 }, actions: { FARM: 12, PRESSURE: 7 }, recommendation: 'Ускоряй линии, сохраняя безопасную дальность.' },
      { id: 'bkb', name: 'BKB Pierce the Veil window', priority: 97, trigger: { item: 'bkb' }, expectedMinute: 23, requiresUltimate: true, permanent: { survival: 23, fight: 22 }, window: { fight: 25, objective: 10 }, actions: { FIGHT: 27, OBJECTIVE: 10 }, recommendation: 'Форсируй драку вокруг объекта, пока защитные cooldown позволяют полный ультимейт.' }
    ]
  },
  {
    id: 'razor', displayName: 'Razor', preset: 'fighting', vulnerabilities: ['kite', 'burst'],
    basePower: { fight: 77, survival: 66, push: 60 },
    buildPlans: [
      { id: 'bkb_sange_yasha_refresher', name: 'BKB → Sange and Yasha → Refresher', items: ['bkb','sange_and_yasha','refresher','satanic'] },
      { id: 'manta_bkb_skadi', name: 'Manta → BKB → Skadi', items: ['manta','bkb','skadi','butterfly'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Eye of the Storm level 1', priority: 62, trigger: { level: 6 }, expectedMinute: 7, requiresUltimate: true, permanent: { fight: 8, push: 5 }, window: { fight: 16, pressure: 9 }, actions: { FIGHT: 16, PRESSURE: 9 }, recommendation: 'Дави героя, который не может разорвать Static Link.' },
      { id: 'bkb', name: 'BKB Static Link timing', priority: 91, trigger: { item: 'bkb' }, expectedMinute: 18, permanent: { survival: 24, fight: 19 }, window: { fight: 23, objective: 11 }, actions: { FIGHT: 24, OBJECTIVE: 11 }, recommendation: 'Форсируй драку по вражескому физическому core до ослабления BKB.' },
      { id: 'refresher', name: 'Double Eye of the Storm', priority: 98, trigger: { item: 'refresher' }, expectedMinute: 31, permanent: { fight: 27, objective: 15 }, window: { fight: 24, objective: 17 }, actions: { FIGHT: 26, OBJECTIVE: 17 }, recommendation: 'Играй вокруг длительной драки и уничтожения брони на ключевой цели.' }
    ]
  },
  {
    id: 'weaver', displayName: 'Weaver', preset: 'pickoff', vulnerabilities: ['silence', 'instant_disable'],
    basePower: { mobility: 86, survival: 63, push: 59 },
    buildPlans: [
      { id: 'maelstrom_linken_bkb', name: 'Maelstrom → Linken → BKB', items: ['maelstrom','linken','bkb','daedalus'] },
      { id: 'dragon_lance_desolator_bkb', name: 'Dragon Lance → Desolator → BKB', items: ['dragon_lance','desolator','bkb','satanic'] }
    ],
    spikes: [
      { id: 'maelstrom', name: 'Maelstrom lane acceleration', priority: 74, trigger: { item: 'maelstrom' }, expectedMinute: 13, permanent: { farm: 15, push: 10 }, window: { pressure: 10, farm: 8 }, actions: { FARM: 10, PRESSURE: 10 }, recommendation: 'Толкай линию Shukuchi и исчезай до реакции врага.' },
      { id: 'linken', name: "Linken's aggressive map timing", priority: 87, trigger: { item: 'linken' }, expectedMinute: 19, permanent: { survival: 22, pressure: 10 }, window: { pressure: 16, fight: 13 }, actions: { PRESSURE: 17, FIGHT: 13 }, recommendation: 'Занимай опасную линию, отслеживая способности, которые снимают Linken.' },
      { id: 'bkb', name: 'BKB backline timing', priority: 96, trigger: { item: 'bkb' }, expectedMinute: 24, permanent: { fight: 20, survival: 23 }, window: { fight: 22 }, actions: { FIGHT: 24, CONNECT: 10 }, recommendation: 'Входи после первого контроля и сохраняй Time Lapse до угрозы смертельного burst.' }
    ]
  },
  {
    id: 'troll_warlord', displayName: 'Troll Warlord', preset: 'fighting', vulnerabilities: ['kite', 'disarm'],
    basePower: { objective: 88, fight: 76, mobility: 45 },
    buildPlans: [
      { id: 'battle_fury_bkb_sange_yasha', name: 'Battle Fury → BKB → Sange and Yasha', items: ['battle_fury','bkb','sange_and_yasha','satanic'] },
      { id: 'maelstrom_bkb_basher', name: 'Maelstrom → BKB → Basher', items: ['maelstrom','bkb','basher','butterfly'] }
    ],
    spikes: [
      { id: 'battle_fury', name: 'Battle Fury acceleration', priority: 72, trigger: { item: 'battle_fury' }, expectedMinute: 14, permanent: { farm: 22 }, window: { farm: 16 }, actions: { FARM: 20 }, recommendation: 'Ускорь BKB, не ввязываясь в бой без возможности держать цель.' },
      { id: 'bkb', name: 'BKB Battle Trance window', priority: 95, trigger: { item: 'bkb' }, expectedMinute: 22, requiresUltimate: true, permanent: { fight: 24, survival: 20 }, window: { fight: 25, objective: 16 }, actions: { FIGHT: 26, OBJECTIVE: 16 }, recommendation: 'Форсируй Roshan или бой по цели без kite-инструментов.' },
      { id: 'basher', name: 'Basher target lock', priority: 97, trigger: { item: 'basher' }, expectedMinute: 27, permanent: { initiation: 15, fight: 18 }, window: { fight: 20, objective: 14 }, actions: { FIGHT: 22, OBJECTIVE: 14 }, recommendation: 'Приклейся к ключевому core и не меняй цель во время Battle Trance.' }
    ]
  },
  {
    id: 'monkey_king', displayName: 'Monkey King', preset: 'fighting', vulnerabilities: ['tree_cut', 'burst'],
    basePower: { mobility: 73, initiation: 60, fight: 74 },
    buildPlans: [
      { id: 'echo_desolator_bkb', name: 'Echo Sabre → Desolator → BKB', items: ['echo_sabre','desolator','bkb','basher'] },
      { id: 'maelstrom_aghs_bkb', name: 'Maelstrom → Aghanim → BKB', items: ['maelstrom','scepter','bkb','skadi'] }
    ],
    spikes: [
      { id: 'echo', name: 'Echo Sabre Jingu timing', priority: 75, trigger: { item: 'echo_sabre' }, expectedMinute: 12, permanent: { fight: 15, initiation: 7 }, window: { fight: 17, pressure: 8 }, actions: { FIGHT: 17, PRESSURE: 8 }, recommendation: 'Наказывай ближнего героя на линии и не раскрывай Tree Dance без цели.' },
      { id: 'desolator', name: 'Desolator Wukong pressure', priority: 88, trigger: { item: 'desolator' }, expectedMinute: 18, requiresUltimate: true, permanent: { fight: 17, objective: 14 }, window: { fight: 20, objective: 12 }, actions: { FIGHT: 21, OBJECTIVE: 12 }, recommendation: 'Ставь Wukong вокруг узкого объекта или заранее ограниченной зоны.' },
      { id: 'bkb', name: 'BKB Wukong commitment', priority: 97, trigger: { item: 'bkb' }, expectedMinute: 24, requiresUltimate: true, permanent: { survival: 24, fight: 20 }, window: { fight: 24 }, actions: { FIGHT: 26, CONNECT: 10 }, recommendation: 'Форсируй драку с позиции на дереве после раскрытия вражеского контроля.' }
    ]
  },
  {
    id: 'alchemist', displayName: 'Alchemist', preset: 'flash_farmer', vulnerabilities: ['anti_heal', 'tempo'],
    basePower: { farm: 88, objective: 70, fight: 60 },
    buildPlans: [
      { id: 'radiance_blink_bkb', name: 'Radiance → Blink → BKB', items: ['radiance','blink','bkb','assault_cuirass'] },
      { id: 'battle_fury_manta_bkb', name: 'Battle Fury → Manta → BKB', items: ['battle_fury','manta','bkb','abyssal'] }
    ],
    spikes: [
      { id: 'radiance', name: 'Early Radiance acceleration', priority: 86, trigger: { item: 'radiance' }, expectedMinute: 13, permanent: { farm: 25, fight: 10 }, window: { farm: 18, pressure: 10 }, actions: { FARM: 20, PRESSURE: 10 }, recommendation: 'Ускорь следующие два предмета, избегая бесполезных переходов по карте.' },
      { id: 'blink', name: 'Blink Chemical Rage entry', priority: 91, trigger: { item: 'blink' }, expectedMinute: 18, requiresUltimate: true, permanent: { initiation: 22, fight: 13 }, window: { connect: 20, fight: 18 }, actions: { CONNECT: 21, FIGHT: 18 }, recommendation: 'Используй экономическое преимущество для внезапной инициации по слабому core.' },
      { id: 'bkb', name: 'BKB net-worth conversion', priority: 98, trigger: { item: 'bkb' }, expectedMinute: 21, permanent: { survival: 24, fight: 22 }, window: { fight: 25, objective: 16 }, actions: { FIGHT: 26, OBJECTIVE: 16 }, recommendation: 'Форсируй объект до того, как противник догонит твой ускоренный net worth.' }
    ]
  },
  {
    id: 'tiny', displayName: 'Tiny', preset: 'fighting', vulnerabilities: ['kite', 'armor'],
    basePower: { initiation: 75, push: 74, fight: 74 },
    buildPlans: [
      { id: 'echo_blink_bkb', name: 'Echo Sabre → Blink → BKB', items: ['echo_sabre','blink','bkb','assault_cuirass'] },
      { id: 'blink_aghs_daedalus', name: 'Blink → Aghanim → Daedalus', items: ['blink','scepter','daedalus','bkb'] }
    ],
    spikes: [
      { id: 'blink', name: 'Blink combo timing', priority: 84, trigger: { item: 'blink' }, expectedMinute: 14, permanent: { initiation: 28, fight: 15 }, window: { connect: 22, fight: 20 }, actions: { CONNECT: 23, FIGHT: 20 }, recommendation: 'Исчезни с карты и ищи Avalanche-Toss по ключевой цели.' },
      { id: 'bkb', name: 'BKB sustained right-click', priority: 95, trigger: { item: 'bkb' }, expectedMinute: 21, permanent: { survival: 24, fight: 19 }, window: { fight: 23, objective: 11 }, actions: { FIGHT: 24, OBJECTIVE: 11 }, recommendation: 'После burst-комбо оставайся в драке только при активной BKB.' },
      { id: 'assault', name: 'Assault Cuirass building pressure', priority: 97, trigger: { item: 'assault_cuirass' }, expectedMinute: 29, permanent: { push: 22, objective: 18, survival: 12 }, window: { objective: 20, pressure: 15 }, actions: { OBJECTIVE: 21, PRESSURE: 15 }, recommendation: 'Конвертируй урон по строениям в быстрый high-ground после победы.' }
    ]
  },
  {
    id: 'marci', displayName: 'Marci', preset: 'fighting', vulnerabilities: ['kite', 'control'],
    basePower: { initiation: 70, mobility: 70, fight: 76 },
    buildPlans: [
      { id: 'bkb_basher_satanic', name: 'BKB → Basher → Satanic', items: ['bkb','basher','satanic','abyssal'] },
      { id: 'armlet_bkb_basher', name: 'Armlet → BKB → Basher', items: ['armlet','bkb','basher','satanic'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Unleash level 1', priority: 66, trigger: { level: 6 }, expectedMinute: 7, requiresUltimate: true, permanent: { fight: 10 }, window: { fight: 18, connect: 12 }, actions: { FIGHT: 18, CONNECT: 12 }, recommendation: 'Ищи короткий вход с союзником, который удержит цель в радиусе Unleash.' },
      { id: 'bkb', name: 'BKB Unleash timing', priority: 94, trigger: { item: 'bkb' }, expectedMinute: 18, requiresUltimate: true, permanent: { survival: 24, fight: 21 }, window: { fight: 25 }, actions: { FIGHT: 27, CONNECT: 10 }, recommendation: 'Форсируй драку до уменьшения BKB и не трать Rebound только на добегание.' },
      { id: 'basher', name: 'Basher target lock', priority: 97, trigger: { item: 'basher' }, expectedMinute: 24, permanent: { initiation: 16, fight: 17 }, window: { fight: 20, objective: 8 }, actions: { FIGHT: 22, OBJECTIVE: 8 }, recommendation: 'Фокусируй одну цель на всю длительность Unleash.' }
    ]
  },
  {
    id: 'dawnbreaker', displayName: 'Dawnbreaker', preset: 'global', vulnerabilities: ['break', 'kite'],
    basePower: { survival: 72, fight: 70, objective: 58 },
    buildPlans: [
      { id: 'echo_desolator_bkb', name: 'Echo Sabre → Desolator → BKB', items: ['echo_sabre','desolator','bkb','assault_cuirass'] },
      { id: 'radiance_aghs_bkb', name: 'Radiance → Aghanim → BKB', items: ['radiance','scepter','bkb','heart'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Solar Guardian global save', priority: 68, trigger: { level: 6 }, expectedMinute: 7, requiresUltimate: true, permanent: { connect: 15, fight: 6 }, window: { connect: 22, fight: 12 }, actions: { CONNECT: 23, FIGHT: 12 }, recommendation: 'Оставайся на ресурсе, но будь готова глобально перевернуть боковую драку.' },
      { id: 'desolator', name: 'Desolator Starbreaker damage', priority: 86, trigger: { item: 'desolator' }, expectedMinute: 17, permanent: { fight: 17, objective: 14 }, window: { fight: 18, objective: 12 }, actions: { FIGHT: 19, OBJECTIVE: 12 }, recommendation: 'После глобального входа сразу конвертируй убийство в строение.' },
      { id: 'bkb', name: 'BKB global commitment', priority: 96, trigger: { item: 'bkb' }, expectedMinute: 23, permanent: { survival: 24, fight: 19 }, window: { fight: 22, connect: 15 }, actions: { FIGHT: 23, CONNECT: 15 }, recommendation: 'Входи в центр драки после начала союзников и сохраняй BKB для Starbreaker.' }
    ]
  },
  {
    id: 'dragon_knight', displayName: 'Dragon Knight', preset: 'durable', vulnerabilities: ['kite', 'break'],
    basePower: { push: 78, objective: 74, survival: 80 },
    buildPlans: [
      { id: 'blink_bkb_assault', name: 'Blink → BKB → Assault Cuirass', items: ['blink','bkb','assault_cuirass','daedalus'] },
      { id: 'manta_aghs_bkb', name: 'Manta → Aghanim → BKB', items: ['manta','scepter','bkb','assault_cuirass'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Elder Dragon Form level 1', priority: 62, trigger: { level: 6 }, expectedMinute: 7, requiresUltimate: true, permanent: { push: 10, survival: 6 }, window: { pressure: 16, objective: 10 }, actions: { PRESSURE: 16, OBJECTIVE: 10 }, recommendation: 'Используй первую форму для урона по башне, а не для пустого фарма.' },
      { id: 'blink', name: 'Blink Dragon Tail initiation', priority: 86, trigger: { item: 'blink' }, expectedMinute: 15, permanent: { initiation: 25, fight: 12 }, window: { connect: 21, fight: 17 }, actions: { CONNECT: 22, FIGHT: 17 }, recommendation: 'Исчезни с линии и начинай по цели, которую команда успеет добить.' },
      { id: 'bkb', name: 'BKB siege window', priority: 96, trigger: { item: 'bkb' }, expectedMinute: 22, permanent: { survival: 23, fight: 17, push: 10 }, window: { objective: 19, fight: 18 }, actions: { OBJECTIVE: 20, FIGHT: 18 }, recommendation: 'Форсируй башню или Roshan под Dragon Form и свежую BKB.' }
    ]
  }
];

export function createCarryProfilePack({ ITEMS, benchmark, condition }) {
  return Object.fromEntries(CONFIGS.map((config) => [
    config.id,
    makeProfile(config, { items: ITEMS, benchmark, condition })
  ]));
}

export const CARRY_PROFILE_PACK_IDS = Object.freeze(CONFIGS.map((config) => config.id));
