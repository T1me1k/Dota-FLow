import { applyPatch, createInitialGameState } from './game-state.mjs';
import { defaultTargetItem } from './hero-profiles.mjs';
import { GAME_EVENT_TYPES, isGameEvent, normalizeItemId } from './game-events.mjs';
import { normalizeGameState } from './game-state-normalizer.mjs';
import { updateRoleContextMetaFromEvent } from './role-context-adapter.mjs';
import { clearCoachTimer, upsertCoachTimer } from './coach-timers.mjs';

function payloadOf(event) {
  return event?.payload && typeof event.payload === 'object' ? event.payload : {};
}

function withEventTime(state, event) {
  const requestedTime = Number(event?.gameTimeSec);
  if (!Number.isFinite(requestedTime)) return { state, warnings: [] };
  const stale = event.type !== GAME_EVENT_TYPES.MATCH_STARTED
    && state.phase === 'playing'
    && requestedTime < state.gameTimeSec;
  return {
    state: applyPatch(state, { gameTimeSec: stale ? state.gameTimeSec : requestedTime }),
    warnings: stale ? [`Out-of-order event time clamped: ${requestedTime} < ${state.gameTimeSec}`] : []
  };
}


function normalizeRoleValue(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const aliases = {
      pos1: 'carry', position_1: 'carry', safe_lane: 'carry', safelane: 'carry',
      pos2: 'mid', position_2: 'mid', middle: 'mid',
      pos3: 'offlane', position_3: 'offlane', off_lane: 'offlane',
      pos4: 'soft_support', position_4: 'soft_support', support: 'soft_support',
      pos5: 'hard_support', position_5: 'hard_support', hard_support: 'hard_support'
    };
    if (['carry', 'mid', 'offlane', 'soft_support', 'hard_support'].includes(normalized)) return normalized;
    if (aliases[normalized]) return aliases[normalized];
  }
  const numeric = Number(value);
  if (numeric === 1) return 'carry';
  if (numeric === 2) return 'mid';
  if (numeric === 4) return 'offlane';
  if (numeric === 8) return 'soft_support';
  if (numeric === 16) return 'hard_support';
  return null;
}

function inferLocalPlayer(players, state) {
  if (!Array.isArray(players)) return null;
  const steamId = state.steamId === null || state.steamId === undefined ? null : String(state.steamId);
  if (steamId) {
    const bySteam = players.find((player) => String(player.steamId ?? player.steam_id ?? '') === steamId);
    if (bySteam) return bySteam;
  }
  const explicit = players.find((player) => player.isLocalPlayer === true || player.local === true);
  if (explicit) return explicit;
  const teamNumber = state.team === 'radiant' ? 2 : state.team === 'dire' ? 3 : null;
  const byHero = players.filter((player) => {
    const sameHero = String(player.hero ?? '').replace(/^npc_dota_hero_/, '') === String(state.hero ?? '').replace(/^npc_dota_hero_/, '');
    const playerTeam = Number(player.team ?? player.teamId);
    return sameHero && (teamNumber === null || playerTeam === teamNumber || player.team === state.team);
  });
  return byHero.length === 1 ? byHero[0] : null;
}

function applySnapshot(state, payload) {
  const allowed = [
    'source', 'matchId', 'steamId', 'phase', 'gameTimeSec', 'hero', 'role', 'team', 'buildPlanId', 'level',
    'gold', 'reliableGold', 'unreliableGold', 'gpm', 'xpm', 'health', 'maxHealth',
    'mana', 'maxMana', 'kills', 'deaths', 'assists', 'lastHits', 'denies', 'alive', 'ultimateReady',
    'buybackAvailable', 'inventory', 'roster', 'abilities', 'statusEffects', 'wardPurchaseCooldownSec',
    'damage', 'teamScore', 'targetItem', 'draft', 'progression', 'context', 'roleContext'
  ];
  const patch = Object.fromEntries(allowed.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]));
  return applyPatch(state, patch);
}

export function applyGameEvent(state, event) {
  const previous = state ?? createInitialGameState();
  if (!isGameEvent(event)) {
    return normalizeGameState(previous, applyPatch(previous, {
      diagnostics: {
        ignoredEventCount: (previous.diagnostics?.ignoredEventCount ?? 0) + 1
      }
    }), {
      eventType: event?.type ?? 'UNKNOWN_EVENT',
      warnings: [`Unknown or malformed event ignored: ${String(event?.type ?? 'missing type')}`]
    });
  }

  const payload = payloadOf(event);
  const timed = withEventTime(previous, event);
  let working = timed.state;

  switch (event.type) {
    case GAME_EVENT_TYPES.MATCH_STARTED: {
      const hero = payload.hero ?? previous.hero;
      const buildPlanId = payload.buildPlanId ?? previous.buildPlanId;
      const inventory = Array.isArray(payload.inventory) ? payload.inventory : [];
      working = createInitialGameState({
        source: payload.source ?? previous.source,
        matchId: payload.matchId ?? null,
        steamId: payload.steamId ?? previous.steamId,
        phase: 'playing',
        gameTimeSec: Number.isFinite(Number(event.gameTimeSec ?? payload.gameTimeSec))
          ? Number(event.gameTimeSec ?? payload.gameTimeSec)
          : 0,
        hero,
        role: payload.role ?? previous.role,
        team: payload.team ?? previous.team,
        buildPlanId,
        inventory,
        targetItem: payload.targetItem ?? defaultTargetItem(hero, inventory, buildPlanId),
        draft: payload.draft ?? previous.draft,
        context: payload.context ?? undefined,
        roleContext: payload.roleContext ?? (previous.roleContext?.meta ? { meta: previous.roleContext.meta } : undefined),
        coachContext: {
          scouting: previous.coachContext?.scouting,
          settings: previous.coachContext?.settings,
          timers: []
        }
      });
      break;
    }
    case GAME_EVENT_TYPES.MATCH_ENDED:
      working = applyPatch(working, { phase: 'ended' });
      break;
    case GAME_EVENT_TYPES.GAME_SNAPSHOT:
      working = applySnapshot(working, payload);
      break;
    case GAME_EVENT_TYPES.CLOCK_UPDATED:
      working = applyPatch(working, { gameTimeSec: payload.gameTimeSec ?? payload.time ?? working.gameTimeSec });
      break;
    case GAME_EVENT_TYPES.HERO_LEVEL_CHANGED: {
      const level = payload.level;
      const time = working.gameTimeSec;
      working = applyPatch(working, {
        ...(level !== undefined ? { level } : {}),
        ...(payload.ultimateReady !== undefined ? { ultimateReady: payload.ultimateReady } : {}),
        ...(level !== undefined ? { progression: { levelReachedAt: { [level]: time } } } : {})
      });
      break;
    }
    case GAME_EVENT_TYPES.ITEM_ADDED: {
      const id = normalizeItemId(payload.itemId ?? payload.id);
      if (!id) break;
      const item = {
        id,
        name: payload.name ?? payload.displayName ?? id,
        ...(Number.isFinite(Number(payload.cost)) ? { cost: Number(payload.cost) } : {})
      };
      const inventory = [...working.inventory.filter((entry) => entry.id !== id), item];
      working = applyPatch(working, {
        inventory,
        ...(payload.goldAfter !== undefined ? { gold: payload.goldAfter } : {}),
        ...(payload.reliableGoldAfter !== undefined ? { reliableGold: payload.reliableGoldAfter } : {}),
        ...(payload.unreliableGoldAfter !== undefined ? { unreliableGold: payload.unreliableGoldAfter } : {}),
        progression: { itemAcquiredAt: { [id]: working.gameTimeSec } }
      });
      break;
    }
    case GAME_EVENT_TYPES.ITEM_REMOVED: {
      const id = normalizeItemId(payload.itemId ?? payload.id);
      if (id) working = applyPatch(working, { inventory: working.inventory.filter((item) => item.id !== id) });
      break;
    }
    case GAME_EVENT_TYPES.GOLD_CHANGED:
      working = applyPatch(working, {
        ...(payload.gold !== undefined ? { gold: payload.gold } : {}),
        ...(payload.reliableGold !== undefined ? { reliableGold: payload.reliableGold } : {}),
        ...(payload.unreliableGold !== undefined ? { unreliableGold: payload.unreliableGold } : {})
      });
      break;
    case GAME_EVENT_TYPES.ECONOMY_UPDATED:
      working = applyPatch(working, {
        ...(payload.gpm !== undefined ? { gpm: payload.gpm } : {}),
        ...(payload.xpm !== undefined ? { xpm: payload.xpm } : {})
      });
      break;
    case GAME_EVENT_TYPES.HERO_VITALS_CHANGED:
      working = applyPatch(working, {
        ...(payload.health !== undefined ? { health: payload.health } : {}),
        ...(payload.maxHealth !== undefined ? { maxHealth: payload.maxHealth } : {}),
        ...(payload.mana !== undefined ? { mana: payload.mana } : {}),
        ...(payload.maxMana !== undefined ? { maxMana: payload.maxMana } : {})
      });
      break;
    case GAME_EVENT_TYPES.HERO_DIED:
      working = applyPatch(working, {
        alive: false,
        deaths: payload.deaths ?? working.deaths + 1,
        context: { recentDeathSec: working.gameTimeSec }
      });
      break;
    case GAME_EVENT_TYPES.HERO_RESPAWNED:
      working = applyPatch(working, { alive: true });
      break;
    case GAME_EVENT_TYPES.ULTIMATE_CHANGED:
      working = applyPatch(working, { ultimateReady: payload.ready });
      break;
    case GAME_EVENT_TYPES.CONTEXT_UPDATED:
      working = applyPatch(working, { context: payload });
      break;
    case GAME_EVENT_TYPES.ROLE_CONTEXT_UPDATED:
      working = applyPatch(working, { roleContext: payload });
      break;
    case GAME_EVENT_TYPES.ROLE_CONTEXT_CAPABILITIES_UPDATED:
      break;
    case GAME_EVENT_TYPES.ROSTER_UPDATED: {
      const players = Array.isArray(payload.players) ? payload.players : [];
      const localPlayer = inferLocalPlayer(players, working);
      const localRole = normalizeRoleValue(payload.localRole ?? payload.role ?? localPlayer?.role);
      working = applyPatch(working, {
        roster: players,
        draft: {
          radiant: players.filter((player) => Number(player.team ?? player.teamId) === 2 || player.team === 'radiant').map((player) => player.hero ?? player.heroId),
          dire: players.filter((player) => Number(player.team ?? player.teamId) === 3 || player.team === 'dire').map((player) => player.hero ?? player.heroId)
        },
        ...(localRole ? { role: localRole } : {})
      });
      break;
    }
    case GAME_EVENT_TYPES.ABILITY_STATE_CHANGED: {
      const slot = String(payload.slot ?? payload.name ?? Object.keys(working.abilities).length);
      const ability = { ...working.abilities[slot], ...payload };
      working = applyPatch(working, {
        abilities: { ...working.abilities, [slot]: ability },
        ...(payload.ultimate === true ? { ultimateReady: Boolean(payload.canCast ?? payload.can_cast ?? Number(payload.cooldown) <= 0) } : {})
      });
      break;
    }
    case GAME_EVENT_TYPES.COMBAT_STATS_UPDATED:
      working = applyPatch(working, {
        ...(payload.lastHits !== undefined ? { lastHits: payload.lastHits } : {}),
        ...(payload.denies !== undefined ? { denies: payload.denies } : {})
      });
      break;
    case GAME_EVENT_TYPES.STATUS_EFFECTS_UPDATED:
      working = applyPatch(working, { statusEffects: { ...working.statusEffects, ...payload } });
      break;
    case GAME_EVENT_TYPES.WARD_STATE_UPDATED:
      working = applyPatch(working, { wardPurchaseCooldownSec: payload.wardPurchaseCooldownSec ?? payload.cooldown ?? null });
      break;
    case GAME_EVENT_TYPES.DAMAGE_UPDATED:
      working = applyPatch(working, { damage: { ...working.damage, ...payload } });
      break;
    case GAME_EVENT_TYPES.TEAM_SCORE_UPDATED:
      working = applyPatch(working, { teamScore: { ...working.teamScore, ...payload } });
      break;
    case GAME_EVENT_TYPES.DRAFT_UPDATED:
      working = applyPatch(working, { draft: payload });
      break;
    case GAME_EVENT_TYPES.PLAYER_IDENTIFIED:
      working = applyPatch(working, {
        ...(payload.hero !== undefined ? { hero: payload.hero } : {}),
        ...(payload.role !== undefined ? { role: payload.role } : {}),
        ...(payload.team !== undefined ? { team: payload.team } : {}),
        ...(payload.steamId !== undefined ? { steamId: payload.steamId } : {}),
        ...(normalizeRoleValue(payload.role) ? { role: normalizeRoleValue(payload.role) } : {})
      });
      break;
    case GAME_EVENT_TYPES.MATCH_IDENTIFIED:
      working = applyPatch(working, { matchId: payload.matchId ?? working.matchId });
      break;
    case GAME_EVENT_TYPES.COACH_TIMER_STARTED: {
      const startedAtSec = Number.isFinite(Number(payload.startedAtSec))
        ? Number(payload.startedAtSec)
        : working.gameTimeSec;
      working = applyPatch(working, {
        coachContext: {
          timers: upsertCoachTimer(working.coachContext?.timers ?? [], { ...payload, startedAtSec })
        }
      });
      break;
    }
    case GAME_EVENT_TYPES.COACH_TIMER_CLEARED:
      working = applyPatch(working, {
        coachContext: { timers: clearCoachTimer(working.coachContext?.timers ?? [], payload.id ?? payload.timerId) }
      });
      break;
    case GAME_EVENT_TYPES.SCOUTING_UPDATED:
      working = applyPatch(working, { coachContext: { scouting: payload } });
      break;
    case GAME_EVENT_TYPES.COACH_SETTINGS_UPDATED:
      working = applyPatch(working, { coachContext: { settings: payload } });
      break;
    default:
      break;
  }

  working = applyPatch(working, { roleContext: updateRoleContextMetaFromEvent(working, event) });
  return normalizeGameState(previous, working, { eventType: event.type, warnings: timed.warnings });
}
