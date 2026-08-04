import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { DEFAULT_DOTA_GAME_ID, type GepEnvelope, type GepSink } from './overwolf-gep-adapter.js';

const DEFAULT_GSI_HOST = '127.0.0.1';
const DEFAULT_GSI_PORT = 32123;
const DEFAULT_GSI_PATH = '/dota-flow-gsi';
const DEFAULT_GSI_TOKEN = 'dota-flow-local-v1';
const DEFAULT_GSI_EMIT_INTERVAL_MS = 250;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

type JsonObject = Record<string, unknown>;

type DotaGsiSnapshot = JsonObject & {
  auth?: JsonObject;
  provider?: JsonObject;
  map?: JsonObject;
  player?: JsonObject;
  hero?: JsonObject;
  abilities?: JsonObject;
  items?: JsonObject;
};

export type DotaGsiAdapterOptions = {
  host?: string;
  port?: number;
  path?: string;
  token?: string;
  emitIntervalMs?: number;
};

function finiteNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  const string = String(value ?? '').trim();
  return string ? string : undefined;
}

function normalizeHero(value: unknown): string | undefined {
  return nonEmptyString(value)?.replace(/^npc_dota_hero_/, '');
}

function normalizeTeam(value: unknown): 'radiant' | 'dire' | undefined {
  const team = String(value ?? '').trim().toLowerCase();
  if (team === 'radiant' || team === 'team2' || team === '2') return 'radiant';
  if (team === 'dire' || team === 'team3' || team === '3') return 'dire';
  return undefined;
}

function normalizePhase(value: unknown): 'pregame' | 'playing' | 'ended' {
  const state = String(value ?? '').toLowerCase();
  if (state.includes('post_game') || state.includes('game_over')) return 'ended';
  if (state.includes('game_in_progress') || state === 'playing') return 'playing';
  return 'pregame';
}

function inventoryFromGsi(items: JsonObject | undefined): Array<Record<string, unknown>> {
  if (!items) return [];
  return Object.entries(items).flatMap(([slot, raw]) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const item = raw as JsonObject;
    const rawName = nonEmptyString(item.name);
    if (!rawName || rawName === 'empty') return [];
    const id = rawName.replace(/^item_/, '');
    return [{
      id,
      name: id,
      slot,
      location: slot.startsWith('stash') ? 'stash' : slot.startsWith('neutral') ? 'neutral' : 'inventory',
      ...(finiteNumber(item.charges) !== undefined ? { charges: finiteNumber(item.charges) } : {}),
      ...(finiteNumber(item.cooldown) !== undefined ? { cooldown: finiteNumber(item.cooldown) } : {})
    }];
  });
}

function abilitiesFromGsi(abilities: JsonObject | undefined): Record<string, Record<string, unknown>> {
  if (!abilities) return {};
  return Object.fromEntries(Object.entries(abilities).flatMap(([slot, raw]) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const ability = raw as JsonObject;
    const name = nonEmptyString(ability.name);
    if (!name) return [];
    return [[slot, {
      slot,
      name,
      level: finiteNumber(ability.level) ?? 0,
      cooldown: finiteNumber(ability.cooldown) ?? 0,
      canCast: Boolean(ability.can_cast),
      passive: Boolean(ability.passive),
      ultimate: Boolean(ability.ultimate)
    }]];
  }));
}

function statusEffectsFromGsi(hero: JsonObject | undefined): Record<string, boolean> {
  if (!hero) return {};
  return {
    silenced: Boolean(hero.silenced),
    stunned: Boolean(hero.stunned),
    disarmed: Boolean(hero.disarmed),
    magicImmune: Boolean(hero.magicimmune),
    hexed: Boolean(hero.hexed),
    muted: Boolean(hero.muted),
    broken: Boolean(hero.break),
    smoked: Boolean(hero.smoked),
    hasDebuff: Boolean(hero.has_debuff)
  };
}

export function createSnapshotPayload(snapshot: DotaGsiSnapshot): Record<string, unknown> {
  const provider = snapshot.provider ?? {};
  const map = snapshot.map ?? {};
  const player = snapshot.player ?? {};
  const hero = snapshot.hero ?? {};
  const phase = normalizePhase(map.game_state);
  const rawGameTimeSec = finiteNumber(map.clock_time) ?? finiteNumber(map.game_time) ?? 0;
  const gameTimeSec = phase === 'pregame'
    ? Math.abs(Math.trunc(rawGameTimeSec))
    : Math.max(0, Math.trunc(rawGameTimeSec));
  const matchId = nonEmptyString(map.matchid);
  const health = finiteNumber(hero.health);
  const maxHealth = finiteNumber(hero.max_health);
  const mana = finiteNumber(hero.mana);
  const maxMana = finiteNumber(hero.max_mana);
  const buybackCooldown = finiteNumber(hero.buyback_cooldown);
  const positionX = finiteNumber(hero.xpos);
  const positionY = finiteNumber(hero.ypos);

  return {
    source: 'gsi',
    phase,
    gameTimeSec,
    clock_time: gameTimeSec,
    clockMode: phase === 'pregame' ? 'countdown' : 'elapsed',
    rawClockTimeSec: rawGameTimeSec,
    rawGameState: nonEmptyString(map.game_state),
    role: 'unknown',
    targetItem: null,
    buildPlanId: null,
    context: {
      enemyCoreDead: false,
      alliesReady: 0,
      enemiesVisible: 0,
      recentDeathSec: null,
      safeRouteAvailable: false,
      roshanAvailable: false
    },
    roleContext: {
      safeMoveAvailable: null,
      teamReady: 0,
      dangerLevel: 0,
      visionNeed: 0,
      meta: {
        quality: 'UNAVAILABLE',
        signals: {}
      }
    },
    ...(matchId && matchId !== '0' ? { matchId } : {}),
    ...(nonEmptyString(provider.steamid) || nonEmptyString(player.steamid)
      ? { steamId: nonEmptyString(provider.steamid) ?? nonEmptyString(player.steamid) }
      : {}),
    ...(normalizeHero(hero.name) ? { hero: normalizeHero(hero.name) } : {}),
    ...(normalizeTeam(player.team_name) ? { team: normalizeTeam(player.team_name) } : {}),
    ...(positionX !== undefined && positionY !== undefined
      ? { position: { x: positionX, y: positionY } }
      : {}),
    ...(finiteNumber(hero.level) !== undefined ? { level: finiteNumber(hero.level) } : {}),
    ...(finiteNumber(player.gold) !== undefined ? { gold: finiteNumber(player.gold) } : {}),
    ...(finiteNumber(player.gold_reliable) !== undefined ? { reliableGold: finiteNumber(player.gold_reliable) } : {}),
    ...(finiteNumber(player.gold_unreliable) !== undefined ? { unreliableGold: finiteNumber(player.gold_unreliable) } : {}),
    ...(finiteNumber(player.gpm) !== undefined ? { gpm: finiteNumber(player.gpm) } : {}),
    ...(finiteNumber(player.xpm) !== undefined ? { xpm: finiteNumber(player.xpm) } : {}),
    ...(health !== undefined ? { health } : {}),
    ...(maxHealth !== undefined ? { maxHealth } : {}),
    ...(mana !== undefined ? { mana } : {}),
    ...(maxMana !== undefined ? { maxMana } : {}),
    ...(finiteNumber(player.kills) !== undefined ? { kills: finiteNumber(player.kills) } : {}),
    ...(finiteNumber(player.deaths) !== undefined ? { deaths: finiteNumber(player.deaths) } : {}),
    ...(finiteNumber(player.assists) !== undefined ? { assists: finiteNumber(player.assists) } : {}),
    ...(finiteNumber(player.last_hits) !== undefined ? { lastHits: finiteNumber(player.last_hits) } : {}),
    ...(finiteNumber(player.denies) !== undefined ? { denies: finiteNumber(player.denies) } : {}),
    ...(typeof hero.alive === 'boolean' ? { alive: hero.alive } : {}),
    ...(buybackCooldown !== undefined ? { buybackAvailable: buybackCooldown <= 0 } : {}),
    inventory: inventoryFromGsi(snapshot.items),
    abilities: abilitiesFromGsi(snapshot.abilities),
    statusEffects: statusEffectsFromGsi(hero),
    ...(finiteNumber(map.ward_purchase_cooldown) !== undefined
      ? { wardPurchaseCooldownSec: finiteNumber(map.ward_purchase_cooldown) }
      : {})
  };
}

function writeJson(response: ServerResponse, statusCode: number, body: Record<string, unknown>): void {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

export class DotaGsiAdapter {
  readonly #sink: GepSink;
  readonly #host: string;
  readonly #port: number;
  readonly #path: string;
  readonly #token: string;
  readonly #emitIntervalMs: number;
  #server: Server | null = null;
  #sourceSequence = 0;
  #connected = false;
  #latestSnapshot: DotaGsiSnapshot | null = null;
  #emitTimer: ReturnType<typeof setTimeout> | null = null;
  #lastSnapshotEmittedAt = 0;

  constructor(sink: GepSink, options: DotaGsiAdapterOptions = {}) {
    this.#sink = sink;
    this.#host = options.host ?? process.env.DOTA_FLOW_GSI_HOST ?? DEFAULT_GSI_HOST;
    this.#port = Number(options.port ?? process.env.DOTA_FLOW_GSI_PORT ?? DEFAULT_GSI_PORT);
    this.#path = options.path ?? process.env.DOTA_FLOW_GSI_PATH ?? DEFAULT_GSI_PATH;
    this.#token = options.token ?? process.env.DOTA_FLOW_GSI_TOKEN ?? DEFAULT_GSI_TOKEN;
    this.#emitIntervalMs = Math.max(
      50,
      Number(options.emitIntervalMs ?? process.env.DOTA_FLOW_GSI_EMIT_INTERVAL_MS ?? DEFAULT_GSI_EMIT_INTERVAL_MS)
    );
  }

  #emit(envelope: Omit<GepEnvelope, 'receivedAt' | 'sourceSequence'>): void {
    this.#sourceSequence += 1;
    this.#sink({
      ...envelope,
      receivedAt: Date.now(),
      sourceSequence: `gsi:${this.#sourceSequence}`
    });
  }

  #flushSnapshot(): void {
    const snapshot = this.#latestSnapshot;
    this.#latestSnapshot = null;
    this.#emitTimer = null;
    if (!snapshot) return;
    this.#lastSnapshotEmittedAt = Date.now();
    this.#emit({
      type: 'game-event',
      gameId: DEFAULT_DOTA_GAME_ID,
      payload: {
        name: 'gsi_snapshot',
        data: createSnapshotPayload(snapshot)
      }
    });
  }

  #queueSnapshot(snapshot: DotaGsiSnapshot): void {
    this.#latestSnapshot = snapshot;
    const elapsed = Date.now() - this.#lastSnapshotEmittedAt;
    if (this.#lastSnapshotEmittedAt === 0 || elapsed >= this.#emitIntervalMs) {
      this.#flushSnapshot();
      return;
    }
    if (this.#emitTimer) return;
    this.#emitTimer = setTimeout(
      () => this.#flushSnapshot(),
      Math.max(0, this.#emitIntervalMs - elapsed)
    );
  }

  async start(): Promise<void> {
    if (this.#server) return;
    this.#server = createServer(this.#onRequest);
    await new Promise<void>((resolve, reject) => {
      const server = this.#server;
      if (!server) return reject(new Error('GSI server was not created'));
      const onError = (error: Error) => {
        server.removeListener('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        server.removeListener('error', onError);
        resolve();
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(this.#port, this.#host);
    });
    console.log(`[Dota Flow GSI] Listening on http://${this.#host}:${this.#port}${this.#path}`);
    console.log(`[Dota Flow GSI] Renderer update limit: ${Math.round(1000 / this.#emitIntervalMs)} Hz.`);
    this.#emit({
      type: 'status',
      gameId: DEFAULT_DOTA_GAME_ID,
      payload: {
        mode: 'gsi',
        available: true,
        connection: 'waiting-for-game',
        code: 'GSI_LISTENING',
        message: 'Direct Dota GSI fallback is listening; restart Dota after the integration config is installed.'
      }
    });
  }

  async stop(): Promise<void> {
    if (this.#emitTimer) clearTimeout(this.#emitTimer);
    this.#emitTimer = null;
    this.#latestSnapshot = null;
    const server = this.#server;
    this.#server = null;
    if (!server) return;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  readonly #onRequest = (request: IncomingMessage, response: ServerResponse): void => {
    const url = new URL(request.url ?? '/', `http://${this.#host}:${this.#port}`);
    if (request.method !== 'POST' || url.pathname !== this.#path) {
      writeJson(response, 404, { ok: false, code: 'NOT_FOUND' });
      return;
    }

    const chunks: Buffer[] = [];
    let size = 0;
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        request.destroy(new Error('Dota GSI payload exceeded the size limit'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('error', (error) => {
      console.error('[Dota Flow GSI] Request failed', error);
      if (!response.headersSent) writeJson(response, 400, { ok: false, code: 'REQUEST_ERROR' });
    });
    request.on('end', () => {
      try {
        const snapshot = JSON.parse(Buffer.concat(chunks).toString('utf8')) as DotaGsiSnapshot;
        const token = nonEmptyString(snapshot.auth?.token);
        if (token !== this.#token) {
          writeJson(response, 401, { ok: false, code: 'INVALID_GSI_TOKEN' });
          return;
        }

        if (!this.#connected) {
          this.#connected = true;
          console.log('[Dota Flow GSI] First authenticated Dota snapshot received.');
          this.#emit({
            type: 'status',
            gameId: DEFAULT_DOTA_GAME_ID,
            payload: {
              mode: 'gsi',
              available: true,
              connection: 'connected',
              code: 'GSI_CONNECTED',
              message: 'Connected through direct Dota Game State Integration fallback.'
            }
          });
        }

        this.#queueSnapshot(snapshot);
        response.writeHead(204);
        response.end();
      } catch (error) {
        console.error('[Dota Flow GSI] Invalid payload', error);
        writeJson(response, 400, { ok: false, code: 'INVALID_JSON' });
      }
    });
  };
}
