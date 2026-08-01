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

type GepRuntime = {
  setRequiredFeatures(gameId: number, features: string[]): Promise<void>;
  getFeatures?(gameId: number): Promise<string[]>;
  getInfo(gameId: number): Promise<unknown>;
  on(eventName: string, listener: (...args: unknown[]) => void): unknown;
};

type DetectEvent = { enable?: () => unknown };

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

  async #activateGame(gep: GepRuntime, gameId: number, activationReason: string): Promise<void> {
    if (gameId !== this.#gameId || this.#activeGameIds.has(gameId)) return;
    this.#activeGameIds.add(gameId);
    try {
      let supportedFeatures: string[] = [];
      try {
        supportedFeatures = typeof gep.getFeatures === 'function' ? await gep.getFeatures(gameId) : [];
      } catch (error) {
        this.#emit({
          type: 'status',
          gameId,
          payload: { warning: 'GEP getFeatures failed; requesting the configured feature set', error: String(error) }
        });
      }

      const supportedSet = new Set(supportedFeatures);
      const requestedFeatures = supportedFeatures.length
        ? DOTA_FLOW_FEATURES.filter((feature) => supportedSet.has(feature))
        : [...DOTA_FLOW_FEATURES];
      const missingFeatures = supportedFeatures.length
        ? DOTA_FLOW_FEATURES.filter((feature) => !supportedSet.has(feature))
        : [];

      await gep.setRequiredFeatures(gameId, requestedFeatures);
      this.#emit({
        type: 'status',
        gameId,
        payload: {
          mode: 'overwolf',
          connection: 'connected',
          activationReason,
          features: requestedFeatures,
          supportedFeatures,
          missingFeatures
        }
      });

      try {
        const current = await gep.getInfo(gameId);
        this.#emit({ type: 'info-update', gameId, payload: current });
      } catch (error) {
        this.#emit({
          type: 'status',
          gameId,
          payload: { warning: 'Initial GEP getInfo failed', error: String(error) }
        });
      }
    } catch (error) {
      this.#activeGameIds.delete(gameId);
      this.#emit({
        type: 'status',
        gameId,
        payload: { connection: 'disconnected', error: String(error), message: 'Failed to activate Dota 2 GEP features' }
      });
    }
  }

  async start(): Promise<void> {
    if (this.#started) return;
    const gep = (app as unknown as { overwolf?: { packages?: { gep?: unknown } } }).overwolf?.packages?.gep as GepRuntime | undefined;
    if (!gep) {
      this.#emit({
        type: 'status',
        payload: { mode: 'live', available: false, code: 'OVERWOLF_RUNTIME_UNAVAILABLE', message: 'Approved Overwolf GEP runtime is unavailable; LIVE_GEP failed closed.' }
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

    // Also attempt immediate activation for the case where Dota was already
    // running before the app started. The game-detected path remains primary.
    await this.#activateGame(gep, this.#gameId, 'APP_STARTUP');
  }

  async #onGameDetected(gep: GepRuntime, args: unknown[]): Promise<void> {
    const event = args[0] as DetectEvent | undefined;
    const gameId = args.find((value) => typeof value === 'number') as number | undefined;
    if (gameId !== this.#gameId) return;
    try {
      await Promise.resolve(event?.enable?.());
      this.#emit({ type: 'status', gameId, payload: { connection: 'detecting', message: 'Dota 2 detected; enabling GEP' } });
      await this.#activateGame(gep, gameId, 'GAME_DETECTED');
    } catch (error) {
      this.#emit({ type: 'status', gameId, payload: { connection: 'disconnected', error: String(error), message: 'Failed to enable detected Dota 2 process' } });
    }
  }

  #onGameExit(args: unknown[]): void {
    const gameId = args.find((value) => typeof value === 'number') as number | undefined;
    if (gameId !== this.#gameId) return;
    this.#activeGameIds.delete(gameId);
    this.#emit({ type: 'status', gameId, payload: { connection: 'disconnected', message: 'Dota 2 exited' } });
  }

  #onElevatedPrivileges(args: unknown[]): void {
    const gameId = args.find((value) => typeof value === 'number') as number | undefined;
    if (gameId !== this.#gameId) return;
    this.#emit({
      type: 'status',
      gameId,
      payload: { warning: 'Dota 2 is running elevated; Dota Flow must run with matching privileges' }
    });
  }

  #onError(args: unknown[]): void {
    const gameId = args.find((value) => typeof value === 'number') as number | undefined;
    const error = args.find((value) => typeof value === 'string') ?? 'Unknown GEP error';
    this.#emit({ type: 'status', gameId, payload: { error: String(error), connection: 'reconnecting' } });
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
