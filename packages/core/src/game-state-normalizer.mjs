import { ITEMS } from './hero-profiles.mjs';
import { resolveHeroId } from './hero-catalog.mjs';

const VALID_PHASES = new Set(['idle', 'pregame', 'playing', 'ended']);
const VALID_TEAMS = new Set(['radiant', 'dire']);
const VALID_ROLES = new Set(['carry', 'mid', 'offlane', 'soft_support', 'hard_support', 'unknown']);
const KNOWN_ITEMS = new Set(Object.values(ITEMS).map((item) => item.id));
const RESET_EVENTS = new Set(['MATCH_STARTED']);

function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function nonNegative(value, fallback = 0) {
  return Math.max(0, finite(value, fallback));
}

function normalizeInventory(inventory, warnings) {
  if (!Array.isArray(inventory)) return [];
  const seen = new Set();
  const normalized = [];

  for (const rawItem of inventory) {
    const rawId = typeof rawItem === 'string' ? rawItem : rawItem?.id;
    if (typeof rawId !== 'string' || !rawId.trim()) {
      warnings.push('Inventory item without an id was ignored');
      continue;
    }
    const id = rawId.toLowerCase().startsWith('item_')
      ? rawId.toLowerCase()
      : `item_${rawId.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    if (!KNOWN_ITEMS.has(id)) warnings.push(`Unknown item id kept safely: ${id}`);
    normalized.push({
      ...(typeof rawItem === 'object' && rawItem ? rawItem : {}),
      id,
      name: typeof rawItem?.name === 'string' && rawItem.name ? rawItem.name : id,
      ...(Number.isFinite(Number(rawItem?.cost)) ? { cost: nonNegative(rawItem.cost) } : {})
    });
  }

  return normalized;
}

function normalizeDraftSide(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((hero) => typeof hero === 'string' && hero.trim())
    .map((hero) => resolveHeroId(hero) ?? hero.trim().toLowerCase().replace(/^npc_dota_hero_/, ''));
}


function normalizeProgressionMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, time]) => [key, Number(time)])
      .filter(([, time]) => Number.isFinite(time))
  );
}

function normalizeTargetItem(target, warnings) {
  if (target === null) return null;
  if (!target || typeof target !== 'object' || typeof target.id !== 'string') return null;
  const id = target.id.toLowerCase().startsWith('item_') ? target.id.toLowerCase() : `item_${target.id.toLowerCase()}`;
  if (!KNOWN_ITEMS.has(id)) warnings.push(`Unknown target item id kept safely: ${id}`);
  const totalCost = nonNegative(target.totalCost, 0);
  return {
    ...target,
    id,
    name: typeof target.name === 'string' && target.name ? target.name : id,
    totalCost,
    ownedValue: clamp(nonNegative(target.ownedValue, 0), 0, totalCost)
  };
}

export function normalizeGameState(previous, candidate, { eventType = 'UNKNOWN_EVENT', warnings: incomingWarnings = [] } = {}) {
  const reset = RESET_EVENTS.has(eventType);
  const warnings = [...incomingWarnings];
  const prior = previous ?? candidate;
  const next = { ...candidate };

  if (!VALID_PHASES.has(next.phase)) {
    warnings.push(`Invalid phase ignored: ${String(next.phase)}`);
    next.phase = prior.phase;
  }
  if (!VALID_TEAMS.has(next.team)) next.team = prior.team;
  if (!VALID_ROLES.has(next.role)) {
    if (next.role !== undefined) warnings.push(`Invalid player role ignored: ${String(next.role)}`);
    next.role = VALID_ROLES.has(prior.role) ? prior.role : 'unknown';
  }

  const requestedHero = String(next.hero ?? '');
  const resolvedHero = resolveHeroId(requestedHero);
  const priorHero = resolveHeroId(prior.hero) ?? 'luna';
  if (resolvedHero) next.hero = resolvedHero;
  else {
    if (requestedHero) warnings.push(`Unknown hero id ignored: ${requestedHero.toLowerCase()}`);
    next.hero = priorHero;
  }

  const previousTime = finite(prior.gameTimeSec, -90);
  let gameTimeSec = finite(next.gameTimeSec, previousTime);
  gameTimeSec = Math.max(-120, gameTimeSec);
  if (next.phase === 'playing') gameTimeSec = Math.max(0, gameTimeSec);
  if (!reset && prior.phase === 'playing' && next.phase === 'playing' && gameTimeSec < previousTime) {
    warnings.push(`Out-of-order game time ignored: ${gameTimeSec} < ${previousTime}`);
    gameTimeSec = previousTime;
  }
  next.gameTimeSec = gameTimeSec;

  const previousLevel = clamp(Math.round(finite(prior.level, 1)), 1, 30);
  let level = clamp(Math.round(finite(next.level, previousLevel)), 1, 30);
  if (!reset && level < previousLevel) {
    warnings.push(`Backward level change ignored: ${level} < ${previousLevel}`);
    level = previousLevel;
  }
  next.level = level;

  for (const key of ['gold', 'reliableGold', 'unreliableGold', 'gpm', 'xpm', 'kills', 'deaths', 'assists', 'lastHits', 'denies']) {
    next[key] = nonNegative(next[key], prior[key]);
  }
  for (const key of ['kills', 'deaths', 'assists', 'lastHits', 'denies']) {
    if (!reset && next[key] < prior[key]) next[key] = prior[key];
    next[key] = Math.round(next[key]);
  }

  next.maxHealth = Math.max(1, finite(next.maxHealth, prior.maxHealth));
  next.maxMana = Math.max(1, finite(next.maxMana, prior.maxMana));
  next.health = clamp(finite(next.health, prior.health), 0, next.maxHealth);
  next.mana = clamp(finite(next.mana, prior.mana), 0, next.maxMana);
  next.alive = Boolean(next.alive);
  next.ultimateReady = Boolean(next.ultimateReady);
  next.buybackAvailable = Boolean(next.buybackAvailable);

  next.steamId = next.steamId === null || next.steamId === undefined ? (prior.steamId ?? null) : String(next.steamId);
  next.roster = Array.isArray(next.roster) ? next.roster.filter((player) => player && typeof player === 'object').map((player) => ({ ...player })) : [];
  next.abilities = next.abilities && typeof next.abilities === 'object' && !Array.isArray(next.abilities) ? { ...next.abilities } : {};
  next.statusEffects = next.statusEffects && typeof next.statusEffects === 'object' && !Array.isArray(next.statusEffects) ? { ...next.statusEffects } : {};
  next.wardPurchaseCooldownSec = next.wardPurchaseCooldownSec === null || next.wardPurchaseCooldownSec === undefined
    ? null
    : nonNegative(next.wardPurchaseCooldownSec);
  next.damage = {
    heroTotal: nonNegative(next.damage?.heroTotal, prior.damage?.heroTotal),
    heroCurrent: nonNegative(next.damage?.heroCurrent, prior.damage?.heroCurrent),
    towerTotal: nonNegative(next.damage?.towerTotal, prior.damage?.towerTotal),
    towerCurrent: nonNegative(next.damage?.towerCurrent, prior.damage?.towerCurrent)
  };
  next.teamScore = {
    radiant: Math.round(nonNegative(next.teamScore?.radiant, prior.teamScore?.radiant)),
    dire: Math.round(nonNegative(next.teamScore?.dire, prior.teamScore?.dire))
  };

  next.inventory = normalizeInventory(next.inventory, warnings);
  next.targetItem = normalizeTargetItem(next.targetItem, warnings);
  next.draft = {
    radiant: normalizeDraftSide(next.draft?.radiant),
    dire: normalizeDraftSide(next.draft?.dire)
  };
  next.coachContext = {
    ...(prior.coachContext ?? {}),
    ...(next.coachContext ?? {}),
    timers: Array.isArray(next.coachContext?.timers)
      ? next.coachContext.timers.filter((timer) => timer && typeof timer === 'object').map((timer) => ({ ...timer }))
      : [],
    scouting: { ...(prior.coachContext?.scouting ?? {}), ...(next.coachContext?.scouting ?? {}) },
    settings: { ...(prior.coachContext?.settings ?? {}), ...(next.coachContext?.settings ?? {}) },
    performanceHistory: Array.isArray(next.coachContext?.performanceHistory)
      ? next.coachContext.performanceHistory.filter((report) => report && typeof report === 'object').map((report) => ({ ...report }))
      : []
  };

  next.context = {
    ...prior.context,
    ...(next.context ?? {}),
    enemyCoreDead: Boolean(next.context?.enemyCoreDead),
    alliesReady: clamp(Math.round(nonNegative(next.context?.alliesReady, prior.context?.alliesReady)), 0, 5),
    enemiesVisible: clamp(Math.round(nonNegative(next.context?.enemiesVisible, prior.context?.enemiesVisible)), 0, 5),
    recentDeathSec: next.context?.recentDeathSec === null
      ? null
      : finite(next.context?.recentDeathSec, prior.context?.recentDeathSec),
    safeRouteAvailable: next.context?.safeRouteAvailable !== false,
    roshanAvailable: next.context?.roshanAvailable !== false
  };

  const priorRoleContext = prior.roleContext ?? {};
  const candidateRoleContext = next.roleContext ?? {};
  const normalizeUnitInterval = (value, fallback = 0) => clamp(finite(value, fallback), 0, 1);
  const normalizeLane = (laneId) => {
    const priorLane = priorRoleContext.lanes?.[laneId] ?? {};
    const lane = candidateRoleContext.lanes?.[laneId] ?? {};
    return {
      ...priorLane,
      ...lane,
      killPotential: normalizeUnitInterval(lane.killPotential, priorLane.killPotential),
      danger: normalizeUnitInterval(lane.danger, priorLane.danger),
      enemyCoreExposure: normalizeUnitInterval(lane.enemyCoreExposure, priorLane.enemyCoreExposure),
      objectiveValue: normalizeUnitInterval(lane.objectiveValue, priorLane.objectiveValue)
    };
  };
  next.roleContext = {
    ...priorRoleContext,
    ...candidateRoleContext,
    playerNetWorth: nonNegative(candidateRoleContext.playerNetWorth, priorRoleContext.playerNetWorth),
    laneOpponentNetWorth: nonNegative(candidateRoleContext.laneOpponentNetWorth, priorRoleContext.laneOpponentNetWorth),
    lanePriority: normalizeUnitInterval(candidateRoleContext.lanePriority, priorRoleContext.lanePriority),
    lanePushed: candidateRoleContext.lanePushed === undefined ? Boolean(priorRoleContext.lanePushed) : Boolean(candidateRoleContext.lanePushed),
    safeMoveAvailable: candidateRoleContext.safeMoveAvailable === undefined ? priorRoleContext.safeMoveAvailable !== false : candidateRoleContext.safeMoveAvailable !== false,
    sideLaneKillPotential: normalizeUnitInterval(candidateRoleContext.sideLaneKillPotential, priorRoleContext.sideLaneKillPotential),
    dangerLevel: normalizeUnitInterval(candidateRoleContext.dangerLevel, priorRoleContext.dangerLevel),
    alliesNearby: clamp(Math.round(nonNegative(candidateRoleContext.alliesNearby, priorRoleContext.alliesNearby)), 0, 5),
    enemiesNearby: clamp(Math.round(nonNegative(candidateRoleContext.enemiesNearby, priorRoleContext.enemiesNearby)), 0, 5),
    teamReady: normalizeUnitInterval(candidateRoleContext.teamReady, priorRoleContext.teamReady),
    carryThreat: normalizeUnitInterval(candidateRoleContext.carryThreat, priorRoleContext.carryThreat),
    enemyCarryExposure: normalizeUnitInterval(candidateRoleContext.enemyCarryExposure, priorRoleContext.enemyCarryExposure),
    towerPressureOpportunity: normalizeUnitInterval(candidateRoleContext.towerPressureOpportunity, priorRoleContext.towerPressureOpportunity),
    wisdomControlRisk: normalizeUnitInterval(candidateRoleContext.wisdomControlRisk, priorRoleContext.wisdomControlRisk),
    wisdomFightExpected: candidateRoleContext.wisdomFightExpected === undefined ? Boolean(priorRoleContext.wisdomFightExpected) : Boolean(candidateRoleContext.wisdomFightExpected),
    midNeedsRuneHelp: candidateRoleContext.midNeedsRuneHelp === undefined ? Boolean(priorRoleContext.midNeedsRuneHelp) : Boolean(candidateRoleContext.midNeedsRuneHelp),
    stackCampAvailable: candidateRoleContext.stackCampAvailable === undefined ? Boolean(priorRoleContext.stackCampAvailable) : Boolean(candidateRoleContext.stackCampAvailable),
    pullAvailable: candidateRoleContext.pullAvailable === undefined ? Boolean(priorRoleContext.pullAvailable) : Boolean(candidateRoleContext.pullAvailable),
    laneDutyUrgency: normalizeUnitInterval(candidateRoleContext.laneDutyUrgency, priorRoleContext.laneDutyUrgency),
    enemyDiveThreat: normalizeUnitInterval(candidateRoleContext.enemyDiveThreat, priorRoleContext.enemyDiveThreat),
    visionNeed: normalizeUnitInterval(candidateRoleContext.visionNeed, priorRoleContext.visionNeed),
    bottledRune: { ...(priorRoleContext.bottledRune ?? {}), ...(candidateRoleContext.bottledRune ?? {}) },
    activeRune: { ...(priorRoleContext.activeRune ?? {}), ...(candidateRoleContext.activeRune ?? {}) },
    lanes: { top: normalizeLane('top'), mid: normalizeLane('mid'), bottom: normalizeLane('bottom') },
    meta: {
      ...(priorRoleContext.meta ?? {}),
      ...(candidateRoleContext.meta ?? {}),
      signals: { ...(priorRoleContext.meta?.signals ?? {}), ...(candidateRoleContext.meta?.signals ?? {}) }
    }
  };

  next.progression = {
    itemAcquiredAt: normalizeProgressionMap(next.progression?.itemAcquiredAt),
    levelReachedAt: normalizeProgressionMap(next.progression?.levelReachedAt)
  };

  const previousWarnings = Array.isArray(prior.diagnostics?.warnings) ? prior.diagnostics.warnings : [];
  next.diagnostics = {
    ...prior.diagnostics,
    ...next.diagnostics,
    lastEventType: eventType,
    warnings: [...previousWarnings, ...warnings].slice(-20),
    ignoredEventCount: nonNegative(next.diagnostics?.ignoredEventCount, prior.diagnostics?.ignoredEventCount ?? 0)
  };

  return next;
}
