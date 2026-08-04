import { app } from 'electron';

export type GepEnvelope = {
  type: 'game-event' | 'info-update' | 'status';
  gameId?: number;
  payload: unknown;
  receivedAt: number;
  sourceSequence: number;
};

export type GepSink = (event: GepEnvelope) => void;

// Dota 2 Overwolf game ID. Keep configurable because environment-specific
// registration can change during development/production onboarding.
export const DEFAULT_DOTA_GAME_ID = 7314;

export const DOTA_FLOW_FEATURES = [
  'gep_internal',
  'game_state',
  'game_state_changed',
  'match_state_changed',
  'clock_time_changed',
  'match_ended',
  'kill',
  'assist',
  'death',
  'cs',
  'ward_purchase_cooldown_changed',
  'xpm',
  'gpm',
  'gold',
  'hero_leveled_up',
  'hero_buyback_info_changed',
  'hero_health_mana_info',
  'hero_status_effect_changed',
  'hero_ability_skilled',
  'hero_ability_used',
  'hero_ability_cooldown_changed',
  'hero_item_cooldown_changed',
  'hero_item_changed',
  'hero_item_used',
  'match_info',
  'roster',
  'me',
  'game',
  'damage'
] as const;

const GEP_REGISTRATION_ATTEMPTS = 4;
const GEP_REGISTRATION_DELAY_MS = 750;

type GepRuntime = {
  setRequiredFeatures(gameId: number, features: string[]): Promise<void>;
  getFeatures?(gameId: number): Promise<string[]>;
  getInfo(gameId: number): Promise<unknown>;
  on(eventName: string, listener: (...args: unknown[]) => void): unknown;
};

type DetectEvent = { enable?: () => unknown };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class OverwolfGepAdapter {
  readonly #sink: GepSink;
  readonly #gameId: number;
  #started = false;
  #sourceSequence = 0;
  #activeGameIds = new Set<number>();

  constructor(sink: GepSink, gameId = DEFAULT_DOTA_GAME_ID) {
    this.#sink = sink;
    this.#gameId = gameId;
  }

  get available(): boolean {
    return Boolean((app as unknown as { overwolf?: { packages?: { gep?: unknown } } }).overwolf?.packages?.gep);
  }

  #emit(envelope: Omit<GepEnvelope, 'receivedAt' | 'sourceSequence'>): void {
    this.#sourceSequence += 1;
    this.#sink({
      ...envelope,
      receivedAt: Date.now(),
      sourceSequence: this.#sourceSequence
    });
  }

  async #setRequiredFeaturesWithRetry(gep: GepRuntime, gameId: number, features: string[]): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= GEP_REGISTRATION_ATTEMPTS; attempt += 1) {
      try {
        await gep.setRequiredFeatures(gameId, features);
        return;
      } catch (error) {
        lastError = error;
        this.#emit({
          type: 'status',
          gameId,
          payload: {
            connection: 'registering',
            code: 'GEP_FEATURE_REGISTRATION_RETRY',
            attempt,
            maxAttempts: GEP_REGISTRATION_ATTEMPTS,
            error: errorMessage(error)
          }
        });
        if (attempt < GEP_REGISTRATION_ATTEMPTS) await delay(GEP_REGISTRATION_DELAY_MS);
      }
    }
    throw lastError;
  }

  async #activateGame(gep: GepRuntime, gameId: number, activationReason: string): Promise<void> {
    if (gameId !== this.#gameId || this.#activeGameIds.has(gameId)) return;

    try {
      let supportedFeatures: string[] = [];
      try {
        supportedFeatures = typeof gep.getFeatures === 'function' ? await gep.getFeatures(gameId) : [];
      } catch (error) {
        this.#emit({
          type: 'status',
          gameId,
          payload: {
            connection: 'registering',
            warning: 'GEP getFeatures failed; requesting the configured feature set',
            error: errorMessage(error)
          }
        });
      }

      const supportedSet = new Set(supportedFeatures);
      const requestedFeatures = supportedFeatures.length
        ? DOTA_FLOW_FEATURES.filter((feature) => supportedSet.has(feature))
        : [...DOTA_FLOW_FEATURES];
      const missingFeatures = supportedFeatures.length
        ? DOTA_FLOW_FEATURES.filter((feature) => !supportedSet.has(feature))
        : [];

      if (requestedFeatures.length === 0) {
        this.#emit({
          type: 'status',
          gameId,
          payload: {
            connection: 'disconnected',
            code: 'GEP_NO_SUPPORTED_FEATURES',
            message: 'Overwolf returned no Dota 2 features for this environment.',
            supportedFeatures
          }
        });
        return;
      }

      await this.#setRequiredFeaturesWithRetry(gep, gameId, requestedFeatures);
      this.#activeGameIds.add(gameId);
      this.#emit({
        type: 'status',
        gameId,
        payload: {
          mode: 'overwolf',
          connection: 'registered',
          activationReason,
          features: requestedFeatures,
          supportedFeatures,
          missingFeatures
        }
      });

      try {
        const current = await gep.getInfo(gameId);
        this.#emit({ type: 'info-update', gameId, payload: current });
        this.#emit({
          type: 'status',
          gameId,
          payload: {
            mode: 'overwolf',
            connection: 'connected',
            activationReason,
            initialInfoReceived: true,
            features: requestedFeatures,
            missingFeatures
          }
        });
      } catch (error) {
        this.#emit({
          type: 'status',
          gameId,
          payload: {
            connection: 'waiting-for-game',
            code: 'GEP_INITIAL_INFO_UNAVAILABLE',
            warning: 'GEP features are registered, but current Dota 2 info is not available yet.',
            error: errorMessage(error)
          }
        });
      }
    } catch (error) {
      this.#activeGameIds.delete(gameId);
      this.#emit({
        type: 'status',
        gameId,
        payload: {
          connection: 'disconnected',
          code: 'GEP_ACTIVATION_FAILED',
          attempts: GEP_REGISTRATION_ATTEMPTS,
          error: errorMessage(error),
          message: 'Failed to activate Dota 2 GEP features'
        }
      });
    }
  }

  async start(): Promise<void> {
    if (this.#started) return;
    const gep = (app as unknown as { overwolf?: { packages?: { gep?: unknown } } }).overwolf?.packages?.gep as GepRuntime | undefined;
    if (!gep) {
      this.#emit({
        type: 'status',
        payload: {
          mode: 'live',
          available: false,
          connection: 'disconnected',
          code: 'OVERWOLF_RUNTIME_UNAVAILABLE',
          message: 'Approved Overwolf GEP runtime is unavailable; LIVE_GEP failed closed.'
        }
      });
      return;
    }

    gep.on('new-game-event', this.#onGameEvent);
    gep.on('new-info-update', this.#onInfoUpdate);
    gep.on('game-detected', (...args: unknown[]) => void this.#onGameDetected(gep, args));
    gep.on('game-exit', (...args: unknown[]) => this.#onGameExit(args));
    gep.on('elevated-privileges-required', (...args: unknown[]) => this.#onElevatedPrivileges(args));
    gep.on('error', (...args: unknown[]) => this.#onError(args));
    this.#started = true;

    this.#emit({
      type: 'status',
      gameId: this.#gameId,
      payload: {
        mode: 'overwolf',
        available: true,
        connection: 'initializing',
        message: 'GEP listeners registered; waiting for Dota 2 detection or current info.'
      }
    });

    // Also attempt immediate activation when Dota was already running before
    // the app started. The game-detected path re-registers after event.enable().
    await this.#activateGame(gep, this.#gameId, 'APP_STARTUP');
  }

  async #onGameDetected(gep: GepRuntime, args: unknown[]): Promise<void> {
    const event = args[0] as DetectEvent | undefined;
    const gameId = args.find((value) => typeof value === 'number') as number | undefined;
    if (gameId !== this.#gameId) return;

    try {
      await Promise.resolve(event?.enable?.());
      this.#emit({
        type: 'status',
        gameId,
        payload: { connection: 'detecting', message: 'Dota 2 detected; enabling GEP' }
      });
      this.#activeGameIds.delete(gameId);
      await this.#activateGame(gep, gameId, 'GAME_DETECTED');
    } catch (error) {
      this.#activeGameIds.delete(gameId);
      this.#emit({
        type: 'status',
        gameId,
        payload: {
          connection: 'disconnected',
          code: 'GEP_ENABLE_FAILED',
          error: errorMessage(error),
          message: 'Failed to enable detected Dota 2 process'
        }
      });
    }
  }

  #onGameExit(args: unknown[]): void {
    const gameId = args.find((value) => typeof value === 'number') as number | undefined;
    if (gameId !== this.#gameId) return;
    this.#activeGameIds.delete(gameId);
    this.#emit({
      type: 'status',
      gameId,
      payload: { connection: 'disconnected', code: 'GAME_EXIT', message: 'Dota 2 exited' }
    });
  }

  #onElevatedPrivileges(args: unknown[]): void {
    const gameId = args.find((value) => typeof value === 'number') as number | undefined;
    if (gameId !== this.#gameId) return;
    this.#emit({
      type: 'status',
      gameId,
      payload: {
        connection: 'disconnected',
        code: 'PRIVILEGE_MISMATCH',
        warning: 'Dota 2 is running elevated; Dota Flow must run with matching privileges'
      }
    });
  }

  #onError(args: unknown[]): void {
    const gameId = args.find((value) => typeof value === 'number') as number | undefined;
    const error = args.find((value) => value instanceof Error)
      ?? args.find((value) => typeof value === 'string')
      ?? 'Unknown GEP error';
    this.#emit({
      type: 'status',
      gameId,
      payload: { code: 'GEP_RUNTIME_ERROR', error: errorMessage(error), connection: 'reconnecting' }
    });
  }

  readonly #onGameEvent = (...args: unknown[]): void => {
    const { gameId, payload } = extractGepArgs(args, this.#gameId);
    this.#emit({ type: 'game-event', gameId, payload });
  };

  readonly #onInfoUpdate = (...args: unknown[]): void => {
    const { gameId, payload } = extractGepArgs(args, this.#gameId);
    this.#emit({ type: 'info-update', gameId, payload });
  };
}

function extractGepArgs(args: unknown[], fallbackGameId: number): { gameId: number; payload: unknown } {
  const gameId = args.find((value) => typeof value === 'number') as number | undefined;
  const payloadCandidates = args.filter((value) => {
    if (!value || typeof value !== 'object') return false;
    const maybeEvent = value as { sender?: unknown; preventDefault?: unknown; enable?: unknown };
    return !('sender' in maybeEvent || 'preventDefault' in maybeEvent || 'enable' in maybeEvent);
  });
  return {
    gameId: gameId ?? fallbackGameId,
    payload: payloadCandidates.at(-1) ?? args.at(-1)
  };
}
