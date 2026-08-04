export const LANING_STANCES = Object.freeze({
  AGGRESSIVE: 'AGGRESSIVE',
  TRADE: 'TRADE',
  NEUTRAL: 'NEUTRAL',
  DEFENSIVE: 'DEFENSIVE',
  RESET: 'RESET'
});

const COMMON_ITEM_COSTS = Object.freeze({
  item_tango: 90,
  item_flask: 100,
  item_clarity: 50,
  item_faerie_fire: 65,
  item_enchanted_mango: 65,
  item_branches: 50,
  item_magic_stick: 200,
  item_magic_wand: 450,
  item_bottle: 675,
  item_boots: 500,
  item_power_treads: 1400,
  item_phase_boots: 1500,
  item_wraith_band: 505,
  item_bracer: 505,
  item_null_talisman: 505,
  item_ring_of_health: 700,
  item_morbid_mask: 900,
  item_mask_of_madness: 1900,
  item_dragon_lance: 1900,
  item_diffusal_blade: 2500,
  item_maelstrom: 2950,
  item_black_king_bar: 4050,
  item_manta: 4650
});

const SUSTAIN_ITEMS = new Set([
  'item_tango',
  'item_flask',
  'item_faerie_fire',
  'item_enchanted_mango',
  'item_magic_stick',
  'item_magic_wand',
  'item_bottle',
  'item_ring_of_health',
  'item_morbid_mask',
  'item_mask_of_madness'
]);

const HERO_RULES = Object.freeze({
  morphling: {
    pressureLevel: 3,
    aggressiveHealth: 0.76,
    aggressiveMana: 0.48,
    tradeHealth: 0.64,
    tradeMana: 0.32,
    defensiveHealth: 0.50,
    resetHealth: 0.34,
    reserveManaPct: 28,
    durationSec: 4,
    abilityAliases: ['waveform'],
    abilityLabel: 'Waveform',
    tipKey: 'morphling'
  },
  sniper: {
    pressureLevel: 3,
    aggressiveHealth: 0.80,
    aggressiveMana: 0.42,
    tradeHealth: 0.66,
    tradeMana: 0.24,
    defensiveHealth: 0.52,
    resetHealth: 0.33,
    reserveManaPct: 20,
    durationSec: 3,
    abilityAliases: ['shrapnel'],
    abilityLabel: 'Shrapnel',
    tipKey: 'sniper'
  },
  juggernaut: {
    pressureLevel: 3,
    aggressiveHealth: 0.74,
    aggressiveMana: 0.38,
    tradeHealth: 0.62,
    tradeMana: 0.24,
    defensiveHealth: 0.48,
    resetHealth: 0.32,
    reserveManaPct: 24,
    durationSec: 4,
    abilityAliases: ['blade_fury', 'bladefury'],
    abilityLabel: 'Blade Fury',
    tipKey: 'juggernaut'
  },
  crystal_maiden: {
    pressureLevel: 2,
    aggressiveHealth: 0.78,
    aggressiveMana: 0.55,
    tradeHealth: 0.62,
    tradeMana: 0.40,
    defensiveHealth: 0.50,
    resetHealth: 0.34,
    reserveManaPct: 32,
    durationSec: 3,
    abilityAliases: ['crystal_nova', 'frostbite'],
    abilityLabel: 'Crystal Nova',
    tipKey: 'crystal_maiden'
  },
  lion: {
    pressureLevel: 2,
    aggressiveHealth: 0.76,
    aggressiveMana: 0.52,
    tradeHealth: 0.60,
    tradeMana: 0.38,
    defensiveHealth: 0.49,
    resetHealth: 0.34,
    reserveManaPct: 30,
    durationSec: 3,
    abilityAliases: ['earth_spike', 'impale', 'hex'],
    abilityLabel: 'Earth Spike',
    tipKey: 'lion'
  }
});

const DEFAULT_RULE = Object.freeze({
  pressureLevel: 3,
  aggressiveHealth: 0.78,
  aggressiveMana: 0.48,
  tradeHealth: 0.64,
  tradeMana: 0.30,
  defensiveHealth: 0.50,
  resetHealth: 0.33,
  reserveManaPct: 25,
  durationSec: 3,
  abilityAliases: [],
  abilityLabel: null,
  tipKey: 'generic'
});

const COPY = Object.freeze({
  ru: {
    titles: {
      AGGRESSIVE: 'Играй агрессивно',
      TRADE: 'Разменивайся',
      NEUTRAL: 'Играй нейтрально',
      DEFENSIVE: 'Играй осторожно',
      RESET: 'Отойди и восстановись'
    },
    instructions: {
      AGGRESSIVE: 'Дави примерно {duration} сек.: используй {ability}, сделай несколько атак и сразу вернись за дальнего крипа. Оставь не меньше {reserve}% маны на выход.',
      TRADE: 'Возьми короткий размен на {duration} сек.: сначала {ability}, затем несколько атак без погони под вражескую пачку. После размена вернись к ластхитам.',
      NEUTRAL: 'Держи равновесие линии, добивай дальнего крипа и используй {ability} только когда это не стоит двух ластхитов. Не начинай длинную погоню.',
      DEFENSIVE: 'Стой за дальним крипом, добивай с безопасной дистанции и не трать {ability} для давления. Сохрани ману и путь отхода.',
      RESET: 'Разорви контакт с линией, используй доступное восстановление и возвращайся только после безопасного уровня ресурсов.'
    },
    reasons: {
      resources: 'Твои ресурсы: {health}% здоровья и {mana}% маны.',
      abilityReady: '{ability} готова для короткого действия.',
      abilityUnavailable: 'Ключевая способность сейчас не готова или на неё не хватает маны.',
      ownLevel: 'Текущий уровень: {level}.',
      levelLead: 'Подтверждено преимущество по уровню: {level} против {opponentLevel}.',
      economyLead: 'Подтверждено преимущество по экономике: {netWorth} против {opponentNetWorth}.',
      economyEstimate: 'Собственная экономика оценивается примерно в {netWorth}; точный нетворс не подтверждён.',
      danger: 'Риск линии повышен: опасность {danger}%.',
      outnumbered: 'Рядом подтверждено больше врагов, чем союзников.',
      uncertainEnemy: 'Уровень и экономика соперника не подтверждены, поэтому совет ограничен безопасным коротким действием.',
      sustain: 'В инвентаре есть доступный источник восстановления.'
    },
    cancel: {
      AGGRESSIVE: 'Прекрати давление, если ключевая способность перестанет быть готова, здоровье упадёт ниже {cancelHealth}% или появится дополнительный враг.',
      TRADE: 'Прекрати размен после {duration} сек., при потере позиции за дальним крипом или падении здоровья ниже {cancelHealth}%.',
      NEUTRAL: 'Пересмотри режим при изменении HP, маны, уровня, готовности способности или количества героев рядом.',
      DEFENSIVE: 'Вернись к разменам только после восстановления выше {resumeHealth}% здоровья и готовности {ability}.',
      RESET: 'Возвращайся на линию после восстановления выше {resumeHealth}% здоровья и появления безопасного пути.'
    },
    heroTips: {
      morphling: 'Waveform — твой выход; не трать ману ниже резерва ради лишней атаки.',
      sniper: 'Используй дальность: давление заканчивается сразу, когда враг сокращает дистанцию.',
      juggernaut: 'Blade Fury должна оставаться способом пережить контроль или закончить короткий размен.',
      crystal_maiden: 'Кастуй с края дистанции и не принимай урон всей вражеской пачки крипов.',
      lion: 'После Earth Spike сделай короткое действие и выйди из радиуса ответного размена.',
      support: 'Не забирай безопасные ластхиты core и не разменивай здоровье без пользы для линии.',
      generic: 'Не продолжай действие после исчезновения подтверждённого окна.'
    }
  },
  en: {
    titles: {
      AGGRESSIVE: 'Play aggressively',
      TRADE: 'Take a trade',
      NEUTRAL: 'Play neutral',
      DEFENSIVE: 'Play carefully',
      RESET: 'Back off and recover'
    },
    instructions: {
      AGGRESSIVE: 'Pressure for about {duration}s: use {ability}, add a few attacks, then return behind the ranged creep. Keep at least {reserve}% mana for your exit.',
      TRADE: 'Take one short {duration}s trade: lead with {ability}, add a few attacks without chasing through the enemy wave, then return to last hits.',
      NEUTRAL: 'Hold lane equilibrium, secure the ranged creep, and use {ability} only when it does not cost two last hits. Do not start a long chase.',
      DEFENSIVE: 'Stay behind the ranged creep, secure farm from a safe distance, and do not spend {ability} for pressure. Preserve mana and an exit path.',
      RESET: 'Break lane contact, use available recovery, and return only after your resources are safe again.'
    },
    reasons: {
      resources: 'Your resources are {health}% health and {mana}% mana.',
      abilityReady: '{ability} is ready for a short action.',
      abilityUnavailable: 'The key spell is unavailable or current mana is insufficient.',
      ownLevel: 'Current level: {level}.',
      levelLead: 'A level advantage is confirmed: {level} versus {opponentLevel}.',
      economyLead: 'An economy advantage is confirmed: {netWorth} versus {opponentNetWorth}.',
      economyEstimate: 'Your economy is estimated near {netWorth}; exact net worth is not confirmed.',
      danger: 'Lane risk is elevated: {danger}%.',
      outnumbered: 'More enemies than allies are confirmed nearby.',
      uncertainEnemy: 'The opponent level and economy are unconfirmed, so the call is limited to a safe short action.',
      sustain: 'A recovery source is available in the inventory.'
    },
    cancel: {
      AGGRESSIVE: 'Stop pressure if the key spell becomes unavailable, health falls below {cancelHealth}%, or another enemy appears.',
      TRADE: 'End the trade after {duration}s, when ranged-creep cover is lost, or health falls below {cancelHealth}%.',
      NEUTRAL: 'Reassess after a meaningful HP, mana, level, spell-readiness, or nearby-player change.',
      DEFENSIVE: 'Return to trades only above {resumeHealth}% health with {ability} ready.',
      RESET: 'Return to lane above {resumeHealth}% health with a safe path available.'
    },
    heroTips: {
      morphling: 'Waveform is your exit; do not spend below the reserve for one extra attack.',
      sniper: 'Use range: pressure ends as soon as the opponent closes the distance.',
      juggernaut: 'Keep Blade Fury available to survive control or finish one short trade.',
      crystal_maiden: 'Cast from maximum range and avoid taking aggro from the full enemy creep wave.',
      lion: 'After Earth Spike, take one short action and leave the opponent trade range.',
      support: 'Do not take safe core last hits or trade health without improving the lane.',
      generic: 'Do not continue after the confirmed window disappears.'
    }
  }
});

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function percentage(value, maximum) {
  const max = Math.max(1, finite(maximum, 1));
  return clamp(finite(value, 0) / max);
}

function normalizeHero(value) {
  return String(value ?? '').trim().toLowerCase().replace(/^npc_dota_hero_/, '');
}

function normalizeItemId(value) {
  const id = String(value ?? '').trim().toLowerCase();
  if (!id) return '';
  return id.startsWith('item_') ? id : `item_${id}`;
}

function inventorySnapshot(state) {
  const inventory = Array.isArray(state?.inventory) ? state.inventory : [];
  let knownItemValue = 0;
  let unknownItems = 0;
  let hasSustain = false;

  for (const raw of inventory) {
    const id = normalizeItemId(typeof raw === 'string' ? raw : raw?.id);
    if (!id) continue;
    if (SUSTAIN_ITEMS.has(id)) hasSustain = true;
    const explicitCost = finite(typeof raw === 'object' && raw ? raw.cost : null);
    const knownCost = explicitCost ?? COMMON_ITEM_COSTS[id];
    if (Number.isFinite(knownCost)) knownItemValue += Math.max(0, knownCost);
    else unknownItems += 1;
  }

  return { knownItemValue, unknownItems, hasSustain };
}

function economySnapshot(state, inventory) {
  const exact = finite(state?.netWorth);
  if (exact !== null && exact > 0) {
    return { value: Math.round(exact), quality: 'OBSERVED', unknownItems: 0 };
  }

  const contextual = finite(state?.roleContext?.playerNetWorth);
  if (contextual !== null && contextual > 0) {
    const signalQuality = String(state?.roleContext?.meta?.signals?.playerNetWorth?.quality ?? 'INFERRED').toUpperCase();
    return {
      value: Math.round(contextual),
      quality: signalQuality === 'LIVE' || signalQuality === 'OBSERVED' ? 'OBSERVED' : 'INFERRED',
      unknownItems: inventory.unknownItems
    };
  }

  const gold = Math.max(0, finite(state?.gold, 0));
  return {
    value: Math.round(gold + inventory.knownItemValue),
    quality: inventory.unknownItems > 0 ? 'PARTIAL' : 'INFERRED',
    unknownItems: inventory.unknownItems
  };
}

function abilityEntries(state) {
  const abilities = state?.abilities && typeof state.abilities === 'object' && !Array.isArray(state.abilities)
    ? Object.values(state.abilities)
    : [];
  return abilities
    .filter((ability) => ability && typeof ability === 'object')
    .map((ability) => {
      const name = String(ability.name ?? '').toLowerCase();
      const level = Math.max(0, finite(ability.level, 0));
      const cooldown = Math.max(0, finite(ability.cooldown, 0));
      const explicitlyCastable = typeof ability.canCast === 'boolean' ? ability.canCast : null;
      const ready = level > 0 && !ability.passive && (explicitlyCastable === true || (explicitlyCastable === null && cooldown <= 0));
      return { ...ability, name, level, cooldown, ready };
    });
}

function selectAbility(state, rule) {
  const abilities = abilityEntries(state);
  for (const alias of rule.abilityAliases) {
    const match = abilities.find((ability) => ability.name.includes(alias));
    if (match) return { ...match, label: rule.abilityLabel ?? readableAbility(match.name) };
  }
  const ready = abilities.find((ability) => ability.ready);
  if (ready) return { ...ready, label: readableAbility(ready.name) };
  const learned = abilities.find((ability) => ability.level > 0 && !ability.passive);
  if (learned) return { ...learned, label: readableAbility(learned.name) };
  return { name: '', label: rule.abilityLabel, level: 0, cooldown: 0, ready: false };
}

function readableAbility(value) {
  const cleaned = String(value ?? '')
    .replace(/^npc_dota_hero_/, '')
    .split('_')
    .filter(Boolean)
    .slice(-3)
    .join(' ');
  return cleaned ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase()) : null;
}

function laneEvidence(state) {
  const roleContext = state?.roleContext ?? {};
  const laneState = state?.laneState ?? {};
  const opponentLevel = finite(laneState.opponentLevel ?? roleContext.opponentLevel);
  const opponentNetWorth = finite(laneState.opponentEconomy ?? roleContext.laneOpponentNetWorth);
  const danger = finite(laneState.deathRisk ?? roleContext.dangerLevel);
  const missingHeroesRisk = finite(laneState.missingHeroesRisk ?? roleContext.missingHeroesRisk);
  const alliesNearby = finite(roleContext.alliesNearby);
  const enemiesNearby = finite(roleContext.enemiesNearby);
  const killPotential = finite(laneState.killPotential ?? roleContext.sideLaneKillPotential);
  return {
    opponentLevel: opponentLevel !== null && opponentLevel > 0 ? Math.round(opponentLevel) : null,
    opponentNetWorth: opponentNetWorth !== null && opponentNetWorth > 0 ? Math.round(opponentNetWorth) : null,
    danger: danger === null ? null : clamp(danger),
    missingHeroesRisk: missingHeroesRisk === null ? null : clamp(missingHeroesRisk),
    alliesNearby: alliesNearby === null ? null : Math.max(0, Math.round(alliesNearby)),
    enemiesNearby: enemiesNearby === null ? null : Math.max(0, Math.round(enemiesNearby)),
    killPotential: killPotential === null ? null : clamp(killPotential)
  };
}

function isSupportRole(role) {
  const normalized = String(role ?? '').toLowerCase();
  return normalized.includes('support') || normalized === '4' || normalized === '5';
}

function buildMissingSignals(action, economy, evidence) {
  if (action === LANING_STANCES.RESET || action === LANING_STANCES.DEFENSIVE) return [];
  const missing = [];
  if (economy.quality !== 'OBSERVED') missing.push('EXACT_LOCAL_NET_WORTH');
  if (evidence.opponentLevel === null) missing.push('LANE_OPPONENT_LEVEL');
  if (evidence.opponentNetWorth === null) missing.push('LANE_OPPONENT_NET_WORTH');
  return missing;
}

function confidenceFor(action, economy, evidence, ability) {
  let confidence = action === LANING_STANCES.RESET ? 0.88
    : action === LANING_STANCES.DEFENSIVE ? 0.79
      : action === LANING_STANCES.AGGRESSIVE ? 0.72
        : action === LANING_STANCES.TRADE ? 0.69
          : 0.63;
  if (economy.quality === 'OBSERVED') confidence += 0.05;
  if (evidence.opponentLevel !== null) confidence += 0.05;
  if (evidence.opponentNetWorth !== null) confidence += 0.04;
  if (evidence.danger !== null) confidence += 0.04;
  if (ability.ready) confidence += 0.03;
  if (action !== LANING_STANCES.RESET && evidence.opponentLevel === null && evidence.opponentNetWorth === null) confidence -= 0.05;
  return clamp(confidence, 0.42, 0.92);
}

export function evaluateLaningStance(state = {}) {
  const hero = normalizeHero(state.hero);
  const rule = HERO_RULES[hero] ?? DEFAULT_RULE;
  const role = String(state.role ?? 'unknown').toLowerCase();
  const healthPct = percentage(state.health, state.maxHealth);
  const manaPct = percentage(state.mana, state.maxMana);
  const level = Math.max(1, Math.round(finite(state.level, 1)));
  const inventory = inventorySnapshot(state);
  const economy = economySnapshot(state, inventory);
  const evidence = laneEvidence(state);
  const ability = selectAbility(state, rule);
  const outnumbered = evidence.enemiesNearby !== null
    && evidence.alliesNearby !== null
    && evidence.enemiesNearby > evidence.alliesNearby;
  const levelLead = evidence.opponentLevel === null ? null : level - evidence.opponentLevel;
  const economyLeadPct = evidence.opponentNetWorth === null || evidence.opponentNetWorth <= 0
    ? null
    : (economy.value - evidence.opponentNetWorth) / evidence.opponentNetWorth;
  const statusEffects = state.statusEffects ?? {};
  const disabled = Boolean(statusEffects.stunned || statusEffects.hexed || statusEffects.silenced || statusEffects.disarmed);
  const explicitWindow = (levelLead !== null && levelLead >= 1)
    || (economyLeadPct !== null && economyLeadPct >= 0.08)
    || (evidence.killPotential !== null && evidence.killPotential >= 0.68);

  let action = LANING_STANCES.NEUTRAL;
  if (state.alive === false || healthPct <= 0.25 || (healthPct <= rule.resetHealth && !inventory.hasSustain)) {
    action = LANING_STANCES.RESET;
  } else if (
    disabled
    || outnumbered
    || (evidence.danger !== null && evidence.danger >= 0.70)
    || (evidence.missingHeroesRisk !== null && evidence.missingHeroesRisk >= 0.75)
    || healthPct < rule.defensiveHealth
    || (manaPct < 0.16 && !inventory.hasSustain)
  ) {
    action = LANING_STANCES.DEFENSIVE;
  } else if (
    explicitWindow
    && ability.ready
    && healthPct >= rule.aggressiveHealth
    && manaPct >= rule.aggressiveMana
    && (evidence.danger === null || evidence.danger < 0.38)
    && !outnumbered
    && (!isSupportRole(role) || evidence.alliesNearby === null || evidence.alliesNearby >= 1)
  ) {
    action = LANING_STANCES.AGGRESSIVE;
  } else if (
    ability.ready
    && healthPct >= rule.tradeHealth
    && manaPct >= rule.tradeMana
    && (evidence.danger === null || evidence.danger < 0.55)
    && !outnumbered
  ) {
    action = LANING_STANCES.TRADE;
  }

  const reasons = ['resources'];
  reasons.push(ability.ready ? 'abilityReady' : 'abilityUnavailable');
  if (levelLead !== null && levelLead >= 1) reasons.push('levelLead');
  else reasons.push('ownLevel');
  if (economyLeadPct !== null && economyLeadPct >= 0.08) reasons.push('economyLead');
  else if (economy.value > 0 && economy.quality !== 'OBSERVED') reasons.push('economyEstimate');
  if (evidence.danger !== null && evidence.danger >= 0.45) reasons.push('danger');
  if (outnumbered) reasons.push('outnumbered');
  if (inventory.hasSustain) reasons.push('sustain');
  if (evidence.opponentLevel === null && evidence.opponentNetWorth === null && (action === LANING_STANCES.TRADE || action === LANING_STANCES.NEUTRAL)) {
    reasons.push('uncertainEnemy');
  }

  const result = {
    action,
    confidence: confidenceFor(action, economy, evidence, ability),
    hero,
    role,
    level,
    healthPct,
    manaPct,
    ability: {
      name: ability.label,
      ready: Boolean(ability.ready),
      level: ability.level,
      cooldown: ability.cooldown
    },
    economy,
    evidence,
    hasSustain: inventory.hasSustain,
    reasons: [...new Set(reasons)].slice(0, 5),
    tipKey: isSupportRole(role) && rule.tipKey === 'generic' ? 'support' : rule.tipKey,
    missingSignals: buildMissingSignals(action, economy, evidence),
    generatedAtSec: finite(state.gameTimeSec, 0),
    thresholds: {
      reserveManaPct: rule.reserveManaPct,
      durationSec: rule.durationSec,
      cancelHealthPct: Math.round(Math.max(rule.resetHealth + 0.08, rule.defensiveHealth) * 100),
      resumeHealthPct: Math.round(Math.max(rule.tradeHealth, rule.defensiveHealth + 0.12) * 100)
    }
  };

  return result;
}

function interpolate(template, variables) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(variables[key] ?? `{${key}}`));
}

function formatGold(value) {
  const number = Math.max(0, Math.round(finite(value, 0)));
  return number.toLocaleString('en-US').replaceAll(',', ' ');
}

export function presentLaningStance(result, language = 'en') {
  const locale = language === 'ru' ? COPY.ru : COPY.en;
  const abilityFallback = language === 'ru' ? 'основную способность' : 'your main spell';
  const variables = {
    health: Math.round(result.healthPct * 100),
    mana: Math.round(result.manaPct * 100),
    level: result.level,
    opponentLevel: result.evidence.opponentLevel ?? '?',
    netWorth: formatGold(result.economy.value),
    opponentNetWorth: result.evidence.opponentNetWorth === null ? '?' : formatGold(result.evidence.opponentNetWorth),
    danger: result.evidence.danger === null ? '?' : Math.round(result.evidence.danger * 100),
    ability: result.ability.name || abilityFallback,
    duration: result.thresholds.durationSec,
    reserve: result.thresholds.reserveManaPct,
    cancelHealth: result.thresholds.cancelHealthPct,
    resumeHealth: result.thresholds.resumeHealthPct
  };
  const reasons = result.reasons.map((key) => interpolate(locale.reasons[key] ?? key, variables));
  const heroTip = locale.heroTips[result.tipKey] ?? locale.heroTips.generic;
  if (heroTip) reasons.push(heroTip);
  return {
    title: locale.titles[result.action] ?? result.action,
    instruction: interpolate(locale.instructions[result.action] ?? '', variables),
    reasons: reasons.slice(0, 4),
    cancellation: interpolate(locale.cancel[result.action] ?? '', variables),
    variables
  };
}

export const LANING_HERO_RULES = HERO_RULES;
