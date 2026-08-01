import { nextBuildPlanTarget } from './hero-profiles.mjs';

export const MACRO_ACTIONS = Object.freeze({
  FARM: 'FARM',
  CONNECT: 'CONNECT',
  FIGHT: 'FIGHT',
  PRESSURE: 'PRESSURE',
  RESET: 'RESET',
  OBJECTIVE: 'OBJECTIVE',
  NEUTRAL: 'NEUTRAL'
});

export function createInitialGameState(overrides = {}) {
  const base = {
    source: 'mock',
    matchId: null,
    steamId: null,
    phase: 'idle',
    gameTimeSec: -90,
    hero: 'luna',
    role: 'carry',
    team: 'radiant',
    buildPlanId: null,
    level: 1,
    gold: 600,
    reliableGold: 0,
    unreliableGold: 600,
    gpm: 0,
    xpm: 0,
    health: 660,
    maxHealth: 660,
    mana: 363,
    maxMana: 363,
    kills: 0,
    deaths: 0,
    assists: 0,
    lastHits: 0,
    denies: 0,
    alive: true,
    ultimateReady: false,
    buybackAvailable: false,
    inventory: [],
    roster: [],
    abilities: {},
    statusEffects: {},
    wardPurchaseCooldownSec: null,
    damage: { heroTotal: 0, heroCurrent: 0, towerTotal: 0, towerCurrent: 0 },
    teamScore: { radiant: 0, dire: 0 },
    targetItem: {
      id: 'item_manta',
      name: 'Manta Style',
      totalCost: 4650,
      ownedValue: 0
    },
    draft: {
      radiant: [],
      dire: []
    },
    progression: {
      itemAcquiredAt: {},
      levelReachedAt: {}
    },
    diagnostics: {
      warnings: [],
      lastEventType: null,
      ignoredEventCount: 0
    },
    roleContext: {
      playerNetWorth: 0,
      laneOpponentNetWorth: 0,
      lanePriority: 0,
      lanePushed: false,
      safeMoveAvailable: null,
      sideLaneKillPotential: 0,
      dangerLevel: 0,
      alliesNearby: 0,
      enemiesNearby: 0,
      teamReady: 0,
      carryThreat: 0,
      enemyCarryExposure: 0,
      towerPressureOpportunity: 0,
      wisdomControlRisk: 0,
      wisdomFightExpected: false,
      wisdomSide: null,
      midNeedsRuneHelp: false,
      stackCampAvailable: false,
      pullAvailable: false,
      laneDutyUrgency: 0,
      enemyDiveThreat: 0,
      visionNeed: 0,
      bottledRune: { type: null, heldSinceSec: null },
      activeRune: { type: null, activatedAtSec: null },
      lanes: { top: {}, mid: {}, bottom: {} },
      meta: { signals: {} }
    },
    coachContext: {
      timers: [],
      scouting: { status: 'UNAVAILABLE', players: [], limitations: ['Player-stat provider is not configured'] },
      settings: { voiceEnabled: false, timerAlertsEnabled: true },
      performanceHistory: []
    },
    context: {
      enemyCoreDead: false,
      alliesReady: 0,
      enemiesVisible: 0,
      recentDeathSec: null,
      safeRouteAvailable: true,
      roshanAvailable: true
    },
    updatedAt: Date.now()
  };

  return {
    ...base,
    ...overrides,
    diagnostics: { ...base.diagnostics, ...(overrides.diagnostics ?? {}) },
    coachContext: {
      ...base.coachContext,
      ...(overrides.coachContext ?? {}),
      timers: Array.isArray(overrides.coachContext?.timers) ? overrides.coachContext.timers.map((timer) => ({ ...timer })) : [...base.coachContext.timers],
      scouting: { ...base.coachContext.scouting, ...(overrides.coachContext?.scouting ?? {}) },
      settings: { ...base.coachContext.settings, ...(overrides.coachContext?.settings ?? {}) },
      performanceHistory: Array.isArray(overrides.coachContext?.performanceHistory) ? overrides.coachContext.performanceHistory.map((report) => ({ ...report })) : [...base.coachContext.performanceHistory]
    },
    context: { ...base.context, ...(overrides.context ?? {}) },
    roleContext: {
      ...base.roleContext,
      ...(overrides.roleContext ?? {}),
      bottledRune: { ...base.roleContext.bottledRune, ...(overrides.roleContext?.bottledRune ?? {}) },
      activeRune: { ...base.roleContext.activeRune, ...(overrides.roleContext?.activeRune ?? {}) },
      lanes: {
        ...base.roleContext.lanes,
        ...(overrides.roleContext?.lanes ?? {}),
        top: { ...base.roleContext.lanes.top, ...(overrides.roleContext?.lanes?.top ?? {}) },
        mid: { ...base.roleContext.lanes.mid, ...(overrides.roleContext?.lanes?.mid ?? {}) },
        bottom: { ...base.roleContext.lanes.bottom, ...(overrides.roleContext?.lanes?.bottom ?? {}) }
      },
      meta: { ...base.roleContext.meta, ...(overrides.roleContext?.meta ?? {}), signals: { ...(base.roleContext.meta?.signals ?? {}), ...(overrides.roleContext?.meta?.signals ?? {}) } }
    },
    draft: { ...base.draft, ...(overrides.draft ?? {}) },
    progression: {
      ...base.progression,
      ...(overrides.progression ?? {}),
      itemAcquiredAt: { ...base.progression.itemAcquiredAt, ...(overrides.progression?.itemAcquiredAt ?? {}) },
      levelReachedAt: { ...base.progression.levelReachedAt, ...(overrides.progression?.levelReachedAt ?? {}) }
    }
  };
}

export function healthPct(state) {
  return state.maxHealth > 0 ? state.health / state.maxHealth : 0;
}

export function manaPct(state) {
  return state.maxMana > 0 ? state.mana / state.maxMana : 0;
}

export function targetGoldRemaining(state) {
  const target = state.targetItem;
  if (!target) return null;
  return Math.max(0, target.totalCost - target.ownedValue - state.gold);
}

export function applyPatch(state, patch) {
  const inventory = patch.inventory ?? state.inventory;
  const currentTarget = patch.targetItem === undefined ? state.targetItem : patch.targetItem;
  const targetWasPurchased = patch.inventory !== undefined
    && currentTarget
    && inventory.some((item) => item.id === currentTarget.id);
  const targetItem = targetWasPurchased
    ? nextBuildPlanTarget(
      patch.hero ?? state.hero,
      inventory,
      patch.buildPlanId ?? state.buildPlanId,
      currentTarget.id
    )
    : currentTarget;

  return {
    ...state,
    ...patch,
    diagnostics: {
      ...state.diagnostics,
      ...(patch.diagnostics ?? {})
    },
    coachContext: {
      ...(state.coachContext ?? {}),
      ...(patch.coachContext ?? {}),
      timers: Array.isArray(patch.coachContext?.timers)
        ? patch.coachContext.timers.map((timer) => ({ ...timer }))
        : (state.coachContext?.timers ?? []).map((timer) => ({ ...timer })),
      scouting: { ...(state.coachContext?.scouting ?? {}), ...(patch.coachContext?.scouting ?? {}) },
      settings: { ...(state.coachContext?.settings ?? {}), ...(patch.coachContext?.settings ?? {}) },
      performanceHistory: Array.isArray(patch.coachContext?.performanceHistory)
        ? patch.coachContext.performanceHistory.map((report) => ({ ...report }))
        : (state.coachContext?.performanceHistory ?? []).map((report) => ({ ...report }))
    },
    context: {
      ...state.context,
      ...(patch.context ?? {})
    },
    roleContext: {
      ...state.roleContext,
      ...(patch.roleContext ?? {}),
      bottledRune: { ...state.roleContext?.bottledRune, ...(patch.roleContext?.bottledRune ?? {}) },
      activeRune: { ...state.roleContext?.activeRune, ...(patch.roleContext?.activeRune ?? {}) },
      lanes: {
        ...state.roleContext?.lanes,
        ...(patch.roleContext?.lanes ?? {}),
        top: { ...state.roleContext?.lanes?.top, ...(patch.roleContext?.lanes?.top ?? {}) },
        mid: { ...state.roleContext?.lanes?.mid, ...(patch.roleContext?.lanes?.mid ?? {}) },
        bottom: { ...state.roleContext?.lanes?.bottom, ...(patch.roleContext?.lanes?.bottom ?? {}) }
      },
      meta: {
        ...(state.roleContext?.meta ?? {}),
        ...(patch.roleContext?.meta ?? {}),
        signals: { ...(state.roleContext?.meta?.signals ?? {}), ...(patch.roleContext?.meta?.signals ?? {}) }
      }
    },
    draft: {
      ...state.draft,
      ...(patch.draft ?? {})
    },
    progression: {
      ...state.progression,
      ...(patch.progression ?? {}),
      itemAcquiredAt: {
        ...state.progression?.itemAcquiredAt,
        ...(patch.progression?.itemAcquiredAt ?? {})
      },
      levelReachedAt: {
        ...state.progression?.levelReachedAt,
        ...(patch.progression?.levelReachedAt ?? {})
      }
    },
    targetItem,
    updatedAt: Date.now()
  };
}
