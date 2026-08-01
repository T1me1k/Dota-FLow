declare module '*live-gep-bridge.mjs' {
  export type LiveBridgeSnapshot = Record<string, unknown>;

  export class LiveGepBridge {
    constructor(options?: Record<string, unknown>);
    ingestEnvelope(envelope: unknown): LiveBridgeSnapshot;
    ingestManualContext(command: string, options?: Record<string, unknown>): LiveBridgeSnapshot;
    snapshot(now?: number): LiveBridgeSnapshot;
    reset(options?: Record<string, unknown>): LiveBridgeSnapshot;
    stop(reason?: string): LiveBridgeSnapshot;
  }
}
