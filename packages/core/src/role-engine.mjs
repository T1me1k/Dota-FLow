import { healthPct, manaPct } from './game-state.mjs';
import { roleContextSummary, roleSignalAvailable } from './role-context-adapter.mjs';

export const PLAYER_ROLES = Object.freeze({
  CARRY: 'carry',
  MID: 'mid',
  OFFLANE: 'offlane',
  SOFT_SUPPORT: 'soft_support',
  HARD_SUPPORT: 'hard_support'
});

export const ROLE_ACTIONS = Object.freeze({
  FARM_SAFE: 'FARM_SAFE',
  HOLD_LANE: 'HOLD_LANE',
  SHOVE_LANE: 'SHOVE_LANE',
  PRESSURE_TOWER: 'PRESSURE_TOWER',
  CONTROL_POWER_RUNE: 'CONTROL_POWER_RUNE',
  HOLD_RUNE_FOR_WISDOM: 'HOLD_RUNE_FOR_WISDOM',
  MOVE_TO_WISDOM: 'MOVE_TO_WISDOM',
  ROTATE: 'ROTATE',
  GANK: 'GANK',
  CONNECT: 'CONNECT',
  PRESSURE_ENEMY_CARRY: 'PRESSURE_ENEMY_CARRY',
  PROTECT_CARRY: 'PROTECT_CARRY',
  HELP_MID_RUNE: 'HELP_MID_RUNE',
  PULL_LANE: 'PULL_LANE',
  STACK_CAMP: 'STACK_CAMP',
  PLACE_VISION: 'PLACE_VISION',
  DEFEND_LANE: 'DEFEND_LANE',
  RESET: 'RESET',
  PREPARE_POWER_RUNE: 'PREPARE_POWER_RUNE',
  PREPARE_WISDOM: 'PREPARE_WISDOM',
  HOLD_POSITION: 'HOLD_POSITION',
  WAIT: 'WAIT'
});

export const TIMED_OBJECTIVES = Object.freeze({
  WATER_RUNE: Object.freeze({ id: 'water_rune', fixedTimesSec: [120, 240], contestLeadSec: 20 }),
  POWER_RUNE: Object.freeze({ id: 'power_rune', startSec: 360, intervalSec: 120, contestLeadSec: 25 }),
  WISDOM_RUNE: Object.freeze({ id: 'wisdom_rune', startSec: 420, intervalSec: 420, contestLeadSec: 50 }),
  STACK_WINDOW: Object.freeze({ id: 'stack_window', secondStart: 50, secondEnd: 56 })
});

const VALID_ROLES = new Set(Object.values(PLAYER_ROLES));

const ACTION_SIGNAL_REQUIREMENTS = Object.freeze({
  [ROLE_ACTIONS.HOLD_RUNE_FOR_WISDOM]: ['bottledRune', 'laneTargets'],
  [ROLE_ACTIONS.MOVE_TO_WISDOM]: ['laneTargets'],
  [ROLE_ACTIONS.CONTROL_POWER_RUNE]: ['laneState'],
  [ROLE_ACTIONS.SHOVE_LANE]: ['laneState'],
  [ROLE_ACTIONS.ROTATE]: ['laneState', 'laneTargets', 'routeSafety'],
  [ROLE_ACTIONS.GANK]: ['laneTargets', 'routeSafety'],
  [ROLE_ACTIONS.PRESSURE_ENEMY_CARRY]: ['laneTargets', 'teamReadiness'],
  [ROLE_ACTIONS.PRESSURE_TOWER]: ['laneState', 'laneTargets'],
  [ROLE_ACTIONS.PULL_LANE]: ['campState', 'laneState'],
  [ROLE_ACTIONS.STACK_CAMP]: ['campState', 'laneState'],
  [ROLE_ACTIONS.PROTECT_CARRY]: ['carryThreat'],
  [ROLE_ACTIONS.HELP_MID_RUNE]: ['teamReadiness'],
  [ROLE_ACTIONS.PLACE_VISION]: ['visionState'],
  [ROLE_ACTIONS.CONNECT]: ['teamReadiness']
});

const QUALITY_CONFIDENCE_CAP = Object.freeze({
  FULL: 0.98,
  PARTIAL: 0.9,
  LIMITED: 0.74,
  STALE: 0.62
});

function safeFallback(role, candidate, missingSignals, windows, summary) {
  const missingText = missingSignals.join(', ');
  const common = {
    contextQuality: summary.quality,
    contextCoverage: summary.coverage,
    missingSignals,
    dataLimited: true,
    originalAction: candidate.action,
    objectiveWindows: windows
  };

  if (candidate.action === ROLE_ACTIONS.MOVE_TO_WISDOM) {
    return decision(role, ROLE_ACTIONS.PREPARE_WISDOM, 0.68, 'PREPARE WISDOM', 'Подготовь волну и проверь карту; прямой мув пока не подтверждён данными.', [
      'Таймер Wisdom известен точно',
      `Не хватает контекста: ${missingText}`
    ], common);
  }
  if (candidate.action === ROLE_ACTIONS.CONTROL_POWER_RUNE
    || (candidate.action === ROLE_ACTIONS.SHOVE_LANE && (windows.powerRune.contestSoon || windows.powerRune.justSpawned))) {
    return decision(role, ROLE_ACTIONS.PREPARE_POWER_RUNE, 0.7, 'PREPARE POWER RUNE', 'Подготовься к рунному окну, но не покидай линию вслепую.', [
      'Таймер Power Rune известен точно',
      `Не хватает контекста: ${missingText}`
    ], common);
  }

  const roleMessage = role === PLAYER_ROLES.MID
    ? 'Сохраняй контроль мида до подтверждения состояния волн и боковых линий.'
    : role === PLAYER_ROLES.OFFLANE
      ? 'Удерживай безопасное пространство до подтверждения цели для давления.'
      : role === PLAYER_ROLES.CARRY
        ? 'Продолжай безопасную экономику без неподтверждённого перемещения.'
        : 'Оставайся рядом с текущей линией или core до появления подтверждённой задачи.';
  return decision(role, ROLE_ACTIONS.HOLD_POSITION, 0.62, 'HOLD POSITION', roleMessage, [
    `Опасное действие ${candidate.action} заблокировано`,
    `Не хватает контекста: ${missingText}`
  ], common);
}

function applyContextSafety(state, candidate, windows) {
  const context = state?.roleContext ?? {};
  const summary = roleContextSummary(context);
  const requirements = ACTION_SIGNAL_REQUIREMENTS[candidate.action] ?? [];
  const missingSignals = requirements.filter((key) => !roleSignalAvailable(context, key, {
    minimumConfidence: key === 'routeSafety' ? 0.55 : 0.5,
    allowInferred: key !== 'routeSafety'
  }));

  if (missingSignals.length) return safeFallback(candidate.role, candidate, missingSignals, windows, summary);
  const cap = QUALITY_CONFIDENCE_CAP[summary.quality] ?? 0.74;
  return {
    ...candidate,
    confidence: Math.min(candidate.confidence, cap),
    contextQuality: summary.quality,
    contextCoverage: summary.coverage,
    missingSignals: summary.missingSignals,
    staleSignals: summary.staleSignals,
    limitations: summary.limitations,
    dataLimited: summary.quality !== 'FULL'
  };
}


function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function nextRecurring(gameTimeSec, startSec, intervalSec) {
  if (gameTimeSec <= startSec) return startSec;
  return startSec + Math.ceil((gameTimeSec - startSec) / intervalSec) * intervalSec;
}

function previousRecurring(gameTimeSec, startSec, intervalSec) {
  if (gameTimeSec < startSec) return null;
  return startSec + Math.floor((gameTimeSec - startSec) / intervalSec) * intervalSec;
}

function timingEntry(id, gameTimeSec, nextSec, previousSec, leadSec) {
  const secondsUntil = nextSec - gameTimeSec;
  return {
    id,
    nextSec,
    previousSec,
    secondsUntil,
    contestSoon: secondsUntil >= 0 && secondsUntil <= leadSec,
    justSpawned: previousSec !== null && gameTimeSec - previousSec <= 12
  };
}

export function getRoleObjectiveWindows(gameTimeSec) {
  const time = Math.max(0, finite(gameTimeSec));
  const waterNext = TIMED_OBJECTIVES.WATER_RUNE.fixedTimesSec.find((spawn) => spawn >= time) ?? null;
  const waterPrevious = [...TIMED_OBJECTIVES.WATER_RUNE.fixedTimesSec].reverse().find((spawn) => spawn <= time) ?? null;
  const powerNext = nextRecurring(time, TIMED_OBJECTIVES.POWER_RUNE.startSec, TIMED_OBJECTIVES.POWER_RUNE.intervalSec);
  const powerPrevious = previousRecurring(time, TIMED_OBJECTIVES.POWER_RUNE.startSec, TIMED_OBJECTIVES.POWER_RUNE.intervalSec);
  const wisdomNext = nextRecurring(time, TIMED_OBJECTIVES.WISDOM_RUNE.startSec, TIMED_OBJECTIVES.WISDOM_RUNE.intervalSec);
  const wisdomPrevious = previousRecurring(time, TIMED_OBJECTIVES.WISDOM_RUNE.startSec, TIMED_OBJECTIVES.WISDOM_RUNE.intervalSec);
  const second = Math.floor(time % 60);

  return {
    waterRune: waterNext === null
      ? { id: 'water_rune', nextSec: null, previousSec: waterPrevious, secondsUntil: null, contestSoon: false, justSpawned: waterPrevious !== null && time - waterPrevious <= 12 }
      : timingEntry('water_rune', time, waterNext, waterPrevious, TIMED_OBJECTIVES.WATER_RUNE.contestLeadSec),
    powerRune: timingEntry('power_rune', time, powerNext, powerPrevious, TIMED_OBJECTIVES.POWER_RUNE.contestLeadSec),
    wisdomRune: timingEntry('wisdom_rune', time, wisdomNext, wisdomPrevious, TIMED_OBJECTIVES.WISDOM_RUNE.contestLeadSec),
    stackWindow: {
      id: 'stack_window',
      active: second >= TIMED_OBJECTIVES.STACK_WINDOW.secondStart && second <= TIMED_OBJECTIVES.STACK_WINDOW.secondEnd,
      second
    }
  };
}

function normalizeRole(value) {
  return VALID_ROLES.has(value) ? value : PLAYER_ROLES.CARRY;
}

function laneCandidates(context) {
  const lanes = context?.lanes && typeof context.lanes === 'object' ? context.lanes : {};
  return ['top', 'mid', 'bottom'].map((id) => {
    const lane = lanes[id] ?? {};
    const killPotential = clamp(finite(lane.killPotential), 0, 1);
    const danger = clamp(finite(lane.danger), 0, 1);
    const enemyExposure = clamp(finite(lane.enemyCoreExposure), 0, 1);
    const objectiveValue = clamp(finite(lane.objectiveValue), 0, 1);
    return { id, killPotential, danger, enemyExposure, objectiveValue, score: killPotential * 45 + enemyExposure * 25 + objectiveValue * 15 - danger * 35 };
  }).sort((a, b) => b.score - a.score);
}

function runeType(context) {
  const raw = String(context?.bottledRune?.type ?? context?.activeRune?.type ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const aliases = {
    dd: 'double_damage',
    doubledamage: 'double_damage',
    amplify_damage: 'double_damage',
    damage: 'double_damage',
    invis: 'invisibility'
  };
  return aliases[raw] ?? raw;
}

function decision(role, action, confidence, headline, message, reasons, extra = {}) {
  return {
    role,
    action,
    confidence: clamp(confidence, 0.25, 0.98),
    headline,
    message,
    reasons,
    ...extra,
    generatedAt: Date.now()
  };
}

function evaluateMid(state, context, windows) {
  const hp = healthPct(state);
  const mana = manaPct(state);
  const netWorthDelta = finite(context.playerNetWorth) - finite(context.laneOpponentNetWorth);
  const bestLane = laneCandidates(context)[0];
  const lanePushed = Boolean(context.lanePushed);
  const rune = runeType(context);
  const wisdomFight = Boolean(context.wisdomFightExpected) || bestLane.killPotential >= 0.55;

  if (hp < 0.35 || mana < 0.18) {
    return decision('mid', ROLE_ACTIONS.RESET, 0.94, 'RESET', 'Восстанови ресурсы до следующего рунного окна.', ['Недостаточно здоровья или маны для безопасного мува'], { objectiveWindows: windows });
  }

  if (rune === 'double_damage' && windows.wisdomRune.secondsUntil >= 10 && windows.wisdomRune.secondsUntil <= 75 && wisdomFight) {
    return decision('mid', ROLE_ACTIONS.HOLD_RUNE_FOR_WISDOM, 0.88, 'СОХРАНИ DD', `Подожди до выхода на руну мудрости через ${Math.ceil(windows.wisdomRune.secondsUntil)} сек.`, ['DD усилит драку за Wisdom', 'Окно достаточно близко, чтобы не тратить руну на пустой фарм'], { target: context.wisdomSide ?? bestLane.id, objectiveWindows: windows });
  }

  if (windows.wisdomRune.contestSoon && (rune === 'double_damage' || rune === 'haste' || rune === 'invisibility' || finite(context.wisdomControlRisk) >= 0.5)) {
    return decision('mid', ROLE_ACTIONS.MOVE_TO_WISDOM, 0.86, 'MOVE: WISDOM', 'Протолкни волну и смещайся на ближайшую важную руну мудрости.', ['Wisdom скоро появляется', rune ? `В бутылке подходящая руна: ${rune}` : 'На точке ожидается contest'], { target: context.wisdomSide ?? bestLane.id, objectiveWindows: windows });
  }

  if (windows.powerRune.contestSoon || windows.powerRune.justSpawned) {
    if (lanePushed || finite(context.lanePriority) >= 0.6) {
      return decision('mid', ROLE_ACTIONS.CONTROL_POWER_RUNE, 0.9, 'CONTROL POWER RUNE', 'Забери или проверь power rune до следующего действия.', ['Есть приоритет линии', `До руны ${Math.max(0, Math.ceil(windows.powerRune.secondsUntil))} сек.`], { objectiveWindows: windows });
    }
    return decision('mid', ROLE_ACTIONS.SHOVE_LANE, 0.82, 'SHOVE MID', 'Быстро протолкни волну, чтобы освободиться на power rune.', ['Рунное окно близко, но линия не подготовлена'], { objectiveWindows: windows });
  }

  if (lanePushed && bestLane.score >= 24 && (netWorthDelta >= 350 || state.ultimateReady)) {
    return decision('mid', ROLE_ACTIONS.ROTATE, 0.82, `ROTATE ${bestLane.id.toUpperCase()}`, 'Используй приоритет и преимущество для короткого мува на боковую линию.', [`Преимущество по net worth: ${Math.round(netWorthDelta)}`, `Kill potential линии: ${Math.round(bestLane.killPotential * 100)}%`], { target: bestLane.id, objectiveWindows: windows });
  }

  if (!lanePushed) {
    return decision('mid', ROLE_ACTIONS.SHOVE_LANE, 0.76, 'SHOVE MID', 'Сначала подготовь волну; уход без shove отдаст опыт и башню.', ['Линия не протолкнута'], { objectiveWindows: windows });
  }

  return decision('mid', ROLE_ACTIONS.HOLD_LANE, 0.66, 'HOLD MID', 'Сохраняй контроль линии и жди более сильного рунного или ганг-окна.', [netWorthDelta >= 0 ? 'Ты не обязан форсировать плохой мув' : 'Нужно восстановить баланс линии'], { objectiveWindows: windows });
}

function evaluateOfflane(state, context, windows) {
  const hp = healthPct(state);
  const carryExposure = clamp(finite(context.enemyCarryExposure), 0, 1);
  const towerOpportunity = clamp(finite(context.towerPressureOpportunity), 0, 1);

  if (hp < 0.38 || finite(context.dangerLevel) > 0.82) {
    return decision('offlane', ROLE_ACTIONS.RESET, 0.92, 'RESET', 'Отойди, восстановись и не отдавай пространство бесплатно.', ['Высокий риск смерти на передней линии'], { objectiveWindows: windows });
  }
  if (windows.wisdomRune.contestSoon && !roleSignalAvailable(context, 'laneTargets')) {
    return decision('offlane', ROLE_ACTIONS.PREPARE_WISDOM, 0.7, 'PREPARE WISDOM', 'Подготовь линию и проверь карту перед выходом на Wisdom.', ['Таймер руны известен', 'Положение врагов и состояние подхода пока не подтверждены'], { objectiveWindows: windows });
  }
  if (windows.wisdomRune.contestSoon && finite(context.wisdomControlRisk) >= 0.35) {
    return decision('offlane', ROLE_ACTIONS.MOVE_TO_WISDOM, 0.84, 'CONTEST WISDOM', 'Отпусти безопасную волну и займи подход к руне мудрости.', ['Wisdom скоро появляется', 'Тройка может первой занять опасную зону'], { target: context.wisdomSide ?? 'offlane', objectiveWindows: windows });
  }
  if (carryExposure >= 0.62 && (state.ultimateReady || finite(context.alliesNearby) >= 1)) {
    return decision('offlane', ROLE_ACTIONS.PRESSURE_ENEMY_CARRY, 0.86, 'PRESSURE CARRY', 'Не дай вражескому carry свободно забрать волну и лес.', ['Вражеский carry доступен для давления', 'Есть ресурс или союзник для продолжения'], { objectiveWindows: windows });
  }
  if (towerOpportunity >= 0.62 && Boolean(context.lanePushed)) {
    return decision('offlane', ROLE_ACTIONS.PRESSURE_TOWER, 0.82, 'PRESSURE TOWER', 'Конвертируй выигранную линию в башню и захват вражеского леса.', ['Волна подготовлена', 'Башня доступна для безопасного давления'], { objectiveWindows: windows });
  }
  if (state.ultimateReady && finite(context.teamReady) >= 0.6) {
    return decision('offlane', ROLE_ACTIONS.CONNECT, 0.79, 'CONNECT', 'Сместись к команде и предложи инициацию вокруг объекта.', ['Ключевая способность готова', 'Команда готова продолжить'], { objectiveWindows: windows });
  }
  return decision('offlane', ROLE_ACTIONS.HOLD_LANE, 0.65, 'HOLD SPACE', 'Занимай опасную линию, сохраняя телепорт и путь отхода.', ['Пока нет более сильного командного окна'], { objectiveWindows: windows });
}

function evaluateSoftSupport(state, context, windows) {
  const bestLane = laneCandidates(context)[0];
  if (windows.wisdomRune.contestSoon) {
    return decision('soft_support', ROLE_ACTIONS.MOVE_TO_WISDOM, 0.9, 'SECURE WISDOM', 'Заранее займи обзор и подход к руне мудрости.', ['Это ключевой опыт для саппортов', `До появления ${Math.ceil(windows.wisdomRune.secondsUntil)} сек.`], { target: context.wisdomSide ?? 'offlane', objectiveWindows: windows });
  }
  if ((windows.powerRune.contestSoon || windows.powerRune.justSpawned) && Boolean(context.midNeedsRuneHelp)) {
    return decision('soft_support', ROLE_ACTIONS.HELP_MID_RUNE, 0.86, 'HELP MID RUNE', 'Подойди к реке, обеспечь обзор и численное преимущество мидеру.', ['Power rune близко', 'Мидеру нужна помощь'], { objectiveWindows: windows });
  }
  if (windows.stackWindow.active && Boolean(context.stackCampAvailable) && finite(context.laneDutyUrgency) < 0.55) {
    return decision('soft_support', ROLE_ACTIONS.STACK_CAMP, 0.78, 'STACK', 'Сделай стак и вернись к следующей волне или руне.', ['Активно окно стака', 'Линия не требует немедленного присутствия'], { objectiveWindows: windows });
  }
  if (bestLane.score >= 22 && Boolean(context.safeMoveAvailable)) {
    return decision('soft_support', ROLE_ACTIONS.GANK, 0.8, `GANK ${bestLane.id.toUpperCase()}`, 'Сделай короткую ротацию и вернись до потери ключевого объекта.', [`Kill potential: ${Math.round(bestLane.killPotential * 100)}%`, 'Маршрут отмечен как безопасный'], { target: bestLane.id, objectiveWindows: windows });
  }
  if (finite(context.visionNeed) >= 0.6) {
    return decision('soft_support', ROLE_ACTIONS.PLACE_VISION, 0.74, 'PLACE VISION', 'Подготовь обзор перед следующей руной или перемещением core.', ['Недостаточно информации для безопасной ротации'], { objectiveWindows: windows });
  }
  return decision('soft_support', ROLE_ACTIONS.CONNECT, 0.62, 'PLAY NEAR CORE', 'Играй рядом с активным core и жди возможности начать действие.', ['Нет обязательного тайминга прямо сейчас'], { objectiveWindows: windows });
}

function evaluateHardSupport(state, context, windows) {
  if (finite(context.carryThreat) >= 0.65) {
    return decision('hard_support', ROLE_ACTIONS.PROTECT_CARRY, 0.92, 'PROTECT CARRY', 'Останься рядом, держи save/control и не уходи на жадный мув.', ['Carry находится под высокой угрозой'], { objectiveWindows: windows });
  }
  if (Boolean(context.pullAvailable) && Boolean(context.lanePushed) && finite(context.enemyDiveThreat) < 0.55) {
    return decision('hard_support', ROLE_ACTIONS.PULL_LANE, 0.84, 'PULL', 'Отведи следующую волну и восстанови позицию линии для carry.', ['Линия перепушена', 'Carry может пережить короткое отсутствие'], { objectiveWindows: windows });
  }
  if (windows.stackWindow.active && Boolean(context.stackCampAvailable) && finite(context.carryThreat) < 0.4) {
    return decision('hard_support', ROLE_ACTIONS.STACK_CAMP, 0.78, 'STACK', 'Сделай стак, не оставляя carry в опасной позиции.', ['Активно окно стака', 'Угроза carry низкая'], { objectiveWindows: windows });
  }
  if (windows.wisdomRune.contestSoon && finite(context.carryThreat) < 0.45) {
    return decision('hard_support', ROLE_ACTIONS.MOVE_TO_WISDOM, 0.82, 'SECURE WISDOM', 'Сместись за руной мудрости после подготовки безопасной волны для carry.', ['Wisdom скоро появляется', 'Carry временно может играть самостоятельно'], { target: context.wisdomSide ?? 'safe_lane', objectiveWindows: windows });
  }
  if (finite(context.visionNeed) >= 0.55) {
    return decision('hard_support', ROLE_ACTIONS.PLACE_VISION, 0.75, 'PLACE SAFE VISION', 'Обеспечь обзор на входах к carry и следующему объекту.', ['Команде не хватает безопасной информации'], { objectiveWindows: windows });
  }
  return decision('hard_support', ROLE_ACTIONS.PROTECT_CARRY, 0.65, 'PLAY WITH CARRY', 'Сохраняй линию и ресурсы core до появления обязательного тайминга.', ['Приоритет — стабильная экономика позиции 1'], { objectiveWindows: windows });
}

function evaluateCarry(state, context, windows) {
  if (healthPct(state) < 0.4 || !Boolean(context.safeMoveAvailable ?? true)) {
    return decision('carry', ROLE_ACTIONS.RESET, 0.88, 'RESET', 'Восстановись или смени опасную зону фарма.', ['Текущая позиция недостаточно безопасна'], { objectiveWindows: windows });
  }
  if (Boolean(context.lanePushed) && finite(context.teamReady) >= 0.7 && state.ultimateReady) {
    return decision('carry', ROLE_ACTIONS.CONNECT, 0.76, 'CONNECT', 'Заверши ближайший ресурс и подключись к готовому действию команды.', ['Волна подготовлена', 'Команда и ключевой cooldown готовы'], { objectiveWindows: windows });
  }
  return decision('carry', ROLE_ACTIONS.FARM_SAFE, 0.68, 'FARM SAFE', 'Продолжай безопасную экономику до следующего предметного или командного окна.', ['Нет обязательного ролевого перемещения'], { objectiveWindows: windows });
}

export function evaluateRoleDecision(state) {
  const role = normalizeRole(state?.role);
  const context = state?.roleContext ?? {};
  const windows = getRoleObjectiveWindows(state?.gameTimeSec ?? 0);

  if (state?.phase !== 'playing') {
    return decision(role, ROLE_ACTIONS.WAIT, 1, 'WAIT', 'Role Engine активируется после начала матча.', [], { objectiveWindows: windows });
  }

  if (!state?.alive) {
    return decision(role, ROLE_ACTIONS.RESET, 1, 'DEAD', 'Подготовь следующий маршрут и тайминг во время возрождения.', ['Герой мёртв'], { objectiveWindows: windows });
  }

  let candidate;
  switch (role) {
    case PLAYER_ROLES.MID: candidate = evaluateMid(state, context, windows); break;
    case PLAYER_ROLES.OFFLANE: candidate = evaluateOfflane(state, context, windows); break;
    case PLAYER_ROLES.SOFT_SUPPORT: candidate = evaluateSoftSupport(state, context, windows); break;
    case PLAYER_ROLES.HARD_SUPPORT: candidate = evaluateHardSupport(state, context, windows); break;
    default: candidate = evaluateCarry(state, context, windows); break;
  }
  return applyContextSafety(state, candidate, windows);
}

export class StableRoleDecisionCoordinator {
  constructor({ minimumHoldSec = 10 } = {}) {
    this.minimumHoldSec = minimumHoldSec;
    this.current = null;
    this.changedAtGameTime = null;
  }

  update(state) {
    const candidate = evaluateRoleDecision(state);
    if (!this.current || candidate.role !== this.current.role) return this.#accept(candidate, state.gameTimeSec);
    if (candidate.action === this.current.action) {
      this.current = candidate;
      return { ...candidate, changed: false };
    }
    const heldFor = finite(state.gameTimeSec) - finite(this.changedAtGameTime);
    const urgent = [ROLE_ACTIONS.RESET, ROLE_ACTIONS.PROTECT_CARRY, ROLE_ACTIONS.CONTROL_POWER_RUNE, ROLE_ACTIONS.MOVE_TO_WISDOM].includes(candidate.action);
    if (urgent || heldFor >= this.minimumHoldSec) return this.#accept(candidate, state.gameTimeSec);
    return { ...this.current, changed: false, pendingAction: candidate.action, pendingConfidence: candidate.confidence };
  }

  #accept(decision, gameTimeSec) {
    this.current = decision;
    this.changedAtGameTime = gameTimeSec;
    return { ...decision, changed: true };
  }
}
