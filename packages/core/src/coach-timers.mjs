export const COACH_TIMER_KINDS = Object.freeze({
  ROSHAN: 'ROSHAN',
  AEGIS: 'AEGIS',
  GLYPH: 'GLYPH',
  BUYBACK: 'BUYBACK',
  ULTIMATE: 'ULTIMATE'
});

const DEFAULT_DURATIONS = Object.freeze({
  AEGIS: 5 * 60,
  GLYPH: 5 * 60,
  BUYBACK: 8 * 60
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nextPeriodic(now, first, interval, end = Infinity) {
  if (now < first) return first;
  const candidate = first + Math.ceil((now - first + 0.001) / interval) * interval;
  return candidate <= end ? candidate : null;
}

export function createCoachTimer(kind, options = {}) {
  const normalizedKind = String(kind ?? '').toUpperCase();
  if (!Object.values(COACH_TIMER_KINDS).includes(normalizedKind)) {
    throw new TypeError(`Unknown coach timer kind: ${kind}`);
  }
  const startedAtSec = finite(options.startedAtSec, 0);
  const durationSec = finite(options.durationSec, DEFAULT_DURATIONS[normalizedKind] ?? 0);
  const minDurationSec = finite(options.minDurationSec, normalizedKind === COACH_TIMER_KINDS.ROSHAN ? 8 * 60 : durationSec);
  const maxDurationSec = finite(options.maxDurationSec, normalizedKind === COACH_TIMER_KINDS.ROSHAN ? 11 * 60 : durationSec);
  const owner = options.owner ?? null;
  return {
    id: options.id ?? `${normalizedKind.toLowerCase()}:${owner ?? 'global'}`,
    kind: normalizedKind,
    label: options.label ?? (owner ? `${owner} ${normalizedKind}` : normalizedKind),
    owner,
    startedAtSec,
    durationSec,
    minDurationSec,
    maxDurationSec,
    source: options.source ?? 'manual'
  };
}

export function upsertCoachTimer(timers = [], timer) {
  const normalized = createCoachTimer(timer.kind, timer);
  return [...timers.filter((entry) => entry.id !== normalized.id), normalized];
}

export function clearCoachTimer(timers = [], timerId) {
  return timers.filter((entry) => entry.id !== timerId);
}

function evaluateTrackedTimer(timer, now) {
  const minReadyAtSec = timer.startedAtSec + timer.minDurationSec;
  const maxReadyAtSec = timer.startedAtSec + timer.maxDurationSec;
  const readyAtSec = timer.startedAtSec + timer.durationSec;
  let status = 'RUNNING';
  if (timer.kind === COACH_TIMER_KINDS.ROSHAN) {
    if (now >= maxReadyAtSec) status = 'READY';
    else if (now >= minReadyAtSec) status = 'WINDOW';
  } else if (now >= readyAtSec) status = 'READY';
  const nextAtSec = timer.kind === COACH_TIMER_KINDS.ROSHAN ? minReadyAtSec : readyAtSec;
  return {
    ...timer,
    status,
    readyAtSec,
    minReadyAtSec,
    maxReadyAtSec,
    remainingSec: Math.max(0, nextAtSec - now),
    windowRemainingSec: Math.max(0, maxReadyAtSec - now)
  };
}

function periodicTimer(id, label, nextAtSec, now, category) {
  if (nextAtSec === null) return null;
  return {
    id,
    label,
    category,
    nextAtSec,
    remainingSec: Math.max(0, nextAtSec - now),
    status: nextAtSec <= now ? 'READY' : 'UPCOMING',
    source: 'game_clock'
  };
}

export function evaluateCoachTimers(state, timers = state.coachContext?.timers ?? []) {
  const now = Math.max(0, finite(state.gameTimeSec, 0));
  const periodic = [
    periodicTimer('water-rune', 'Water Rune', nextPeriodic(now, 2 * 60, 2 * 60, 4 * 60), now, 'RUNE'),
    periodicTimer('power-rune', 'Power Rune', nextPeriodic(now, 6 * 60, 2 * 60), now, 'RUNE'),
    periodicTimer('wisdom-rune', 'Wisdom Rune', nextPeriodic(now, 7 * 60, 7 * 60), now, 'RUNE'),
    periodicTimer('day-night', Math.floor(now / 300) % 2 === 0 ? 'Night begins' : 'Day begins', (Math.floor(now / 300) + 1) * 300, now, 'DAY_NIGHT')
  ].filter(Boolean);

  const tracked = timers.map((timer) => evaluateTrackedTimer(createCoachTimer(timer.kind, timer), now));
  const alerts = [...periodic, ...tracked]
    .filter((timer) => timer.status === 'READY' || timer.status === 'WINDOW' || timer.remainingSec <= 45)
    .sort((a, b) => (a.remainingSec ?? 0) - (b.remainingSec ?? 0));

  return {
    gameTimeSec: now,
    periodic,
    tracked,
    alerts,
    next: [...periodic, ...tracked]
      .filter((timer) => timer.status !== 'READY')
      .sort((a, b) => (a.remainingSec ?? Infinity) - (b.remainingSec ?? Infinity))[0] ?? null
  };
}
