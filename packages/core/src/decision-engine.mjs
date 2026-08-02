import {
  MACRO_ACTIONS,
  healthPct,
  manaPct,
  targetGoldRemaining
} from './game-state.mjs';
import { benchmarkAt, getHeroProfile } from './hero-profiles.mjs';
import { evaluatePowerState } from './power-spike-engine.mjs';

function add(score, action, points, reason) {
  score[action].value += points;
  if (reason) score[action].reasons.push({ points, text: reason });
}

function createScores() {
  return Object.fromEntries(
    Object.values(MACRO_ACTIONS).map((action) => [
      action,
      { value: action === MACRO_ACTIONS.NEUTRAL ? 5 : 0, reasons: [] }
    ])
  );
}

function applyPowerState(score, powerState) {
  for (const [action, points] of Object.entries(powerState.actionBias)) {
    if (!score[action] || !points) continue;
    const spikeName = powerState.primarySpike?.name ?? powerState.nextSpike?.name;
    const statusText = powerState.status === 'APPROACHING' ? 'приближается' : 'активен';
    add(score, action, points, spikeName ? `${spikeName}: силовой тайминг ${statusText}` : null);
  }

  const d = powerState.dimensions;
  if (d.farm >= 78) add(score, MACRO_ACTIONS.FARM, 10, 'Герой сейчас особенно эффективно ускоряет экономику');
  if (d.fight >= 78) add(score, MACRO_ACTIONS.FIGHT, 12, 'Текущая боевая сила героя высокая');
  if (d.push >= 78) add(score, MACRO_ACTIONS.PRESSURE, 11, 'Высокая сила давления по линиям и строениям');
  if (d.objective >= 82) add(score, MACRO_ACTIONS.OBJECTIVE, 14, 'Герой силён при взятии Roshan и объектов');
  if (d.initiation >= 70) add(score, MACRO_ACTIONS.CONNECT, 9, 'Появился надёжный способ начать действие');
  if (d.survival < 42) add(score, MACRO_ACTIONS.FIGHT, -10, 'Текущая выживаемость недостаточна для прямого входа');

  if (powerState.status === 'APPROACHING' && powerState.nextSpike) {
    const missing = powerState.nextSpike.proximity?.missing?.join(', ');
    add(score, MACRO_ACTIONS.FARM, 14, `Близко окно ${powerState.nextSpike.name}${missing ? ` (${missing})` : ''}`);
    add(score, MACRO_ACTIONS.FIGHT, -8, 'Не рискуй перед ближайшим силовым таймингом');
  }

  if (powerState.status === 'FADING') {
    add(score, MACRO_ACTIONS.FIGHT, 6, 'Окно силы заканчивается — используй его сейчас или переключись');
  }

  for (const blocker of powerState.blockers.slice(0, 2)) {
    add(score, MACRO_ACTIONS.FIGHT, -8, blocker);
  }
}

export function evaluateMacroDecision(state) {
  const score = createScores();
  const profile = getHeroProfile(state.hero);
  const benchmark = benchmarkAt(profile, state.gameTimeSec);
  const powerState = evaluatePowerState(state);
  const hp = healthPct(state);
  const mana = manaPct(state);
  const remaining = targetGoldRemaining(state);
  const gpmDelta = state.gpm - benchmark.gpm;

  if (state.phase !== 'playing') {
    return buildDecision(state, score, benchmark, powerState, {
      action: MACRO_ACTIONS.NEUTRAL,
      confidence: 1,
      headline: 'Ожидание матча',
      message: 'Macro Engine активируется после начала игры.'
    });
  }

  if (!state.alive) add(score, MACRO_ACTIONS.RESET, 100, 'Герой мёртв — готовим следующее действие');

  if (hp < 0.35) add(score, MACRO_ACTIONS.RESET, 38, 'Низкий запас здоровья');
  else if (hp < 0.58) add(score, MACRO_ACTIONS.RESET, 18, 'Здоровья недостаточно для надёжной драки');
  else add(score, MACRO_ACTIONS.FIGHT, 8, 'Достаточный запас здоровья');

  if (mana < 0.25) add(score, MACRO_ACTIONS.RESET, 24, 'Мало маны');
  else if (mana > 0.58) add(score, MACRO_ACTIONS.FIGHT, 8, 'Достаточный запас маны');

  if (state.gold >= 2200) add(score, MACRO_ACTIONS.RESET, 18, 'Много золота — выгодно купить предметы');
  if (state.unreliableGold >= 1800) add(score, MACRO_ACTIONS.RESET, 14, 'Высокий риск потерять ненадёжное золото');

  if (remaining !== null) {
    if (remaining > 0 && remaining <= 1300) {
      add(score, MACRO_ACTIONS.FARM, 32, `До ${state.targetItem.name} осталось ${remaining} золота`);
      add(score, MACRO_ACTIONS.FIGHT, -16, 'Не стоит рисковать перед ключевым предметом');
    } else if (remaining > 1300) {
      add(score, MACRO_ACTIONS.FARM, 16, `Следующий предмет ещё не близко: ${remaining} золота`);
    } else {
      add(score, MACRO_ACTIONS.CONNECT, 18, `${state.targetItem.name} уже доступен`);
      add(score, MACRO_ACTIONS.FIGHT, 12, 'Ключевой предмет завершён');
      add(score, MACRO_ACTIONS.PRESSURE, 8, 'Можно конвертировать предмет в давление');
    }
  }

  if (gpmDelta < -80) add(score, MACRO_ACTIONS.FARM, 24, `GPM ниже темпа на ${Math.abs(gpmDelta)}`);
  else if (gpmDelta < -30) add(score, MACRO_ACTIONS.FARM, 12, 'Нужно восстановить темп фарма');
  else if (gpmDelta > 80) add(score, MACRO_ACTIONS.PRESSURE, 16, 'Ты заметно опережаешь ожидаемый темп');

  if (state.ultimateReady) {
    add(score, MACRO_ACTIONS.FIGHT, 12, 'Ультимейт готов');
    add(score, MACRO_ACTIONS.CONNECT, 9, 'Можно подключаться к команде');
  } else {
    add(score, MACRO_ACTIONS.FARM, 8, 'Ультимейт недоступен');
    add(score, MACRO_ACTIONS.FIGHT, -8, 'Без ультимейта драка слабее');
  }

  if (state.context.enemyCoreDead) {
    add(score, MACRO_ACTIONS.PRESSURE, 55, 'Вражеский core мёртв — конвертируй окно в объект');
    add(score, MACRO_ACTIONS.OBJECTIVE, 22, 'Численное преимущество упрощает Roshan или башню');
    add(score, MACRO_ACTIONS.FIGHT, 8, 'У противника временно меньше силы');
  }

  if (state.context.alliesReady >= 3) add(score, MACRO_ACTIONS.CONNECT, 18, 'Большая часть команды готова к действию');
  if (state.context.roshanAvailable && powerState.dimensions.objective >= 82) {
    add(score, MACRO_ACTIONS.OBJECTIVE, 18, 'Roshan доступен, а герой хорошо забирает объект');
  }

  if (!state.context.safeRouteAvailable) {
    add(score, MACRO_ACTIONS.FARM, -14, 'Безопасный маршрут фарма не найден');
    add(score, MACRO_ACTIONS.RESET, 12, 'Карта сейчас опасна');
  }

  if (state.gameTimeSec < 8 * 60) {
    add(score, MACRO_ACTIONS.FARM, 10, 'Ранняя стадия: приоритет стабильной экономики');
    add(score, MACRO_ACTIONS.PRESSURE, -8, 'Рано форсировать глубокое давление');
  }

  applyPowerState(score, powerState);

  const ranked = Object.entries(score)
    .filter(([action]) => action !== MACRO_ACTIONS.NEUTRAL)
    .sort((a, b) => b[1].value - a[1].value);

  const [bestAction, best] = ranked[0];
  const [, second] = ranked[1];
  const margin = best.value - second.value;
  const profileConfidenceCap = profile.calibrationTier === 'BASELINE' ? 0.74 : 0.98;
  const confidence = Math.max(0.25, Math.min(profileConfidenceCap, 0.43 + margin / 70 + powerState.confidence * 0.12));
  const action = margin < 8 && best.value < 70 ? MACRO_ACTIONS.NEUTRAL : bestAction;

  return buildDecision(state, score, benchmark, powerState, {
    action,
    confidence,
    margin,
    reasons: best.reasons
      .filter((reason) => reason.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 4)
      .map((reason) => reason.text)
  });
}

function buildDecision(state, scores, benchmark, powerState, override) {
  const labels = {
    FARM: ['ФАРМ', 'Заверши ближайший безопасный цикл фарма.'],
    CONNECT: ['ПОДКЛЮЧАЙСЯ', 'Закончи текущее действие и двигайся к команде.'],
    FIGHT: ['ДЕРИСЬ', 'У тебя есть окно силы для выгодной драки.'],
    PRESSURE: ['ДАВИ', 'Конвертируй преимущество в линию или башню.'],
    RESET: ['СБРОСЬ ТЕМП', 'Отойди, восстановись и потрать золото.'],
    OBJECTIVE: ['ОБЪЕКТ', 'Соберись вокруг Roshan или ближайшего важного объекта.'],
    NEUTRAL: ['БЕЗ РЕЗКОЙ СМЕНЫ', 'Продолжай текущее безопасное действие.']
  };
  const [headline, message] = labels[override.action];

  return {
    action: override.action,
    headline: override.headline ?? headline,
    message: override.message ?? message,
    confidence: override.confidence ?? 0.5,
    margin: override.margin ?? 0,
    reasons: override.reasons ?? [],
    benchmark: {
      expectedGpm: benchmark.gpm,
      expectedLevel: benchmark.level,
      gpmDelta: state.gpm - benchmark.gpm
    },
    powerState,
    profile: {
      id: powerState.hero,
      displayName: powerState.displayName,
      calibrationTier: powerState.calibrationTier,
      profileTemplate: powerState.profileTemplate
    },
    scores: Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, value.value])),
    generatedAt: Date.now()
  };
}

export class StableDecisionCoordinator {
  constructor({ minimumHoldSec = 18, switchMargin = 12 } = {}) {
    this.minimumHoldSec = minimumHoldSec;
    this.switchMargin = switchMargin;
    this.current = null;
    this.changedAtGameTime = null;
  }

  update(state) {
    const candidate = evaluateMacroDecision(state);
    if (!this.current) return this.#accept(candidate, state.gameTimeSec);
    if (candidate.action === this.current.action) {
      this.current = candidate;
      return { ...candidate, changed: false };
    }

    const heldFor = state.gameTimeSec - this.changedAtGameTime;
    const urgent = candidate.action === MACRO_ACTIONS.RESET && candidate.scores.RESET >= 50;
    const strongSwitch = candidate.margin >= this.switchMargin;
    const staleResetCleared = this.current.action === MACRO_ACTIONS.RESET
      && candidate.action !== MACRO_ACTIONS.RESET
      && state.alive !== false
      && healthPct(state) >= 0.58
      && manaPct(state) >= 0.25
      && Number(state.gold ?? 0) < 2200
      && Number(state.unreliableGold ?? 0) < 1800
      && state.context?.safeRouteAvailable !== false;

    if (urgent || staleResetCleared || (heldFor >= this.minimumHoldSec && strongSwitch)) {
      return this.#accept(candidate, state.gameTimeSec);
    }

    return {
      ...candidate,
      action: this.current.action,
      headline: this.current.headline,
      message: this.current.message,
      reasons: this.current.reasons,
      changed: false,
      pendingAction: candidate.action,
      pendingConfidence: candidate.confidence
    };
  }

  #accept(decision, gameTimeSec) {
    this.current = decision;
    this.changedAtGameTime = gameTimeSec;
    return { ...decision, changed: true };
  }
}
