import { GAME_EVENT_TYPES } from './game-events.mjs';

const ALLOWED = new Set([
  GAME_EVENT_TYPES.COACH_TIMER_STARTED,
  GAME_EVENT_TYPES.COACH_TIMER_CLEARED,
  GAME_EVENT_TYPES.SCOUTING_UPDATED,
  GAME_EVENT_TYPES.COACH_SETTINGS_UPDATED
]);

export function createCoachEventEnvelope(eventType, payload = {}, options = {}) {
  if (!ALLOWED.has(eventType)) throw new TypeError(`Unsupported coach event: ${eventType}`);
  const receivedAt = Number.isFinite(Number(options.receivedAt)) ? Number(options.receivedAt) : Date.now();
  return {
    type: 'coach-event',
    receivedAt,
    sourceSequence: options.sourceSequence ?? `coach:${eventType}:${receivedAt}`,
    payload: {
      eventType,
      payload: payload && typeof payload === 'object' ? payload : {},
      ...(Number.isFinite(Number(options.gameTimeSec)) ? { gameTimeSec: Number(options.gameTimeSec) } : {}),
      ...(options.label ? { label: String(options.label) } : {})
    }
  };
}

export function coachEnvelopeToGameEvent(envelope) {
  const eventType = envelope?.payload?.eventType;
  if (!ALLOWED.has(eventType)) return null;
  return {
    type: eventType,
    source: 'coach',
    ...(Number.isFinite(Number(envelope.payload?.gameTimeSec)) ? { gameTimeSec: Number(envelope.payload.gameTimeSec) } : {}),
    payload: envelope.payload?.payload && typeof envelope.payload.payload === 'object' ? envelope.payload.payload : {}
  };
}
