declare module '*coach-events.mjs' {
  export type CoachEventEnvelope = {
    type: 'coach-event';
    payload: { eventType: string; payload: Record<string, unknown>; gameTimeSec?: number; label?: string };
    receivedAt: number;
    sourceSequence?: string | number;
  };
  export function createCoachEventEnvelope(eventType: string, payload?: Record<string, unknown>, options?: Record<string, unknown>): CoachEventEnvelope;
}
