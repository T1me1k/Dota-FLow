declare module '*manual-context.mjs' {
  export type ManualContextEnvelope = {
    type: 'manual-context';
    receivedAt: number;
    sourceSequence?: string | number;
    payload: {
      command: string;
      label: string;
      patch: Record<string, unknown>;
      gameTimeSec?: number;
      note?: string;
    };
  };

  export function createManualContextEnvelope(command: string, options?: Record<string, unknown>): ManualContextEnvelope;
}
