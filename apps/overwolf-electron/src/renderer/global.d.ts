export {};

declare global {
  interface Window {
    dotaFlow: {
      onGepEnvelope(listener: (envelope: unknown) => void): () => void;
      onLiveSnapshot(listener: (snapshot: unknown) => void): () => void;
      onOverlaySettings(listener: (settings: unknown) => void): () => void;
      onCaptureStatus(listener: (status: unknown) => void): () => void;
      getLiveSnapshot(): Promise<unknown>;
      resetLiveSession(): Promise<unknown>;
      getOverlaySettings(): Promise<unknown>;
      setOverlaySettings(settings: unknown): Promise<unknown>;
      showOverlay(): Promise<void>;
      hideOverlay(): Promise<void>;
      getCaptureStatus(): Promise<unknown>;
      startCapture(): Promise<unknown>;
      stopCapture(): Promise<unknown>;
      openRecordingsFolder(): Promise<string>;
      applyManualContext(command: string): Promise<unknown>;
      getManualContextShortcuts(): Promise<Record<string, string>>;
      applyCoachEvent(eventType: string, payload: unknown): Promise<unknown>;
    };
  }
}
