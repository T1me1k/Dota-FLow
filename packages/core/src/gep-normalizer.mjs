import { applyGameEvent } from './event-reducer.mjs';
import { GAME_EVENT_TYPES } from './game-events.mjs';

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (/^\d{16,}$/.test(trimmed)) return trimmed;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function unwrap(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  if (raw.data !== undefined) return parseMaybeJson(raw.data);
  if (raw.value !== undefined && raw.key === undefined) return parseMaybeJson(raw.value);
  if (raw.key !== undefined && raw.category !== undefined) {
    return { [raw.key]: parseMaybeJson(raw.value ?? raw.key) };
  }
  return raw;
}

function canonical(type, payload, gameTimeSec) {
  return {
    type,
    payload: payload && typeof payload === 'object' ? payload : {},
    source: 'gep',
    ...(Number.isFinite(Number(gameTimeSec)) ? { gameTimeSec: Number(gameTimeSec) } : {})
  };
}

function phaseFromRaw({ gameState, matchState } = {}) {
  const game = String(gameState ?? '').toLowerCase();
  const match = String(matchState ?? '').toLowerCase();
  if (game === 'idle' || game.includes('post_game') || game.includes('game_over') || match.includes('post_game') || match.includes('game_over')) return 'ended';
  if (game === 'playing' || game.includes('game_in_progress') || match.includes('game_in_progress')) return 'playing';
  if (game === 'spectating') return 'spectating';
  return 'pregame';
}

function rawGameEventCandidates(rawEvent) {
  if (Array.isArray(rawEvent)) return rawEvent;
  if (Array.isArray(rawEvent?.events)) return rawEvent.events;
  return rawEvent === undefined || rawEvent === null ? [] : [rawEvent];
}

function mapSingleGameEvent(rawEvent) {
  const name = rawEvent?.name ?? rawEvent?.feature ?? rawEvent?.event ?? null;
  const unwrapped = unwrap(rawEvent);
  const data = unwrapped && typeof unwrapped === 'object' ? unwrapped : {};
  const eventTime = data.clock_time ?? data.game_time ?? rawEvent?.gameTimeSec;
  let event = null;

  switch (name) {
    case 'new_game':
      event = canonical(GAME_EVENT_TYPES.MATCH_STARTED, {
        matchId: data.match_id,
        team: data.player_team
      }, eventTime ?? 0);
      break;
    case 'game_over':
    case 'match_ended':
      event = canonical(GAME_EVENT_TYPES.MATCH_ENDED, { winner: data.winner }, eventTime);
      break;
    case 'daytime_changed':
    case 'clock_time_changed':
      event = canonical(GAME_EVENT_TYPES.CLOCK_UPDATED, { gameTimeSec: data.clock_time ?? data.time }, eventTime);
      break;
    case 'gold':
      event = canonical(GAME_EVENT_TYPES.GOLD_CHANGED, {
        gold: data.gold,
        reliableGold: data.gold_reliable,
        unreliableGold: data.gold_unreliable
      }, eventTime);
      break;
    case 'gpm':
      event = canonical(GAME_EVENT_TYPES.ECONOMY_UPDATED, { gpm: data.gpm }, eventTime);
      break;
    case 'xpm':
      event = canonical(GAME_EVENT_TYPES.ECONOMY_UPDATED, { xpm: data.xpm }, eventTime);
      break;
    case 'cs':
      event = canonical(GAME_EVENT_TYPES.COMBAT_STATS_UPDATED, {
        lastHits: data.last_hits,
        denies: data.denies
      }, eventTime);
      break;
    case 'ward_purchase_cooldown_changed':
      event = canonical(GAME_EVENT_TYPES.WARD_STATE_UPDATED, {
        wardPurchaseCooldownSec: data.ward_purchase_cooldown
      }, eventTime);
      break;
    case 'hero_status_effect_changed':
      event = canonical(GAME_EVENT_TYPES.STATUS_EFFECTS_UPDATED, data, eventTime);
      break;
    case 'hero_ability_skilled':
    case 'hero_ability_used':
    case 'hero_ability_cooldown_changed':
      event = canonical(GAME_EVENT_TYPES.ABILITY_STATE_CHANGED, {
        slot: data.slot,
        name: data.name,
        level: data.level,
        canCast: data.can_cast,
        passive: data.passive,
        cooldown: data.cooldown,
        ultimate: data.ultimate
      }, eventTime);
      break;
    case 'hero_leveled_up':
      event = canonical(GAME_EVENT_TYPES.HERO_LEVEL_CHANGED, { level: data.hero_level ?? data.level }, eventTime);
      break;
    case 'hero_item_changed': {
      const itemId = data.item_id ?? data.item ?? data.name;
      if (itemId) {
        const removed = data.removed === true
          || data.is_removed === true
          || data.state === 'removed'
          || data.name === ''
          || data.name === null;
        event = removed
          ? canonical(GAME_EVENT_TYPES.ITEM_REMOVED, { itemId }, eventTime)
          : canonical(GAME_EVENT_TYPES.ITEM_ADDED, {
            itemId,
            name: data.display_name ?? data.name,
            cost: data.cost,
            slot: data.slot,
            location: data.location
          }, eventTime);
      }
      break;
    }
    case 'kill':
      event = canonical(GAME_EVENT_TYPES.GAME_SNAPSHOT, { kills: data.kills }, eventTime);
      break;
    case 'assist':
      event = canonical(GAME_EVENT_TYPES.GAME_SNAPSHOT, { assists: data.assists }, eventTime);
      break;
    case 'death':
      event = canonical(GAME_EVENT_TYPES.HERO_DIED, { deaths: data.deaths }, eventTime);
      break;
    case 'hero_respawned':
      event = canonical(GAME_EVENT_TYPES.HERO_RESPAWNED, {}, eventTime);
      break;
    case 'hero_health_mana_info':
      event = canonical(GAME_EVENT_TYPES.HERO_VITALS_CHANGED, {
        health: data.health,
        maxHealth: data.max_health,
        mana: data.mana,
        maxMana: data.max_mana
      }, eventTime);
      break;
    case 'hero_buyback_info_changed':
      event = canonical(GAME_EVENT_TYPES.GAME_SNAPSHOT, {
        buybackAvailable: data.buyback_available ?? data.can_buyback
      }, eventTime);
      break;
    case 'ultimate_ready':
    case 'ultimate_state_changed':
      event = canonical(GAME_EVENT_TYPES.ULTIMATE_CHANGED, {
        ready: data.ready ?? data.ultimate_ready
      }, eventTime);
      break;
    case 'game_state_changed':
    case 'match_state_changed': {
      const phase = phaseFromRaw({
        gameState: data.game_state,
        matchState: data.match_state ?? data.state
      });
      if (phase === 'ended') {
        event = canonical(GAME_EVENT_TYPES.MATCH_ENDED, {
          matchId: data.match_id,
          winner: data.winner
        }, eventTime);
      } else {
        event = canonical(GAME_EVENT_TYPES.GAME_SNAPSHOT, {
          phase,
          matchId: data.match_id,
          team: data.player_team,
          steamId: data.player_steam_id
        }, eventTime);
      }
      break;
    }
    default:
      break;
  }

  return {
    raw: rawEvent,
    rawName: name,
    feature: name,
    canonicalEvent: event,
    status: event ? 'mapped' : 'ignored',
    reason: event ? null : `No canonical mapping for game event: ${String(name ?? 'missing name')}`
  };
}

function infoUpdateCandidates(rawUpdate) {
  if (Array.isArray(rawUpdate)) return rawUpdate;
  if (Array.isArray(rawUpdate?.updates)) return rawUpdate.updates;
  return rawUpdate === undefined || rawUpdate === null ? [] : [rawUpdate];
}

function normalizedInfoUpdate(rawUpdate) {
  const update = rawUpdate?.info ? rawUpdate : rawUpdate?.[0] ?? rawUpdate ?? {};
  const feature = update?.feature ?? update?.category ?? Object.keys(update?.info ?? {})[0] ?? null;
  const info = update?.info && typeof update.info === 'object' ? update.info : {};
  const key = typeof update?.key === 'string' ? update.key : null;
  const value = parseMaybeJson(update?.value);
  const category = update?.category ?? feature;

  if (feature && key) {
    const existing = info[feature] && typeof info[feature] === 'object' ? info[feature] : {};
    return {
      update,
      feature,
      category,
      key,
      value,
      info: {
        ...info,
        [feature]: { ...existing, [key]: value }
      }
    };
  }
  return { update, feature, category, key, value, info };
}

function mapSingleInfoUpdate(rawUpdate) {
  const normalized = normalizedInfoUpdate(rawUpdate);
  const { update, feature, info, key, value } = normalized;
  let event = null;

  if (feature === 'me' || info.me) {
    const me = info.me ?? {};
    event = canonical(GAME_EVENT_TYPES.PLAYER_IDENTIFIED, {
      team: me.team ?? (key === 'team' ? value : undefined),
      hero: me.hero ?? (key === 'hero' ? value : undefined),
      steamId: me.steam_id ?? (key === 'steam_id' ? value : undefined)
    });
  } else if (feature === 'match_info' || info.match_info) {
    const match = info.match_info ?? {};
    const matchId = match.pseudo_match_id
      ?? match.match_id
      ?? (key === 'pseudo_match_id' || key === 'match_id' ? value : undefined);
    if (matchId !== undefined && matchId !== null && matchId !== '') {
      event = canonical(GAME_EVENT_TYPES.MATCH_IDENTIFIED, { matchId });
    }
  } else if (feature === 'roster' || info.roster) {
    const roster = info.roster ?? {};
    const playersRaw = roster.players ?? (key === 'players' ? value : roster);
    const players = parseMaybeJson(playersRaw);
    if (Array.isArray(players)) {
      event = canonical(GAME_EVENT_TYPES.ROSTER_UPDATED, { players });
    }
  } else if (feature === 'damage' || info.damage) {
    const damage = info.damage ?? {};
    const hero = parseMaybeJson(damage.damage_dealt_hero ?? (key === 'damage_dealt_hero' ? value : null)) ?? {};
    const tower = parseMaybeJson(damage.damage_dealt_tower ?? (key === 'damage_dealt_tower' ? value : null)) ?? {};
    event = canonical(GAME_EVENT_TYPES.DAMAGE_UPDATED, {
      heroTotal: hero.total_damage,
      heroCurrent: hero.current_damage,
      towerTotal: tower.total_damage,
      towerCurrent: tower.current_damage
    });
  } else if (normalized.category === 'team_score' || key === 'team_score') {
    const score = parseMaybeJson(value ?? key) ?? {};
    event = canonical(GAME_EVENT_TYPES.TEAM_SCORE_UPDATED, {
      radiant: score.radiant,
      dire: score.dire
    });
  } else if (feature === 'game' || feature === 'match_state_changed' || info.game || info.match_state_changed) {
    const game = info.game ?? info.match_state_changed ?? {};
    const gameState = game.game_state ?? (key === 'game_state' ? value : undefined);
    const matchState = game.match_state ?? (key === 'match_state' ? value : undefined);
    const phase = phaseFromRaw({ gameState, matchState });
    event = phase === 'ended'
      ? canonical(GAME_EVENT_TYPES.MATCH_ENDED, {}, game.clock_time)
      : canonical(GAME_EVENT_TYPES.GAME_SNAPSHOT, { phase }, game.clock_time);
  }

  return {
    raw: update,
    rawName: feature,
    feature,
    canonicalEvent: event,
    status: event ? 'mapped' : 'ignored',
    reason: event ? null : `No canonical mapping for info update: ${String(feature ?? 'missing feature')}`
  };
}

export function inspectRawGameEvents(rawEvent) {
  return rawGameEventCandidates(rawEvent).map(mapSingleGameEvent);
}

export function inspectInfoUpdates(rawUpdate) {
  return infoUpdateCandidates(rawUpdate).map(mapSingleInfoUpdate);
}

export function toCanonicalGameEvents(rawEvent) {
  return inspectRawGameEvents(rawEvent).flatMap((record) => record.canonicalEvent ? [record.canonicalEvent] : []);
}

export function toCanonicalGameEvent(rawEvent) {
  return toCanonicalGameEvents(rawEvent)[0] ?? null;
}

export function toCanonicalInfoEvents(rawUpdate) {
  return inspectInfoUpdates(rawUpdate).flatMap((record) => record.canonicalEvent ? [record.canonicalEvent] : []);
}

export function reduceGameEvent(state, rawEvent) {
  return toCanonicalGameEvents(rawEvent).reduce((current, event) => applyGameEvent(current, event), state);
}

export function reduceInfoUpdate(state, rawUpdate) {
  return toCanonicalInfoEvents(rawUpdate).reduce((current, event) => applyGameEvent(current, event), state);
}
