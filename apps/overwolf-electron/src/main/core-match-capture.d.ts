declare module '*match-capture.mjs' {
  export type MatchCaptureManifest = {
    captureId: string | null;
    state: 'IDLE' | 'RECORDING' | 'STOPPED';
    files: { events: string; manifest: string; validationReport: string };
    [key: string]: unknown;
  };

  export type ActiveMatchCaptureManifest = MatchCaptureManifest & { captureId: string };

  export class MatchCaptureTracker {
    constructor(options?: Record<string, unknown>);
    start(metadata?: Record<string, unknown>): ActiveMatchCaptureManifest;
    observe(envelope: unknown, liveSnapshot: unknown): MatchCaptureManifest;
    stop(reason?: string, endedAt?: number): MatchCaptureManifest;
    snapshot(now?: number): MatchCaptureManifest;
  }
}

declare module '*match-validation.mjs' {
  export const MATCH_VALIDATION_PROFILES: { RELEASE: string; SINGLE_MATCH: string };
  export function validateJsonlRecording(text: string, options?: Record<string, unknown>): Record<string, unknown>;
}
