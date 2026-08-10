const WEATHER_EVENT_NAMES = new Set(['clock_time_changed', 'daytime_changed']);

function objectOf(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function eventCandidates(payload) {
  if (Array.isArray(payload)) return payload;
  const value = objectOf(payload);
  if (Array.isArray(value.events)) return value.events;
  if (value.name || value.event || value.feature) return [value];
  return [];
}

function eventData(event) {
  const value = objectOf(event);
  const parsed = parseMaybeJson(value.data ?? value.value ?? {});
  return objectOf(parsed);
}

export function createCosmeticWeatherTelemetry(overrides = {}) {
  return {
    source: 'UNAVAILABLE',
    daytime: null,
    nightstalkerNight: false,
    clockTimeSec: null,
    observedAt: null,
    eventName: null,
    ...overrides
  };
}

export function updateCosmeticWeatherTelemetry(previous, envelope) {
  const current = createCosmeticWeatherTelemetry(previous);
  if (!envelope || typeof envelope !== 'object') return current;

  if (envelope.type === 'status') {
    const status = objectOf(envelope.payload);
    if (String(status.code ?? '').toUpperCase() === 'GAME_EXIT') {
      return createCosmeticWeatherTelemetry();
    }
    return current;
  }

  if (envelope.type !== 'game-event') return current;

  let next = current;
  for (const event of eventCandidates(envelope.payload)) {
    const raw = objectOf(event);
    const name = String(raw.name ?? raw.event ?? raw.feature ?? '');
    if (!WEATHER_EVENT_NAMES.has(name)) continue;

    const data = eventData(raw);
    const clock = Number(data.clock_time ?? data.time);
    const hasDaytime = typeof data.daytime === 'boolean';
    const hasNightstalkerNight = typeof data.nightstalker_night === 'boolean';
    if (!hasDaytime && !hasNightstalkerNight && !Number.isFinite(clock)) continue;

    next = {
      ...next,
      source: 'OVERWOLF_GEP',
      ...(hasDaytime ? { daytime: data.daytime } : {}),
      ...(hasNightstalkerNight ? { nightstalkerNight: data.nightstalker_night } : {}),
      ...(Number.isFinite(clock) ? { clockTimeSec: clock } : {}),
      observedAt: Number.isFinite(Number(envelope.receivedAt)) ? Number(envelope.receivedAt) : Date.now(),
      eventName: name
    };
  }
  return next;
}

export function cosmeticWeatherIsFresh(telemetry, nowMs = Date.now(), staleAfterMs = 3_000) {
  const observedAt = Number(telemetry?.observedAt);
  return telemetry?.source === 'OVERWOLF_GEP'
    && Number.isFinite(observedAt)
    && nowMs - observedAt <= staleAfterMs;
}

export function shouldShowBloodMoon(settings, telemetry, phase, nowMs = Date.now()) {
  if (settings?.weatherEnabled !== true) return false;
  if (String(phase ?? '').toLowerCase() !== 'playing') return false;

  const activation = String(settings?.weatherActivation ?? 'NIGHT_ONLY').toUpperCase();
  if (activation === 'ALWAYS') return true;
  if (!cosmeticWeatherIsFresh(telemetry, nowMs)) return false;
  return telemetry?.nightstalkerNight === true || telemetry?.daytime === false;
}
