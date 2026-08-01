import { HERO_CATALOG, HERO_PROFILE_TIERS, getHeroCatalogEntry, resolveHeroId } from './hero-catalog.mjs';
import { createCarryProfilePack } from './carry-profile-pack.mjs';

const ITEMS = {
  abyssal: { id: 'item_abyssal_blade', name: 'Abyssal Blade', cost: 6250 },
  armlet: { id: 'item_armlet', name: 'Armlet of Mordiggian', cost: 2500 },
  assault_cuirass: { id: 'item_assault', name: 'Assault Cuirass', cost: 5125 },
  battle_fury: { id: 'item_bfury', name: 'Battle Fury', cost: 4100 },
  basher: { id: 'item_basher', name: 'Skull Basher', cost: 2875 },
  bkb: { id: 'item_black_king_bar', name: 'Black King Bar', cost: 4050 },
  blade_mail: { id: 'item_blade_mail', name: 'Blade Mail', cost: 2300 },
  blink: { id: 'item_blink', name: 'Blink Dagger', cost: 2250 },
  bloodthorn: { id: 'item_bloodthorn', name: 'Bloodthorn', cost: 6625 },
  butterfly: { id: 'item_butterfly', name: 'Butterfly', cost: 5450 },
  daedalus: { id: 'item_greater_crit', name: 'Daedalus', cost: 5100 },
  desolator: { id: 'item_desolator', name: 'Desolator', cost: 3500 },
  diffusal: { id: 'item_diffusal_blade', name: 'Diffusal Blade', cost: 2500 },
  dragon_lance: { id: 'item_dragon_lance', name: 'Dragon Lance', cost: 1900 },
  echo_sabre: { id: 'item_echo_sabre', name: 'Echo Sabre', cost: 2700 },
  gleipnir: { id: 'item_gungir', name: 'Gleipnir', cost: 5450 },
  hand_of_midas: { id: 'item_hand_of_midas', name: 'Hand of Midas', cost: 2200 },
  heart: { id: 'item_heart', name: 'Heart of Tarrasque', cost: 5200 },
  hurricane_pike: { id: 'item_hurricane_pike', name: 'Hurricane Pike', cost: 4450 },
  linken: { id: 'item_sphere', name: "Linken's Sphere", cost: 4800 },
  manta: { id: 'item_manta', name: 'Manta Style', cost: 4650 },
  mask_of_madness: { id: 'item_mask_of_madness', name: 'Mask of Madness', cost: 1900 },
  maelstrom: { id: 'item_maelstrom', name: 'Maelstrom', cost: 2950 },
  mjollnir: { id: 'item_mjollnir', name: 'Mjollnir', cost: 5500 },
  orchid: { id: 'item_orchid', name: 'Orchid Malevolence', cost: 3275 },
  radiance: { id: 'item_radiance', name: 'Radiance', cost: 4700 },
  refresher: { id: 'item_refresher', name: 'Refresher Orb', cost: 5000 },
  sange_and_yasha: { id: 'item_sange_and_yasha', name: 'Sange and Yasha', cost: 4100 },
  satanic: { id: 'item_satanic', name: 'Satanic', cost: 5050 },
  scepter: { id: 'item_ultimate_scepter', name: "Aghanim's Scepter", cost: 4200 },
  skadi: { id: 'item_skadi', name: 'Eye of Skadi', cost: 5300 },
  travel_boots: { id: 'item_travel_boots', name: 'Boots of Travel', cost: 2500 }
};

const benchmark = (points) => points.map(([minute, gpm, level]) => ({ minute, gpm, level }));
const condition = (type, value) => ({ type, value });

const detailedProfiles = {
  luna: {
    id: 'luna', displayName: 'Luna', role: 'carry',
    archetypes: ['flash_farmer', 'illusion_pusher', 'teamfight_carry'],
    vulnerabilities: ['control', 'burst'],
    basePower: { farm: 76, fight: 43, push: 68, survival: 42, initiation: 18, objective: 52, mobility: 36 },
    stageCurves: {
      early: { farm: -8, fight: -5, push: -4 },
      mid: { farm: 10, fight: 10, push: 13, objective: 8 },
      late: { fight: 15, push: 13, survival: 8, objective: 10 }
    },
    benchmarks: benchmark([[5,360,5],[10,480,8],[15,570,12],[20,640,16],[25,690,19],[30,720,22],[40,760,26]]),
    buildPlans: [
      { id: 'manta_bkb', name: 'Manta → BKB', items: [ITEMS.mask_of_madness, ITEMS.manta, ITEMS.bkb, ITEMS.satanic] }
    ],
    spikes: [
      {
        id: 'luna_level_6', name: 'Eclipse level 1', priority: 45,
        trigger: { all: [condition('level_gte', 6)] }, expectedMinute: 7, earlyToleranceMin: 1.2, lateToleranceMin: 2.5,
        activeDurationSec: 150, fadeDurationSec: 120,
        requires: [{ type: 'ultimate_ready', message: 'Eclipse должен быть готов' }],
        permanent: { fight: 5 }, window: { fight: 15, connect: 14 },
        actions: { FIGHT: 12, CONNECT: 14 }, recommendation: 'Используй Eclipse вместе с контролем союзников.'
      },
      {
        id: 'luna_manta', name: 'Manta Style', priority: 80,
        trigger: { all: [condition('item_owned', ITEMS.manta.id)] }, expectedMinute: 17, earlyToleranceMin: 2.2, lateToleranceMin: 3.5,
        activeDurationSec: 270, fadeDurationSec: 210,
        permanent: { farm: 18, push: 20, survival: 7, mobility: 5 },
        window: { pressure: 20, connect: 8, fight: 6 },
        actions: { FARM: 8, PRESSURE: 22, CONNECT: 8 }, recommendation: 'Ускорь карту иллюзиями и дави безопасные линии.'
      },
      {
        id: 'luna_bkb_combo', name: 'Manta + BKB', priority: 95,
        trigger: { all: [condition('item_owned', ITEMS.manta.id), condition('item_owned', ITEMS.bkb.id)] }, expectedMinute: 23, earlyToleranceMin: 2.5, lateToleranceMin: 4,
        activeDurationSec: 300, fadeDurationSec: 240,
        requires: [{ type: 'min_health_pct', value: 0.6, message: 'Нужно восстановить здоровье перед дракой' }],
        permanent: { fight: 18, survival: 22, push: 8 },
        window: { fight: 20, connect: 18, objective: 12 },
        actions: { FIGHT: 24, CONNECT: 20, OBJECTIVE: 12 }, recommendation: 'Собирайся с командой и конвертируй BKB в объект.'
      }
    ]
  },

  juggernaut: {
    id: 'juggernaut', displayName: 'Juggernaut', role: 'carry',
    archetypes: ['hybrid_carry', 'sustain_pusher', 'pickoff_carry'],
    vulnerabilities: ['kite'],
    basePower: { farm: 62, fight: 58, push: 64, survival: 64, initiation: 28, objective: 65, mobility: 52 },
    stageCurves: {
      early: { fight: 7, survival: 7 },
      mid: { farm: 8, fight: 12, push: 10, objective: 9 },
      late: { fight: 10, push: 8, objective: 9 }
    },
    benchmarks: benchmark([[5,350,5],[10,460,8],[15,540,12],[20,610,16],[25,660,19],[30,700,22],[40,735,26]]),
    buildPlans: [
      { id: 'maelstrom_manta', name: 'Maelstrom → Manta', items: [ITEMS.maelstrom, ITEMS.manta, ITEMS.bkb, ITEMS.scepter] },
      { id: 'diffusal_manta', name: 'Diffusal → Manta', items: [ITEMS.diffusal, ITEMS.manta, ITEMS.bkb, ITEMS.scepter] }
    ],
    spikes: [
      {
        id: 'jugg_level_6', name: 'Omnislash level 1', priority: 55,
        trigger: { all: [condition('level_gte', 6)] }, expectedMinute: 7, earlyToleranceMin: 1, lateToleranceMin: 2.5,
        activeDurationSec: 180, fadeDurationSec: 120,
        requires: [{ type: 'ultimate_ready', message: 'Omnislash должен быть готов' }],
        permanent: { fight: 5 }, window: { fight: 20, connect: 11 },
        actions: { FIGHT: 18, CONNECT: 10 }, recommendation: 'Ищи малочисленную цель без крипов рядом.'
      },
      {
        id: 'jugg_diffusal', name: 'Diffusal tempo', priority: 72,
        trigger: { all: [condition('item_owned', ITEMS.diffusal.id)] }, expectedMinute: 13, earlyToleranceMin: 1.8, lateToleranceMin: 3,
        activeDurationSec: 300, fadeDurationSec: 180,
        permanent: { fight: 13, mobility: 8 }, window: { fight: 17, pressure: 8 },
        actions: { FIGHT: 18, CONNECT: 10, PRESSURE: 7 }, recommendation: 'Используй ранний Diffusal для убийств и внешних башен.'
      },
      {
        id: 'jugg_manta', name: 'Manta Style', priority: 78,
        trigger: { all: [condition('item_owned', ITEMS.manta.id)] }, expectedMinute: 19, earlyToleranceMin: 2.2, lateToleranceMin: 3.5,
        activeDurationSec: 260, fadeDurationSec: 220,
        permanent: { farm: 12, push: 14, survival: 11 }, window: { fight: 10, pressure: 13 },
        actions: { PRESSURE: 14, CONNECT: 10, FIGHT: 8 }, recommendation: 'Дави линии и подключайся с готовым Omnislash.'
      }
    ]
  },

  sven: {
    id: 'sven', displayName: 'Sven', role: 'carry',
    archetypes: ['flash_farmer', 'burst_carry', 'teamfight_carry'],
    vulnerabilities: ['kite', 'control'],
    basePower: { farm: 73, fight: 54, push: 55, survival: 62, initiation: 34, objective: 58, mobility: 30 },
    stageCurves: {
      early: { farm: -5, fight: -3 },
      mid: { farm: 12, fight: 14, objective: 8 },
      late: { fight: 15, survival: 10, objective: 10 }
    },
    benchmarks: benchmark([[5,355,5],[10,470,8],[15,555,12],[20,625,16],[25,680,19],[30,715,22],[40,750,26]]),
    buildPlans: [
      { id: 'mom_bkb', name: 'MoM → BKB', items: [ITEMS.mask_of_madness, ITEMS.blink, ITEMS.bkb, ITEMS.satanic] }
    ],
    spikes: [
      {
        id: 'sven_gods_strength', name: "God's Strength", priority: 58,
        trigger: { all: [condition('level_gte', 6)] }, expectedMinute: 7.5, earlyToleranceMin: 1.2, lateToleranceMin: 2.5,
        activeDurationSec: 180, fadeDurationSec: 120,
        requires: [{ type: 'ultimate_ready', message: "God's Strength должен быть готов" }],
        permanent: { fight: 6, farm: 4 }, window: { fight: 19, objective: 10 },
        actions: { FIGHT: 14, OBJECTIVE: 10 }, recommendation: 'Дерись только с готовым ультимейтом или забирай быстрый объект.'
      },
      {
        id: 'sven_blink', name: 'Blink Dagger', priority: 72,
        trigger: { all: [condition('item_owned', ITEMS.blink.id)] }, expectedMinute: 16, earlyToleranceMin: 2, lateToleranceMin: 3.5,
        activeDurationSec: 260, fadeDurationSec: 180,
        permanent: { initiation: 28, mobility: 16 }, window: { fight: 16, connect: 19 },
        requires: [{ type: 'ultimate_ready', message: 'Без ультимейта Blink не даёт полного окна силы' }],
        actions: { CONNECT: 22, FIGHT: 18 }, recommendation: 'Перестань показываться на линиях и играй от внезапного входа.'
      },
      {
        id: 'sven_bkb', name: 'Blink + BKB', priority: 96,
        trigger: { all: [condition('item_owned', ITEMS.blink.id), condition('item_owned', ITEMS.bkb.id)] }, expectedMinute: 22, earlyToleranceMin: 2.5, lateToleranceMin: 4,
        activeDurationSec: 300, fadeDurationSec: 240,
        requires: [{ type: 'ultimate_ready', message: "God's Strength должен быть готов" }],
        permanent: { fight: 20, survival: 25, initiation: 7 }, window: { fight: 24, connect: 20, objective: 12 },
        actions: { FIGHT: 28, CONNECT: 20, OBJECTIVE: 12 }, recommendation: 'Это главное окно: форсируй драку вокруг объекта.'
      }
    ]
  },

  ursa: {
    id: 'ursa', displayName: 'Ursa', role: 'carry',
    archetypes: ['fighting_carry', 'roshan_specialist', 'pickoff_carry'],
    vulnerabilities: ['kite', 'control'],
    basePower: { farm: 48, fight: 73, push: 40, survival: 66, initiation: 26, objective: 86, mobility: 38 },
    stageCurves: {
      early: { fight: 10, objective: 12 },
      mid: { fight: 16, objective: 15, survival: 7 },
      late: { fight: 3, objective: 5, survival: 8 }
    },
    benchmarks: benchmark([[5,330,5],[10,425,8],[15,505,12],[20,570,16],[25,620,19],[30,655,22],[40,690,26]]),
    buildPlans: [
      { id: 'blink_basher', name: 'Blink → Basher', items: [ITEMS.diffusal, ITEMS.blink, ITEMS.bkb, ITEMS.basher] }
    ],
    spikes: [
      {
        id: 'ursa_level_6', name: 'Enrage + early Roshan', priority: 67,
        trigger: { all: [condition('level_gte', 6)] }, expectedMinute: 7, earlyToleranceMin: 1, lateToleranceMin: 2,
        activeDurationSec: 240, fadeDurationSec: 150,
        requires: [{ type: 'ultimate_ready', message: 'Enrage должен быть готов' }],
        permanent: { fight: 8, objective: 10 }, window: { fight: 15, objective: 22 },
        actions: { OBJECTIVE: 24, FIGHT: 14 }, recommendation: 'Проверь возможность раннего Roshan или убийства рядом с командой.'
      },
      {
        id: 'ursa_blink', name: 'Blink Dagger', priority: 91,
        trigger: { all: [condition('item_owned', ITEMS.blink.id)] }, expectedMinute: 14, earlyToleranceMin: 2, lateToleranceMin: 3,
        activeDurationSec: 300, fadeDurationSec: 180,
        permanent: { initiation: 32, mobility: 18, fight: 8 }, window: { fight: 25, objective: 18, connect: 21 },
        requires: [{ type: 'ultimate_ready', message: 'Enrage должен быть готов для надёжного входа' }],
        actions: { FIGHT: 27, OBJECTIVE: 22, CONNECT: 20 }, recommendation: 'Не продолжай пассивный фарм: Blink должен дать убийство или Roshan.'
      },
      {
        id: 'ursa_bkb_basher', name: 'BKB + Basher', priority: 98,
        trigger: { all: [condition('item_owned', ITEMS.bkb.id), condition('item_owned', ITEMS.basher.id)] }, expectedMinute: 25, earlyToleranceMin: 3, lateToleranceMin: 5,
        activeDurationSec: 330, fadeDurationSec: 240,
        permanent: { fight: 22, survival: 24, objective: 12 }, window: { fight: 18, objective: 16 },
        actions: { FIGHT: 22, OBJECTIVE: 18 }, recommendation: 'Играй вокруг Roshan и ключевых вражеских core.'
      }
    ]
  },

  phantom_assassin: {
    id: 'phantom_assassin', displayName: 'Phantom Assassin', role: 'carry',
    archetypes: ['burst_carry', 'late_game_carry', 'backline_diver'],
    vulnerabilities: ['control', 'burst', 'save'],
    basePower: { farm: 52, fight: 49, push: 38, survival: 38, initiation: 42, objective: 42, mobility: 62 },
    stageCurves: {
      early: { fight: -8, survival: -6 },
      mid: { farm: 9, fight: 12, initiation: 8 },
      late: { fight: 24, survival: 15, objective: 10 }
    },
    benchmarks: benchmark([[5,340,5],[10,450,8],[15,530,12],[20,600,16],[25,655,19],[30,700,22],[40,745,26]]),
    buildPlans: [
      { id: 'bf_desolator_bkb', name: 'Battle Fury → Desolator → BKB', items: [ITEMS.battle_fury, ITEMS.desolator, ITEMS.bkb, ITEMS.basher] }
    ],
    spikes: [
      {
        id: 'pa_battle_fury', name: 'Battle Fury', priority: 62,
        trigger: { all: [condition('item_owned', ITEMS.battle_fury.id)] }, expectedMinute: 15, earlyToleranceMin: 2, lateToleranceMin: 3.5,
        activeDurationSec: 360, fadeDurationSec: 240,
        permanent: { farm: 28, objective: 4 }, window: { farm: 18 },
        actions: { FARM: 28 }, recommendation: 'Ускорь экономику; это ещё не обязательный момент для 5v5.'
      },
      {
        id: 'pa_desolator', name: 'Battle Fury + Desolator', priority: 80,
        trigger: { all: [condition('item_owned', ITEMS.battle_fury.id), condition('item_owned', ITEMS.desolator.id)] }, expectedMinute: 21, earlyToleranceMin: 2.5, lateToleranceMin: 4,
        activeDurationSec: 260, fadeDurationSec: 180,
        permanent: { fight: 18, objective: 14 }, window: { fight: 18, pressure: 8 },
        actions: { FIGHT: 15, CONNECT: 10, OBJECTIVE: 9 }, recommendation: 'Ищи мягкие цели, но не заходи первым против контроля.'
      },
      {
        id: 'pa_bkb_combo', name: 'Desolator + BKB', priority: 99,
        trigger: { all: [condition('item_owned', ITEMS.desolator.id), condition('item_owned', ITEMS.bkb.id)] }, expectedMinute: 25, earlyToleranceMin: 3, lateToleranceMin: 5,
        activeDurationSec: 330, fadeDurationSec: 240,
        permanent: { fight: 26, survival: 28, initiation: 8, objective: 10 },
        window: { fight: 24, connect: 18 },
        actions: { FIGHT: 30, CONNECT: 20, OBJECTIVE: 10 }, recommendation: 'Главное окно для прыжка в заднюю линию и взятия объекта.'
      }
    ]
  }
 };

const BASELINE_TEMPLATES = {
  hard_carry: {
    archetypes: ['scaling_carry', 'economy_core'],
    vulnerabilities: ['control', 'burst'],
    basePower: { farm: 70, fight: 47, push: 57, survival: 47, initiation: 24, objective: 58, mobility: 44 },
    stageCurves: {
      early: { farm: -4, fight: -9, survival: -4 },
      mid: { farm: 10, fight: 8, push: 8, objective: 6 },
      late: { fight: 20, push: 12, survival: 12, objective: 10 }
    },
    benchmarks: [[5,340,5],[10,450,8],[15,530,12],[20,600,16],[25,650,19],[30,690,22],[40,735,26]],
    spikeWindows: [
      { level: 6, name: 'Первый уровень ультимейта', priority: 38, permanent: { fight: 4 }, window: { fight: 8, connect: 5 }, actions: { FIGHT: 6, CONNECT: 5 }, recommendation: 'Используй ультимейт только в выгодном локальном эпизоде.' },
      { level: 12, name: 'Средняя стадия развития', priority: 54, permanent: { farm: 8, fight: 7 }, window: { farm: 8, pressure: 5 }, actions: { FARM: 9, PRESSURE: 5 }, recommendation: 'Сохраняй экономический темп и избегай ненужных 5v5.' },
      { level: 18, name: 'Поздний уровень ультимейта', priority: 70, permanent: { fight: 12, objective: 8 }, window: { fight: 10, objective: 7 }, actions: { FIGHT: 9, OBJECTIVE: 7 }, recommendation: 'Ищи действие вместе с командой вокруг важного объекта.' }
    ]
  },
  tempo_core: {
    archetypes: ['tempo_core', 'skirmisher'],
    vulnerabilities: ['control'],
    basePower: { farm: 57, fight: 61, push: 51, survival: 51, initiation: 49, objective: 49, mobility: 62 },
    stageCurves: {
      early: { fight: 4, mobility: 4 },
      mid: { fight: 15, initiation: 10, pressure: 8 },
      late: { fight: 8, survival: 8, objective: 5 }
    },
    benchmarks: [[5,335,5],[10,440,8],[15,515,12],[20,580,16],[25,625,19],[30,665,22],[40,705,26]],
    spikeWindows: [
      { level: 6, name: 'Первый темповый уровень', priority: 52, permanent: { fight: 6 }, window: { fight: 13, connect: 10 }, actions: { FIGHT: 11, CONNECT: 10 }, recommendation: 'Ищи короткое действие, не ломая собственную экономику.' },
      { level: 12, name: 'Средний темповый пик', priority: 68, permanent: { fight: 10, mobility: 6 }, window: { fight: 15, connect: 12, pressure: 7 }, actions: { FIGHT: 14, CONNECT: 12, PRESSURE: 7 }, recommendation: 'Конвертируй мобильность в убийство или внешний объект.' },
      { level: 18, name: 'Поздний боевой уровень', priority: 72, permanent: { fight: 10, survival: 8 }, window: { fight: 10, objective: 6 }, actions: { FIGHT: 9, OBJECTIVE: 6 }, recommendation: 'Играй от готовых ресурсов команды, а не в одиночку.' }
    ]
  },
  caster_core: {
    archetypes: ['caster_core', 'magic_tempo'],
    vulnerabilities: ['burst', 'control'],
    basePower: { farm: 59, fight: 63, push: 49, survival: 42, initiation: 54, objective: 43, mobility: 52 },
    stageCurves: {
      early: { fight: 4 },
      mid: { farm: 8, fight: 16, initiation: 9 },
      late: { fight: 10, survival: 7, objective: 4 }
    },
    benchmarks: [[5,340,5],[10,455,8],[15,535,12],[20,595,16],[25,640,19],[30,680,22],[40,720,26]],
    spikeWindows: [
      { level: 6, name: 'Ультимейт доступен', priority: 55, permanent: { fight: 7 }, window: { fight: 14, connect: 9 }, actions: { FIGHT: 12, CONNECT: 9 }, recommendation: 'Используй первый ультимейт для контролируемого действия.' },
      { level: 12, name: 'Усиление основных заклинаний', priority: 70, permanent: { fight: 12, farm: 6 }, window: { fight: 14, pressure: 7 }, actions: { FIGHT: 13, PRESSURE: 7 }, recommendation: 'Дави темп, пока магический урон особенно эффективен.' },
      { level: 18, name: 'Максимальный уровень ультимейта', priority: 76, permanent: { fight: 13, initiation: 6 }, window: { fight: 12, objective: 5 }, actions: { FIGHT: 11, OBJECTIVE: 5 }, recommendation: 'Собирайся под ключевой cooldown и объект.' }
    ]
  },
  initiator: {
    archetypes: ['initiator', 'teamfight_enabler'],
    vulnerabilities: ['burst'],
    basePower: { farm: 43, fight: 64, push: 43, survival: 63, initiation: 75, objective: 50, mobility: 45 },
    stageCurves: {
      early: { fight: 5, survival: 4 },
      mid: { fight: 14, initiation: 14, objective: 6 },
      late: { fight: 8, survival: 10, initiation: 5 }
    },
    benchmarks: [[5,305,5],[10,390,8],[15,455,11],[20,510,15],[25,555,18],[30,590,21],[40,635,25]],
    spikeWindows: [
      { level: 6, name: 'Первое окно инициации', priority: 62, permanent: { initiation: 8, fight: 5 }, window: { connect: 17, fight: 12 }, actions: { CONNECT: 17, FIGHT: 11 }, recommendation: 'Покажись команде и подготовь контролируемый вход.' },
      { level: 12, name: 'Средний командный пик', priority: 70, permanent: { initiation: 10, survival: 7 }, window: { connect: 16, fight: 14, objective: 6 }, actions: { CONNECT: 16, FIGHT: 13, OBJECTIVE: 6 }, recommendation: 'Играй первым номером только при готовности союзников.' },
      { level: 18, name: 'Позднее командное окно', priority: 72, permanent: { fight: 10, survival: 10 }, window: { fight: 10, objective: 7 }, actions: { FIGHT: 9, OBJECTIVE: 7 }, recommendation: 'Сохраняй ключевой контроль для решающей цели.' }
    ]
  },
  durable: {
    archetypes: ['durable_core', 'frontliner'],
    vulnerabilities: ['kite'],
    basePower: { farm: 52, fight: 63, push: 54, survival: 73, initiation: 51, objective: 56, mobility: 37 },
    stageCurves: {
      early: { survival: 7, fight: 4 },
      mid: { fight: 13, survival: 10, pressure: 7 },
      late: { fight: 8, push: 7, objective: 7 }
    },
    benchmarks: [[5,325,5],[10,420,8],[15,495,12],[20,555,16],[25,600,19],[30,640,22],[40,680,26]],
    spikeWindows: [
      { level: 6, name: 'Первое окно стойкости', priority: 50, permanent: { survival: 8, fight: 4 }, window: { fight: 10, pressure: 6 }, actions: { FIGHT: 8, PRESSURE: 6 }, recommendation: 'Занимай пространство, но не преследуй цели слишком глубоко.' },
      { level: 12, name: 'Средний фронтлайн-пик', priority: 67, permanent: { survival: 12, fight: 8 }, window: { fight: 13, pressure: 10, objective: 7 }, actions: { FIGHT: 12, PRESSURE: 10, OBJECTIVE: 7 }, recommendation: 'Используй стойкость для захвата опасной зоны карты.' },
      { level: 18, name: 'Поздняя стойкость', priority: 71, permanent: { survival: 12, fight: 9 }, window: { fight: 9, objective: 8 }, actions: { FIGHT: 8, OBJECTIVE: 8 }, recommendation: 'Стой впереди, сохраняя пути отхода для команды.' }
    ]
  },
  pusher: {
    archetypes: ['map_controller', 'pusher'],
    vulnerabilities: ['burst', 'control'],
    basePower: { farm: 66, fight: 49, push: 75, survival: 45, initiation: 34, objective: 69, mobility: 50 },
    stageCurves: {
      early: { push: 5, farm: 4 },
      mid: { farm: 10, push: 16, objective: 11 },
      late: { fight: 8, push: 12, objective: 8 }
    },
    benchmarks: [[5,340,5],[10,455,8],[15,540,12],[20,605,16],[25,655,19],[30,695,22],[40,730,26]],
    spikeWindows: [
      { level: 6, name: 'Первое окно давления', priority: 48, permanent: { push: 7 }, window: { pressure: 13, objective: 8 }, actions: { PRESSURE: 13, OBJECTIVE: 8 }, recommendation: 'Переведи способность в давление по линии или строению.' },
      { level: 12, name: 'Средний пик контроля карты', priority: 70, permanent: { farm: 8, push: 12 }, window: { pressure: 17, objective: 11 }, actions: { PRESSURE: 17, OBJECTIVE: 11 }, recommendation: 'Растягивай карту, не отдавая героя без информации.' },
      { level: 18, name: 'Поздний push-пик', priority: 74, permanent: { push: 13, fight: 7 }, window: { pressure: 14, objective: 10 }, actions: { PRESSURE: 14, OBJECTIVE: 10 }, recommendation: 'Конвертируй преимущество в строения и контроль территории.' }
    ]
  },
  support: {
    archetypes: ['support', 'team_enabler'],
    vulnerabilities: ['burst'],
    basePower: { farm: 30, fight: 57, push: 38, survival: 37, initiation: 48, objective: 42, mobility: 40 },
    stageCurves: {
      early: { fight: 8, initiation: 5 },
      mid: { fight: 11, initiation: 8, objective: 5 },
      late: { fight: 7, survival: 5 }
    },
    benchmarks: [[5,260,4],[10,320,7],[15,370,10],[20,410,13],[25,445,16],[30,475,18],[40,520,22]],
    spikeWindows: [
      { level: 6, name: 'Ключевой командный cooldown', priority: 58, permanent: { fight: 6, initiation: 5 }, window: { connect: 15, fight: 12 }, actions: { CONNECT: 15, FIGHT: 10 }, recommendation: 'Играй рядом с союзным core и используй ключевой cooldown.' },
      { level: 12, name: 'Среднее усиление поддержки', priority: 63, permanent: { fight: 8, survival: 4 }, window: { connect: 13, objective: 7 }, actions: { CONNECT: 13, OBJECTIVE: 7 }, recommendation: 'Подготовь обзор и ресурсы перед командным действием.' },
      { level: 18, name: 'Поздний командный уровень', priority: 68, permanent: { fight: 9, initiation: 5 }, window: { connect: 11, fight: 9 }, actions: { CONNECT: 11, FIGHT: 8 }, recommendation: 'Сохраняй позицию и ключевую способность для своего core.' }
    ]
  }
};

function baselineSpikes(entry, template) {
  return template.spikeWindows.map((spike, index) => ({
    id: `${entry.id}_baseline_level_${spike.level}`,
    name: spike.name,
    priority: spike.priority,
    trigger: { all: [condition('level_gte', spike.level)] },
    expectedMinute: index === 0 ? 8 : index === 1 ? 17 : 28,
    earlyToleranceMin: index === 0 ? 1.5 : 2.5,
    lateToleranceMin: index === 0 ? 3 : 5,
    activeDurationSec: index === 0 ? 180 : 240,
    fadeDurationSec: index === 0 ? 150 : 210,
    ...(index === 0 ? { requires: [{ type: 'ultimate_ready', message: 'Ключевая способность должна быть готова' }] } : {}),
    permanent: spike.permanent,
    window: spike.window,
    actions: spike.actions,
    recommendation: spike.recommendation,
    generic: true
  }));
}

function makeBaselineProfile(entry) {
  const template = BASELINE_TEMPLATES[entry.profileTemplate];
  return {
    id: entry.id,
    displayName: entry.displayName,
    role: entry.primaryRole,
    roles: entry.roles,
    archetypes: template.archetypes,
    vulnerabilities: template.vulnerabilities,
    basePower: template.basePower,
    stageCurves: template.stageCurves,
    benchmarks: benchmark(template.benchmarks),
    buildPlans: [
      {
        id: 'baseline_manual',
        name: 'Baseline — предметный план после live-калибровки',
        items: [],
        generic: true
      }
    ],
    spikes: baselineSpikes(entry, template),
    draftTags: entry.draftTags,
    profileTemplate: entry.profileTemplate,
    calibrationTier: HERO_PROFILE_TIERS.BASELINE,
    profileConfidence: 0.62
  };
}

function enrichDetailedProfile(entry, profile) {
  return {
    ...profile,
    roles: entry.roles,
    draftTags: entry.draftTags,
    profileTemplate: entry.profileTemplate,
    calibrationTier: HERO_PROFILE_TIERS.DETAILED,
    profileConfidence: 0.96
  };
}

Object.assign(detailedProfiles, createCarryProfilePack({ ITEMS, benchmark, condition }));

const profiles = Object.fromEntries(HERO_CATALOG.map((entry) => [
  entry.id,
  detailedProfiles[entry.id]
    ? enrichDetailedProfile(entry, detailedProfiles[entry.id])
    : makeBaselineProfile(entry)
]));

export function getHeroProfile(hero) {
  const key = resolveHeroId(hero);
  if (key && profiles[key]) return profiles[key];
  return {
    id: 'unknown', displayName: 'Unknown hero', role: 'unknown', roles: [], calibrationTier: 'BASELINE', profileTier: 'BASELINE',
    profileTemplate: 'unknown_safe', archetypes: [], vulnerabilities: [], basePower: { farm: 35, fight: 30, push: 25, survival: 30, initiation: 20, objective: 20, mobility: 25 },
    stageCurves: { early: {}, mid: {}, late: {} }, benchmarks: [{ minute: 0, gpm: 0, level: 1 }],
    buildPlans: [{ id: 'unknown_manual', name: 'Unknown — ручной план', items: [], generic: true }], powerSpikes: [],
    balanceCalibration: 'unavailable', limitations: ['Hero id is not recognized; no specific profile was substituted']
  };
}

export function listHeroProfiles() {
  return HERO_CATALOG.map((entry) => profiles[entry.id]);
}

export function getBuildPlan(hero, planId) {
  const profile = getHeroProfile(hero);
  return profile.buildPlans.find((plan) => plan.id === planId)
    ?? profile.buildPlans[0]
    ?? { id: 'baseline_manual', name: 'Baseline — без предметного плана', items: [], generic: true };
}

export function getHeroProfileSummary(hero) {
  const profile = getHeroProfile(hero);
  const catalog = getHeroCatalogEntry(profile.id);
  return {
    id: profile.id,
    displayName: profile.displayName,
    calibrationTier: profile.calibrationTier,
    profileTemplate: profile.profileTemplate,
    primaryRole: catalog?.primaryRole ?? profile.role,
    roles: profile.roles ?? []
  };
}

function toTargetItem(item) {
  if (!item) return null;
  return { id: item.id, name: item.name, totalCost: item.cost, ownedValue: 0 };
}

export function nextBuildPlanTarget(hero, inventory = [], planId, currentTargetId = null) {
  const plan = getBuildPlan(hero, planId);
  const items = Array.isArray(plan?.items) ? plan.items : [];
  if (!items.length) return null;
  const owned = new Set(inventory.map((item) => item.id));
  const currentIndex = items.findIndex((item) => item.id === currentTargetId);
  const searchStart = currentIndex >= 0 ? currentIndex + 1 : 0;
  const nextItem = items.slice(searchStart).find((item) => !owned.has(item.id))
    ?? items.slice(0, searchStart).find((item) => !owned.has(item.id));
  return toTargetItem(nextItem);
}

export function defaultTargetItem(hero, inventory = [], planId) {
  return nextBuildPlanTarget(hero, inventory, planId);
}

export function benchmarkAt(profile, gameTimeSec) {
  const minute = Math.max(0, gameTimeSec / 60);
  const points = profile.benchmarks;
  if (minute <= points[0].minute) return { ...points[0], minute };
  if (minute >= points.at(-1).minute) return { ...points.at(-1), minute };

  const rightIndex = points.findIndex((point) => point.minute >= minute);
  const left = points[rightIndex - 1];
  const right = points[rightIndex];
  const ratio = (minute - left.minute) / (right.minute - left.minute);

  return {
    minute,
    gpm: Math.round(left.gpm + (right.gpm - left.gpm) * ratio),
    level: Number((left.level + (right.level - left.level) * ratio).toFixed(1))
  };
}

export function ownsItem(state, itemId) {
  return state.inventory.some((item) => item.id === itemId);
}

export { ITEMS };
