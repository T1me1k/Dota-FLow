import 'electron';

type OverwolfGepListener = (...args: unknown[]) => void;

declare module 'electron' {
  interface App {
    overwolf?: {
      packages?: {
        gep?: {
          setRequiredFeatures(gameId: number, features: string[] | undefined): Promise<void>;
          getFeatures(gameId: number): Promise<string[]>;
          getInfo(gameId: number): Promise<unknown>;
          on(event: 'new-game-event' | 'new-info-update' | 'game-detected' | 'game-exit' | 'elevated-privileges-required' | 'error', listener: OverwolfGepListener): unknown;
          off?(event: string, listener: OverwolfGepListener): unknown;
        };
      };
    };
  }
}
