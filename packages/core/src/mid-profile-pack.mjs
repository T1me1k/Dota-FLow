const PRESETS = Object.freeze({
  mobile_caster: {
    archetypes: ['mobile_mid', 'tempo_caster', 'pickoff_core'],
    vulnerabilities: ['control', 'silence', 'burst'],
    basePower: { farm: 56, fight: 66, push: 45, survival: 47, initiation: 66, objective: 42, mobility: 78 },
    stageCurves: {
      early: { fight: 4, mobility: 5 },
      mid: { farm: 7, fight: 17, initiation: 13, mobility: 8 },
      late: { fight: 9, survival: 7, objective: 5 }
    },
    benchmarks: [[5,330,6],[10,430,9],[15,505,13],[20,565,16],[25,610,19],[30,650,22],[40,695,26]]
  },
  control_caster: {
    archetypes: ['control_mid', 'teamfight_caster', 'space_creator'],
    vulnerabilities: ['silence', 'burst'],
    basePower: { farm: 55, fight: 68, push: 44, survival: 44, initiation: 72, objective: 43, mobility: 66 },
    stageCurves: {
      early: { fight: 5, initiation: 4 },
      mid: { farm: 6, fight: 18, initiation: 15 },
      late: { fight: 11, survival: 7, objective: 6 }
    },
    benchmarks: [[5,325,6],[10,425,9],[15,500,13],[20,560,16],[25,605,19],[30,645,22],[40,690,26]]
  },
  artillery_caster: {
    archetypes: ['artillery_mid', 'magic_burst', 'high_ground_defender'],
    vulnerabilities: ['gap_close', 'silence', 'burst'],
    basePower: { farm: 61, fight: 69, push: 51, survival: 40, initiation: 48, objective: 47, mobility: 42 },
    stageCurves: {
      early: { farm: 3, fight: 4 },
      mid: { farm: 10, fight: 17, push: 8 },
      late: { fight: 13, push: 9, objective: 6 }
    },
    benchmarks: [[5,340,6],[10,445,9],[15,525,13],[20,590,16],[25,640,19],[30,680,22],[40,725,26]]
  },
  scaling_caster: {
    archetypes: ['scaling_mid', 'spell_combo_core', 'map_controller'],
    vulnerabilities: ['silence', 'tempo'],
    basePower: { farm: 63, fight: 59, push: 50, survival: 43, initiation: 58, objective: 45, mobility: 55 },
    stageCurves: {
      early: { fight: -2, farm: 4 },
      mid: { farm: 11, fight: 14, initiation: 9 },
      late: { fight: 18, survival: 8, objective: 7 }
    },
    benchmarks: [[5,335,6],[10,440,9],[15,520,13],[20,585,16],[25,635,19],[30,675,22],[40,720,26]]
  }
});

function mergeDimensions(base, override = {}) {
  return { ...base, ...override };
}

function item(items, key) {
  const found = items[key];
  if (!found) throw new Error(`Unknown mid profile item key: ${key}`);
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
    role: 'mid',
    archetypes: config.archetypes ?? preset.archetypes,
    vulnerabilities: config.vulnerabilities ?? preset.vulnerabilities,
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
      earlyToleranceMin: spike.earlyToleranceMin ?? 1.5,
      lateToleranceMin: spike.lateToleranceMin ?? 3,
      activeDurationSec: spike.activeDurationSec ?? 240,
      fadeDurationSec: spike.fadeDurationSec ?? 180,
      ...(spike.requiresUltimate ? { requires: [{ type: 'ultimate_ready', message: spike.ultimateMessage ?? 'Ключевой ультимейт должен быть готов' }] } : {}),
      permanent: spike.permanent ?? {},
      window: spike.window ?? {},
      actions: spike.actions ?? {},
      recommendation: spike.recommendation,
      balanceCalibration: 'prototype_mid_pack_v1'
    })),
    balanceCalibration: 'prototype_mid_pack_v1'
  };
}

const CONFIGS = Object.freeze([
  {
    id: 'ember_spirit', displayName: 'Ember Spirit', preset: 'mobile_caster',
    vulnerabilities: ['silence', 'instant_disable', 'burst'],
    basePower: { farm: 61, fight: 71, mobility: 84, initiation: 70 },
    buildPlans: [
      { id: 'maelstrom_bkb_scepter', name: 'Maelstrom → BKB → Aghanim', items: ['maelstrom','bkb','scepter','daedalus'] },
      { id: 'maelstrom_scepter_bkb', name: 'Maelstrom → Aghanim → BKB', items: ['maelstrom','scepter','bkb','daedalus'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Fire Remnant mobility', priority: 65, trigger: { level: 6 }, expectedMinute: 6.5, requiresUltimate: true, permanent: { mobility: 13, initiation: 8 }, window: { connect: 17, fight: 13 }, actions: { CONNECT: 18, FIGHT: 13 }, recommendation: 'Сначала протолкни mid, затем используй Remnant для численного преимущества на боковой линии.' },
      { id: 'maelstrom', name: 'Maelstrom wave acceleration', priority: 79, trigger: { item: 'maelstrom' }, expectedMinute: 13.5, permanent: { farm: 17, push: 12, fight: 7 }, window: { pressure: 12, farm: 9 }, actions: { PRESSURE: 13, FARM: 10 }, recommendation: 'Быстро очищай волну и исчезай с карты до реакции соперника.' },
      { id: 'scepter_bkb', name: 'Aghanim + BKB commit window', priority: 97, trigger: { items: ['scepter','bkb'] }, expectedMinute: 25, permanent: { fight: 23, survival: 22, mobility: 14 }, window: { fight: 24, connect: 19, objective: 8 }, actions: { FIGHT: 26, CONNECT: 19, OBJECTIVE: 8 }, recommendation: 'Форсируй ключевую драку, сохраняя один Remnant для выхода.' }
    ]
  },
  {
    id: 'invoker', displayName: 'Invoker', preset: 'scaling_caster',
    vulnerabilities: ['silence', 'gap_close', 'tempo'],
    basePower: { farm: 65, fight: 65, initiation: 64, mobility: 52 },
    buildPlans: [
      { id: 'midas_travel_scepter', name: 'Midas → Travels → Aghanim', items: ['hand_of_midas','travel_boots','scepter','bkb'] },
      { id: 'midas_bkb_refresher', name: 'Midas → BKB → Refresher', items: ['hand_of_midas','bkb','scepter','refresher'] }
    ],
    spikes: [
      { id: 'level_9', name: 'Core spell cycle online', priority: 66, trigger: { level: 9 }, expectedMinute: 10, permanent: { fight: 10, initiation: 8, farm: 5 }, window: { connect: 13, fight: 12 }, actions: { CONNECT: 14, FIGHT: 12 }, recommendation: 'Играй от заранее выбранной комбинации, а не от случайного набора заклинаний.' },
      { id: 'midas', name: 'Midas scaling engine', priority: 74, trigger: { item: 'hand_of_midas' }, expectedMinute: 10.5, permanent: { farm: 18 }, window: { farm: 15 }, actions: { FARM: 18 }, recommendation: 'Не ломай экономический темп без гарантированной руны, убийства или защиты башни.' },
      { id: 'travel_scepter', name: 'Global spell conversion', priority: 94, trigger: { items: ['travel_boots','scepter'] }, expectedMinute: 23, permanent: { mobility: 20, fight: 19, push: 10 }, window: { connect: 21, fight: 18, objective: 9 }, actions: { CONNECT: 22, FIGHT: 19, OBJECTIVE: 9 }, recommendation: 'Создавай преимущество телепортом после появления врага на другой линии.' }
    ]
  },
  {
    id: 'lina', displayName: 'Lina', preset: 'artillery_caster',
    vulnerabilities: ['gap_close', 'burst', 'control'],
    basePower: { farm: 70, fight: 72, push: 63, mobility: 45 },
    buildPlans: [
      { id: 'maelstrom_bkb_daedalus', name: 'Maelstrom → BKB → Daedalus', items: ['maelstrom','bkb','daedalus','satanic'] },
      { id: 'maelstrom_scepter_bkb', name: 'Maelstrom → Aghanim → BKB', items: ['maelstrom','scepter','bkb','daedalus'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Laguna Blade level 1', priority: 61, trigger: { level: 6 }, expectedMinute: 6.5, requiresUltimate: true, permanent: { fight: 8 }, window: { fight: 17, connect: 9 }, actions: { FIGHT: 17, CONNECT: 9 }, recommendation: 'Используй burst по цели, которую можно добить без глубокого преследования.' },
      { id: 'maelstrom', name: 'Maelstrom attack tempo', priority: 80, trigger: { item: 'maelstrom' }, expectedMinute: 13, permanent: { farm: 16, push: 11, fight: 9 }, window: { pressure: 12, farm: 8 }, actions: { PRESSURE: 13, FARM: 9 }, recommendation: 'Забирай волну быстро и занимай позицию до начала следующего действия.' },
      { id: 'bkb_daedalus', name: 'BKB + Daedalus damage window', priority: 98, trigger: { items: ['bkb','daedalus'] }, expectedMinute: 27, permanent: { fight: 27, survival: 22, objective: 12 }, window: { fight: 24, objective: 14 }, actions: { FIGHT: 27, OBJECTIVE: 14 }, recommendation: 'Форсируй Roshan или башню, пока защитный предмет позволяет непрерывно атаковать.' }
    ]
  },
  {
    id: 'puck', displayName: 'Puck', preset: 'control_caster',
    vulnerabilities: ['silence', 'instant_disable'],
    basePower: { fight: 73, initiation: 82, mobility: 88, survival: 57 },
    buildPlans: [
      { id: 'blink_scepter_bkb', name: 'Blink → Aghanim → BKB', items: ['blink','scepter','bkb','refresher'] },
      { id: 'blink_linken_scepter', name: 'Blink → Linken → Aghanim', items: ['blink','linken','scepter','refresher'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Dream Coil level 1', priority: 69, trigger: { level: 6 }, expectedMinute: 6.5, requiresUltimate: true, permanent: { fight: 9, initiation: 12 }, window: { connect: 19, fight: 17 }, actions: { CONNECT: 20, FIGHT: 17 }, recommendation: 'Сначала протолкни волну, затем ищи Coil вместе с уроном союзников.' },
      { id: 'blink', name: 'Blink initiation breakpoint', priority: 88, trigger: { item: 'blink' }, expectedMinute: 14.5, permanent: { initiation: 24, mobility: 14, survival: 8 }, window: { connect: 22, fight: 18 }, actions: { CONNECT: 23, FIGHT: 18 }, recommendation: 'Не показывай Blink на пустой волне: играй из тумана вокруг Coil.' },
      { id: 'scepter_bkb', name: 'Aghanim + BKB control window', priority: 97, trigger: { items: ['scepter','bkb'] }, expectedMinute: 25, permanent: { fight: 22, survival: 22, initiation: 10 }, window: { fight: 24, objective: 9 }, actions: { FIGHT: 26, OBJECTIVE: 9 }, recommendation: 'Форсируй командную драку, сохраняя Phase Shift для ответного контроля.' }
    ]
  },
  {
    id: 'queen_of_pain', displayName: 'Queen of Pain', preset: 'mobile_caster',
    vulnerabilities: ['silence', 'instant_disable', 'burst'],
    basePower: { fight: 75, initiation: 72, mobility: 86, farm: 58 },
    buildPlans: [
      { id: 'orchid_bkb_scepter', name: 'Orchid → BKB → Aghanim', items: ['orchid','bkb','scepter','bloodthorn'] },
      { id: 'orchid_linken_bloodthorn', name: 'Orchid → Linken → Bloodthorn', items: ['orchid','linken','bloodthorn','bkb'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Sonic Wave level 1', priority: 64, trigger: { level: 6 }, expectedMinute: 6.5, requiresUltimate: true, permanent: { fight: 9 }, window: { fight: 18, connect: 11 }, actions: { FIGHT: 18, CONNECT: 11 }, recommendation: 'Ищи действие после проталкивания mid и не расходуй Blink только для входа.' },
      { id: 'orchid', name: 'Orchid solo-kill timing', priority: 86, trigger: { item: 'orchid' }, expectedMinute: 14, permanent: { initiation: 19, fight: 15 }, window: { fight: 22, pressure: 8 }, actions: { FIGHT: 23, PRESSURE: 8 }, recommendation: 'Атакуй героя без диспела, заранее сохранив безопасный Blink-маршрут.' },
      { id: 'bkb_scepter', name: 'BKB + Aghanim teamfight window', priority: 97, trigger: { items: ['bkb','scepter'] }, expectedMinute: 25, permanent: { fight: 24, survival: 22, mobility: 8 }, window: { fight: 24, objective: 9 }, actions: { FIGHT: 26, OBJECTIVE: 9 }, recommendation: 'Форсируй драку после раскрытия ключевого контроля противника.' }
    ]
  },
  {
    id: 'storm_spirit', displayName: 'Storm Spirit', preset: 'mobile_caster',
    vulnerabilities: ['silence', 'instant_disable', 'mana_pressure'],
    basePower: { fight: 72, initiation: 79, mobility: 94, survival: 48 },
    buildPlans: [
      { id: 'orchid_bkb_bloodthorn', name: 'Orchid → BKB → Bloodthorn', items: ['orchid','bkb','bloodthorn','scepter'] },
      { id: 'orchid_linken_scepter', name: 'Orchid → Linken → Aghanim', items: ['orchid','linken','scepter','bloodthorn'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Ball Lightning online', priority: 68, trigger: { level: 6 }, expectedMinute: 6.5, requiresUltimate: true, permanent: { mobility: 18, initiation: 13 }, window: { connect: 20, fight: 14 }, actions: { CONNECT: 21, FIGHT: 14 }, recommendation: 'Подключайся только с достаточной mana для входа, убийства и выхода.' },
      { id: 'orchid', name: 'Orchid pickoff timing', priority: 88, trigger: { item: 'orchid' }, expectedMinute: 14.5, permanent: { initiation: 20, fight: 15 }, window: { fight: 22, connect: 16 }, actions: { FIGHT: 23, CONNECT: 16 }, recommendation: 'Ищи одиночную цель без мгновенного диспела и контролируй расход mana.' },
      { id: 'bkb_bloodthorn', name: 'BKB + Bloodthorn full commit', priority: 98, trigger: { items: ['bkb','bloodthorn'] }, expectedMinute: 28, permanent: { fight: 25, survival: 23, initiation: 8 }, window: { fight: 25, objective: 8 }, actions: { FIGHT: 28, OBJECTIVE: 8 }, recommendation: 'Начинай по ключевой задней цели после раскрытия позиции остальных врагов.' }
    ]
  },
  {
    id: 'void_spirit', displayName: 'Void Spirit', preset: 'mobile_caster',
    vulnerabilities: ['silence', 'instant_disable', 'burst'],
    basePower: { fight: 73, initiation: 76, mobility: 88, survival: 56 },
    buildPlans: [
      { id: 'orchid_bkb_scepter', name: 'Orchid → BKB → Aghanim', items: ['orchid','bkb','scepter','bloodthorn'] },
      { id: 'maelstrom_bkb_scepter', name: 'Maelstrom → BKB → Aghanim', items: ['maelstrom','bkb','scepter','daedalus'] }
    ],
    spikes: [
      { id: 'level_6', name: 'Astral Step charges', priority: 67, trigger: { level: 6 }, expectedMinute: 6.5, requiresUltimate: true, permanent: { mobility: 16, initiation: 11 }, window: { connect: 18, fight: 15 }, actions: { CONNECT: 19, FIGHT: 15 }, recommendation: 'Используй одну charge для входа только когда вторая сохраняет выход.' },
      { id: 'orchid', name: 'Orchid backline timing', priority: 85, trigger: { item: 'orchid' }, expectedMinute: 14.5, permanent: { initiation: 19, fight: 14 }, window: { fight: 21, pressure: 8 }, actions: { FIGHT: 22, PRESSURE: 8 }, recommendation: 'Выбирай цель без диспела и не задерживайся после первого burst-цикла.' },
      { id: 'bkb_scepter', name: 'BKB + Aghanim disruption window', priority: 97, trigger: { items: ['bkb','scepter'] }, expectedMinute: 25, permanent: { fight: 23, survival: 23, initiation: 9 }, window: { fight: 24, objective: 8 }, actions: { FIGHT: 26, OBJECTIVE: 8 }, recommendation: 'Форсируй командную драку, чередуя контроль и безопасное перепозиционирование.' }
    ]
  },
  {
    id: 'zeus', displayName: 'Zeus', preset: 'artillery_caster',
    vulnerabilities: ['gap_close', 'silence', 'burst'],
    basePower: { fight: 76, farm: 64, push: 54, mobility: 38, initiation: 47 },
    buildPlans: [
      { id: 'scepter_refresher_bkb', name: 'Aghanim → Refresher → BKB', items: ['scepter','refresher','bkb','bloodthorn'] },
      { id: 'travel_scepter_refresher', name: 'Travels → Aghanim → Refresher', items: ['travel_boots','scepter','refresher','bkb'] }
    ],
    spikes: [
      { id: 'level_6', name: "Thundergod's Wrath level 1", priority: 63, trigger: { level: 6 }, expectedMinute: 6.5, requiresUltimate: true, permanent: { fight: 8, initiation: 5 }, window: { connect: 15, fight: 11 }, actions: { CONNECT: 16, FIGHT: 11 }, recommendation: 'Синхронизируй глобальный урон с уже начатым действием союзников.' },
      { id: 'scepter', name: 'Aghanim global pressure', priority: 88, trigger: { item: 'scepter' }, expectedMinute: 18, permanent: { fight: 18, push: 8, objective: 6 }, window: { connect: 18, pressure: 12 }, actions: { CONNECT: 19, PRESSURE: 12 }, recommendation: 'Создавай глобальное численное преимущество, не покидая безопасную позицию.' },
      { id: 'refresher_bkb', name: 'Refresher + BKB decisive fight', priority: 98, trigger: { items: ['refresher','bkb'] }, expectedMinute: 30, permanent: { fight: 28, survival: 22, objective: 10 }, window: { fight: 25, objective: 12 }, actions: { FIGHT: 28, OBJECTIVE: 12 }, recommendation: 'Форсируй решающую драку вокруг обзора и заранее подготовленной позиции.' }
    ]
  }
]);

export const MID_PROFILE_IDS = Object.freeze(CONFIGS.map((config) => config.id));

export function createMidProfilePack({ ITEMS, benchmark, condition }) {
  return Object.fromEntries(CONFIGS.map((config) => [
    config.id,
    makeProfile(config, { items: ITEMS, benchmark, condition })
  ]));
}
