const DEFAULT_GRACE_SEC = 0.75;
const DEFAULT_STALE_AFTER_MS = 2_000;
const MAX_ENEMIES = 5;

const STATUS = Object.freeze({
  VISIBLE: 'VISIBLE',
  MISSING: 'MISSING',
  DEAD: 'DEAD',
  DISCONNECTED: 'DISCONNECTED',
  UNKNOWN: 'UNKNOWN'
});

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeHero(value) {
  return String(value ?? '').replace(/^npc_dota_hero_/, '').trim().toLowerCase();
}

function teamOf(value) {
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'radiant' || raw === '2') return 'radiant';
  if (raw === 'dire' || raw === '3') return 'dire';
  return raw || null;
}

function enemyTeam(localTeam) {
  return localTeam === 'radiant' ? 'dire' : localTeam === 'dire' ? 'radiant' : null;
}

function identityOf(value, fallbackIndex = 0) {
  const steamId = value?.steamId ?? value?.steam_id;
  if (steamId !== undefined && steamId !== null && String(steamId)) return `steam:${String(steamId)}`;
  const playerId = value?.playerId ?? value?.player_id ?? value?.accountId ?? value?.account_id;
  if (playerId !== undefined && playerId !== null && String(playerId)) return `player:${String(playerId)}`;
  const slot = value?.slot ?? value?.playerSlot ?? value?.player_slot;
  if (slot !== undefined && slot !== null && String(slot)) return `slot:${String(slot)}`;
  const hero = normalizeHero(value?.hero ?? value?.heroId ?? value?.hero_name ?? value?.name);
  const team = teamOf(value?.team ?? value?.teamId ?? value?.team_id) ?? 'enemy';
  return hero ? `${team}:${hero}` : `enemy:${fallbackIndex}`;
}

function connectedOf(value) {
  if (value?.connected === false || value?.disconnected === true) return false;
  const status = String(value?.connection ?? value?.connectionStatus ?? '').toUpperCase();
  if (status === 'DISCONNECTED' || status === 'ABANDONED') return false;
  return true;
}

function aliveOf(value) {
  if (value?.alive === false || value?.dead === true) return false;
  const status = String(value?.status ?? '').toUpperCase();
  if (status === 'DEAD') return false;
  return true;
}

function observationsOf(state) {
  const roleContext = state?.roleContext ?? {};
  const raw = roleContext.enemyVisibilityObservations ?? roleContext.visibilityObservations ?? [];
  return Array.isArray(raw) ? raw.filter((entry) => entry && typeof entry === 'object') : [];
}

function sourceOf(state, observations, nowMs, staleAfterMs) {
  const roleContext = state?.roleContext ?? {};
  const raw = roleContext.enemyVisibilitySource ?? roleContext.visibilitySource ?? {};
  const observedAtMs = finite(raw.observedAtMs ?? raw.updatedAtMs, Math.max(0, ...observations.map((entry) => finite(entry.observedAtMs ?? entry.updatedAtMs, 0))));
  const requested = String(raw.status ?? '').toUpperCase();
  if (requested === 'DISABLED') return { status: 'DISABLED', observedAtMs, source: String(raw.source ?? 'NONE') };
  if (!observations.length && !observedAtMs) return { status: 'UNAVAILABLE', observedAtMs: null, source: String(raw.source ?? 'NONE') };
  if (observedAtMs && nowMs - observedAtMs > staleAfterMs) return { status: 'STALE', observedAtMs, source: String(raw.source ?? 'UNKNOWN') };
  if (requested === 'STALE' || requested === 'UNAVAILABLE' || requested === 'ERROR') return { status: requested, observedAtMs, source: String(raw.source ?? 'UNKNOWN') };
  return { status: 'LIVE', observedAtMs, source: String(raw.source ?? observations[0]?.source ?? 'VISIBILITY_SIGNAL') };
}

function rosterEnemies(state, observations) {
  const localTeam = teamOf(state?.team);
  const expectedEnemyTeam = enemyTeam(localTeam);
  const roster = Array.isArray(state?.roster) ? state.roster : [];
  const candidates = roster.filter((player) => {
    const team = teamOf(player?.team ?? player?.teamId ?? player?.team_id);
    if (expectedEnemyTeam) return team === expectedEnemyTeam;
    return player?.enemy === true || player?.isEnemy === true;
  });
  const merged = new Map();
  candidates.forEach((player, index) => merged.set(identityOf(player, index), { ...player }));
  observations.forEach((entry, index) => {
    const team = teamOf(entry?.team ?? entry?.teamId ?? entry?.team_id);
    const isEnemy = expectedEnemyTeam ? team === expectedEnemyTeam || entry?.enemy === true || entry?.isEnemy === true : entry?.enemy !== false;
    if (!isEnemy) return;
    const id = identityOf(entry, index);
    merged.set(id, { ...(merged.get(id) ?? {}), ...entry });
  });
  return [...merged.entries()].slice(0, MAX_ENEMIES).map(([id, value]) => ({ id, ...value }));
}

function observationMap(observations) {
  const result = new Map();
  observations.forEach((entry, index) => result.set(identityOf(entry, index), entry));
  return result;
}

function cleanRecord(record, player) {
  return {
    id: record.id,
    hero: normalizeHero(player?.hero ?? player?.heroId ?? player?.hero_name ?? player?.name ?? record.hero),
    team: teamOf(player?.team ?? player?.teamId ?? player?.team_id ?? record.team),
    steamId: player?.steamId ?? player?.steam_id ?? record.steamId ?? null,
    status: record.status,
    elapsedSec: record.status === STATUS.MISSING && record.missingSinceGameTimeSec !== null
      ? Math.max(0, Math.floor(record.currentGameTimeSec - record.missingSinceGameTimeSec))
      : null,
    timerVisible: record.status === STATUS.MISSING,
    lastVisibleGameTimeSec: record.lastVisibleGameTimeSec,
    missingSinceGameTimeSec: record.missingSinceGameTimeSec,
    lastObservedAtMs: record.lastObservedAtMs,
    confidence: record.confidence,
    source: record.source,
    pending: record.pendingMissingSinceGameTimeSec !== null
  };
}

export class EnemyLastSeenTracker {
  constructor({ graceSec = DEFAULT_GRACE_SEC, staleAfterMs = DEFAULT_STALE_AFTER_MS } = {}) {
    this.graceSec = Math.max(0, finite(graceSec, DEFAULT_GRACE_SEC));
    this.staleAfterMs = Math.max(250, finite(staleAfterMs, DEFAULT_STALE_AFTER_MS));
    this.matchId = null;
    this.records = new Map();
  }

  reset(matchId = null) {
    this.matchId = matchId == null ? null : String(matchId);
    this.records.clear();
  }

  update(state, nowMs = Date.now()) {
    const matchId = state?.matchId == null ? null : String(state.matchId);
    if (matchId !== this.matchId) this.reset(matchId);
    const gameTimeSec = Math.max(0, finite(state?.gameTimeSec, 0));
    const observations = observationsOf(state);
    const source = sourceOf(state, observations, nowMs, this.staleAfterMs);
    const players = rosterEnemies(state, observations);
    const byId = observationMap(observations);
    const activeIds = new Set(players.map((player) => player.id));

    for (const id of [...this.records.keys()]) {
      if (!activeIds.has(id)) this.records.delete(id);
    }

    const rows = players.map((player) => {
      const previous = this.records.get(player.id) ?? {
        id: player.id,
        hero: normalizeHero(player?.hero ?? player?.heroId ?? player?.hero_name ?? player?.name),
        team: teamOf(player?.team ?? player?.teamId ?? player?.team_id),
        steamId: player?.steamId ?? player?.steam_id ?? null,
        status: STATUS.UNKNOWN,
        lastVisibleGameTimeSec: null,
        missingSinceGameTimeSec: null,
        pendingMissingSinceGameTimeSec: null,
        lastObservedAtMs: null,
        confidence: 0,
        source: source.source,
        currentGameTimeSec: gameTimeSec
      };
      const observation = byId.get(player.id);
      const next = { ...previous, currentGameTimeSec: gameTimeSec, source: source.source };

      if (!connectedOf({ ...player, ...observation })) {
        next.status = STATUS.DISCONNECTED;
        next.missingSinceGameTimeSec = null;
        next.pendingMissingSinceGameTimeSec = null;
      } else if (!aliveOf({ ...player, ...observation })) {
        next.status = STATUS.DEAD;
        next.missingSinceGameTimeSec = null;
        next.pendingMissingSinceGameTimeSec = null;
      } else if (source.status !== 'LIVE') {
        next.status = STATUS.UNKNOWN;
        next.missingSinceGameTimeSec = null;
        next.pendingMissingSinceGameTimeSec = null;
      } else if (!observation || typeof observation.visible !== 'boolean') {
        next.status = STATUS.UNKNOWN;
        next.missingSinceGameTimeSec = null;
        next.pendingMissingSinceGameTimeSec = null;
      } else {
        const observedGameTimeSec = Math.max(0, finite(observation.gameTimeSec ?? observation.observedGameTimeSec, gameTimeSec));
        next.lastObservedAtMs = finite(observation.observedAtMs ?? observation.updatedAtMs, nowMs);
        next.confidence = Math.min(1, Math.max(0, finite(observation.confidence, 1)));
        if (observation.visible === true) {
          next.status = STATUS.VISIBLE;
          next.lastVisibleGameTimeSec = observedGameTimeSec;
          next.missingSinceGameTimeSec = null;
          next.pendingMissingSinceGameTimeSec = null;
        } else if (next.status === STATUS.MISSING && next.missingSinceGameTimeSec !== null) {
          next.status = STATUS.MISSING;
        } else if (next.lastVisibleGameTimeSec === null) {
          next.status = STATUS.UNKNOWN;
          next.missingSinceGameTimeSec = null;
          next.pendingMissingSinceGameTimeSec = null;
        } else {
          next.pendingMissingSinceGameTimeSec ??= observedGameTimeSec;
          if (gameTimeSec - next.pendingMissingSinceGameTimeSec >= this.graceSec) {
            next.status = STATUS.MISSING;
            next.missingSinceGameTimeSec = next.pendingMissingSinceGameTimeSec;
          } else {
            next.status = STATUS.UNKNOWN;
            next.missingSinceGameTimeSec = null;
          }
        }
      }

      this.records.set(player.id, next);
      return cleanRecord(next, player);
    });

    const missingCount = rows.filter((row) => row.status === STATUS.MISSING).length;
    const visibleCount = rows.filter((row) => row.status === STATUS.VISIBLE).length;
    return {
      status: source.status === 'LIVE' ? 'READY' : 'UNAVAILABLE',
      sourceStatus: source.status,
      source: source.source,
      rows,
      missingCount,
      visibleCount,
      confidence: rows.length ? Math.min(...rows.map((row) => row.confidence || 0)) : 0,
      dataQuality: source.status === 'LIVE' ? 'LIVE' : source.status === 'STALE' ? 'STALE' : 'UNAVAILABLE',
      reasons: source.status === 'LIVE' ? ['Only confirmed visible pixels or approved visibility observations are tracked'] : [],
      missingSignals: source.status === 'LIVE' ? [] : ['enemy_visibility_signal'],
      limitations: ['No hidden location is inferred', 'Visible enemies never show a missing timer']
    };
  }
}

export function createEnemyLastSeenTracker(options) {
  return new EnemyLastSeenTracker(options);
}

export { STATUS as ENEMY_VISIBILITY_STATUS };
