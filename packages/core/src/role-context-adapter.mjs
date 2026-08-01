export const ROLE_SIGNAL_STATUS = Object.freeze({
  LIVE: 'LIVE',
  MANUAL: 'MANUAL',
  INFERRED: 'INFERRED',
  STALE: 'STALE',
  UNAVAILABLE: 'UNAVAILABLE',
  UNKNOWN: 'UNKNOWN'
});

export const ROLE_CONTEXT_QUALITY = Object.freeze({
  FULL: 'FULL',
  PARTIAL: 'PARTIAL',
  LIMITED: 'LIMITED',
  STALE: 'STALE'
});

export const ROLE_CONTEXT_SIGNAL_KEYS = Object.freeze([
  'gameClock',
  'playerIdentity',
  'playerRole',
  'ownEconomy',
  'ownVitals',
  'ownLevel',
  'ownAbilities',
  'ownInventory',
  'roster',
  'combatStats',
  'wardStock',
  'laneState',
  'laneTargets',
  'enemyEconomy',
  'mapPositions',
  'bottledRune',
  'campState',
  'teamReadiness',
  'carryThreat',
  'visionState',
  'routeSafety'
]);

const FEATURE_SIGNAL_MAP = Object.freeze({
  clock_time_changed: ['gameClock'],
  game_state_changed: ['playerIdentity'],
  me: ['playerIdentity'],
  roster: ['roster', 'playerRole'],
  gold: ['ownEconomy'],
  gpm: ['ownEconomy'],
  xpm: ['ownEconomy'],
  hero_health_mana_info: ['ownVitals'],
  hero_leveled_up: ['ownLevel'],
  hero_ability_skilled: ['ownAbilities'],
  hero_ability_used: ['ownAbilities'],
  hero_ability_cooldown_changed: ['ownAbilities'],
  hero_item_changed: ['ownInventory'],
  cs: ['combatStats'],
  ward_purchase_cooldown_changed: ['wardStock']
});

const NEVER_GEP_SIGNALS = Object.freeze([
  'laneState',
  'laneTargets',
  'enemyEconomy',
  'mapPositions',
  'bottledRune',
  'campState',
  'teamReadiness',
  'carryThreat',
  'visionState',
  'routeSafety'
]);

const DYNAMIC_STALE_SEC = Object.freeze({
  gameClock: 5,
  ownEconomy: 20,
  ownVitals: 8,
  ownAbilities: 15,
  ownInventory: 180,
  combatStats: 60,
  wardStock: 10,
  laneState: 20,
  laneTargets: 15,
  enemyEconomy: 45,
  mapPositions: 8,
  bottledRune: 120,
  campState: 15,
  teamReadiness: 12,
  carryThreat: 10,
  visionState: 45,
  routeSafety: 10,
  playerIdentity: 3600,
  playerRole: 3600,
  ownLevel: 600,
  roster: 3600
});

const FIELD_SIGNAL_MAP = Object.freeze({
  playerNetWorth: 'enemyEconomy',
  laneOpponentNetWorth: 'enemyEconomy',
  lanePriority: 'laneState',
  lanePushed: 'laneState',
  safeMoveAvailable: 'routeSafety',
  sideLaneKillPotential: 'laneTargets',
  dangerLevel: 'routeSafety',
  alliesNearby: 'mapPositions',
  enemiesNearby: 'mapPositions',
  teamReady: 'teamReadiness',
  carryThreat: 'carryThreat',
  enemyCarryExposure: 'laneTargets',
  towerPressureOpportunity: 'laneTargets',
  wisdomControlRisk: 'laneTargets',
  wisdomFightExpected: 'laneTargets',
  wisdomSide: 'laneTargets',
  midNeedsRuneHelp: 'teamReadiness',
  stackCampAvailable: 'campState',
  pullAvailable: 'campState',
  laneDutyUrgency: 'laneState',
  enemyDiveThreat: 'carryThreat',
  visionNeed: 'visionState',
  bottledRune: 'bottledRune',
  activeRune: 'bottledRune',
  lanes: 'laneTargets'
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function signal(status = ROLE_SIGNAL_STATUS.UNKNOWN, source = null, confidence = 0, updatedAtGameTime = null, details = null) {
  return {
    status,
    source,
    confidence: clamp(finite(confidence)),
    updatedAtGameTime: Number.isFinite(Number(updatedAtGameTime)) ? Number(updatedAtGameTime) : null,
    ...(details ? { details } : {})
  };
}

export function createRoleContextMeta(overrides = {}) {
  const providedSignals = overrides?.signals && typeof overrides.signals === 'object' ? overrides.signals : {};
  const signals = Object.fromEntries(ROLE_CONTEXT_SIGNAL_KEYS.map((key) => [key, {
    ...signal(),
    ...(providedSignals[key] ?? {})
  }]));
  return {
    quality: ROLE_CONTEXT_QUALITY.LIMITED,
    coverage: 0,
    liveCoverage: 0,
    generatedAtGameTime: null,
    supportedFeatures: [],
    missingFeatures: [],
    requestedFeatures: [],
    limitations: [],
    missingSignals: [],
    staleSignals: [],
    ...overrides,
    signals
  };
}

function mark(meta, key, status, source, confidence, gameTimeSec, details = null) {
  if (!ROLE_CONTEXT_SIGNAL_KEYS.includes(key)) return;
  const previous = meta.signals[key] ?? signal();
  const nextTime = Number.isFinite(Number(gameTimeSec)) ? Number(gameTimeSec) : previous.updatedAtGameTime;
  meta.signals[key] = {
    ...previous,
    ...signal(status, source, confidence, nextTime, details)
  };
}

function explicitContextSignals(context = {}, { includeBooleanPresence = false } = {}) {
  const available = new Set();
  for (const [field, key] of Object.entries(FIELD_SIGNAL_MAP)) {
    const value = context[field];
    if (field === 'bottledRune' || field === 'activeRune') {
      if (value?.type) available.add(key);
    } else if (field === 'lanes') {
      const hasLaneValue = Object.values(value ?? {}).some((lane) => lane && typeof lane === 'object'
        && Object.values(lane).some((entry) => Number(entry) > 0 || entry === true));
      if (hasLaneValue) available.add(key);
    } else if (typeof value === 'boolean') {
      if (includeBooleanPresence || value) available.add(key);
    } else if (value !== null && value !== undefined && Number(value) !== 0 && value !== '') {
      available.add(key);
    }
  }
  return available;
}

function sourceForEvent(event) {
  return event?.source === 'gep' ? 'gep' : event?.source === 'inferred' ? 'inferred' : 'manual';
}

export function updateRoleContextMetaFromEvent(state, event) {
  const gameTimeSec = Number.isFinite(Number(state?.gameTimeSec)) ? Number(state.gameTimeSec) : 0;
  const context = state?.roleContext ?? {};
  const meta = createRoleContextMeta(context.meta ?? {});
  const source = sourceForEvent(event);
  const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {};

  switch (event?.type) {
    case 'MATCH_STARTED': {
      const preservedSignals = Object.fromEntries(ROLE_CONTEXT_SIGNAL_KEYS.map((key) => {
        const previous = meta.signals[key] ?? signal();
        return [key, previous.status === ROLE_SIGNAL_STATUS.UNAVAILABLE
          ? previous
          : signal()];
      }));
      return finalizeRoleContextMeta({
        ...context,
        meta: createRoleContextMeta({
          generatedAtGameTime: gameTimeSec,
          supportedFeatures: [...meta.supportedFeatures],
          missingFeatures: [...meta.missingFeatures],
          requestedFeatures: [...meta.requestedFeatures],
          signals: preservedSignals
        })
      }, gameTimeSec);
    }
    case 'CLOCK_UPDATED':
      mark(meta, 'gameClock', ROLE_SIGNAL_STATUS.LIVE, source, 1, gameTimeSec);
      break;
    case 'PLAYER_IDENTIFIED':
      mark(meta, 'playerIdentity', ROLE_SIGNAL_STATUS.LIVE, source, 0.98, gameTimeSec);
      if (payload.role) mark(meta, 'playerRole', ROLE_SIGNAL_STATUS.LIVE, source, 0.96, gameTimeSec);
      break;
    case 'ROSTER_UPDATED':
      mark(meta, 'roster', ROLE_SIGNAL_STATUS.LIVE, source, 0.98, gameTimeSec);
      if (payload.role || payload.localRole || state?.role) mark(meta, 'playerRole', ROLE_SIGNAL_STATUS.LIVE, source, 0.94, gameTimeSec);
      break;
    case 'GOLD_CHANGED':
    case 'ECONOMY_UPDATED':
      mark(meta, 'ownEconomy', ROLE_SIGNAL_STATUS.LIVE, source, 0.95, gameTimeSec);
      break;
    case 'HERO_VITALS_CHANGED':
      mark(meta, 'ownVitals', ROLE_SIGNAL_STATUS.LIVE, source, 0.98, gameTimeSec);
      break;
    case 'HERO_LEVEL_CHANGED':
      mark(meta, 'ownLevel', ROLE_SIGNAL_STATUS.LIVE, source, 0.98, gameTimeSec);
      break;
    case 'ABILITY_STATE_CHANGED':
    case 'ULTIMATE_CHANGED':
      mark(meta, 'ownAbilities', ROLE_SIGNAL_STATUS.LIVE, source, 0.95, gameTimeSec);
      break;
    case 'ITEM_ADDED':
    case 'ITEM_REMOVED':
      mark(meta, 'ownInventory', source === 'gep' ? ROLE_SIGNAL_STATUS.LIVE : ROLE_SIGNAL_STATUS.MANUAL, source, source === 'gep' ? 0.95 : 0.8, gameTimeSec);
      break;
    case 'COMBAT_STATS_UPDATED':
      mark(meta, 'combatStats', ROLE_SIGNAL_STATUS.LIVE, source, 0.95, gameTimeSec);
      break;
    case 'WARD_STATE_UPDATED':
      mark(meta, 'wardStock', ROLE_SIGNAL_STATUS.LIVE, source, 0.9, gameTimeSec);
      break;
    case 'ROLE_CONTEXT_UPDATED':
      for (const key of explicitContextSignals(payload, { includeBooleanPresence: true })) {
        mark(meta, key, ROLE_SIGNAL_STATUS.MANUAL, source, 0.85, gameTimeSec);
      }
      if (payload.meta?.signals) {
        for (const [key, record] of Object.entries(payload.meta.signals)) {
          if (!ROLE_CONTEXT_SIGNAL_KEYS.includes(key)) continue;
          mark(meta, key, record.status ?? ROLE_SIGNAL_STATUS.MANUAL, record.source ?? source, record.confidence ?? 0.85, record.updatedAtGameTime ?? gameTimeSec, record.details);
        }
      }
      break;
    case 'ROLE_CONTEXT_CAPABILITIES_UPDATED': {
      const supportedFeatures = Array.isArray(payload.supportedFeatures) ? payload.supportedFeatures : [];
      const missingFeatures = Array.isArray(payload.missingFeatures) ? payload.missingFeatures : [];
      const requestedFeatures = Array.isArray(payload.requestedFeatures ?? payload.features) ? (payload.requestedFeatures ?? payload.features) : [];
      meta.supportedFeatures = [...new Set(supportedFeatures)];
      meta.missingFeatures = [...new Set(missingFeatures)];
      meta.requestedFeatures = [...new Set(requestedFeatures)];
      for (const key of NEVER_GEP_SIGNALS) {
        if ((meta.signals[key]?.status ?? ROLE_SIGNAL_STATUS.UNKNOWN) === ROLE_SIGNAL_STATUS.UNKNOWN) {
          mark(meta, key, ROLE_SIGNAL_STATUS.UNAVAILABLE, 'dota_gep', 0, gameTimeSec, 'Dota GEP does not expose this signal directly');
        }
      }
      for (const [feature, signalKeys] of Object.entries(FEATURE_SIGNAL_MAP)) {
        if (missingFeatures.includes(feature)) {
          for (const key of signalKeys) mark(meta, key, ROLE_SIGNAL_STATUS.UNAVAILABLE, 'gep_capability', 0, gameTimeSec, `Missing feature: ${feature}`);
        }
      }
      break;
    }
    default:
      break;
  }

  // Existing explicit context is treated as manual input when no provenance was recorded yet.
  for (const key of explicitContextSignals(context)) {
    if ([ROLE_SIGNAL_STATUS.UNKNOWN, ROLE_SIGNAL_STATUS.UNAVAILABLE].includes(meta.signals[key]?.status)) {
      mark(meta, key, ROLE_SIGNAL_STATUS.MANUAL, 'manual_context', 0.8, gameTimeSec);
    }
  }

  // Safe local inference: own danger can be estimated from local vitals/status only.
  const hp = state?.maxHealth > 0 ? state.health / state.maxHealth : 0;
  const mana = state?.maxMana > 0 ? state.mana / state.maxMana : 0;
  const inferredDanger = clamp(Math.max(1 - hp, (1 - mana) * 0.45, state?.alive === false ? 1 : 0));
  if (![ROLE_SIGNAL_STATUS.MANUAL, ROLE_SIGNAL_STATUS.LIVE].includes(meta.signals.routeSafety?.status)) {
    mark(meta, 'routeSafety', ROLE_SIGNAL_STATUS.INFERRED, 'own_vitals', 0.42, gameTimeSec, 'Only local HP/mana/death state is known; map route safety is unavailable');
  }

  const nextContext = {
    ...context,
    dangerLevel: Math.max(finite(context.dangerLevel), inferredDanger),
    meta
  };
  return finalizeRoleContextMeta(nextContext, gameTimeSec);
}

export function finalizeRoleContextMeta(roleContext = {}, gameTimeSec = 0) {
  const context = roleContext ?? {};
  const meta = createRoleContextMeta(context.meta ?? {});
  const now = finite(gameTimeSec);
  const staleSignals = ROLE_CONTEXT_SIGNAL_KEYS.filter((key) => meta.signals[key]?.status === ROLE_SIGNAL_STATUS.STALE);

  for (const key of ROLE_CONTEXT_SIGNAL_KEYS) {
    const record = meta.signals[key] ?? signal();
    const threshold = DYNAMIC_STALE_SEC[key] ?? 30;
    if ([ROLE_SIGNAL_STATUS.LIVE, ROLE_SIGNAL_STATUS.INFERRED, ROLE_SIGNAL_STATUS.MANUAL].includes(record.status)
      && record.updatedAtGameTime !== null
      && now - record.updatedAtGameTime > threshold) {
      meta.signals[key] = { ...record, status: ROLE_SIGNAL_STATUS.STALE };
      if (!staleSignals.includes(key)) staleSignals.push(key);
    }
  }

  const active = ROLE_CONTEXT_SIGNAL_KEYS.filter((key) => [ROLE_SIGNAL_STATUS.LIVE, ROLE_SIGNAL_STATUS.MANUAL, ROLE_SIGNAL_STATUS.INFERRED].includes(meta.signals[key]?.status));
  const live = ROLE_CONTEXT_SIGNAL_KEYS.filter((key) => meta.signals[key]?.status === ROLE_SIGNAL_STATUS.LIVE);
  const unavailable = ROLE_CONTEXT_SIGNAL_KEYS.filter((key) => [ROLE_SIGNAL_STATUS.UNKNOWN, ROLE_SIGNAL_STATUS.UNAVAILABLE].includes(meta.signals[key]?.status));
  const coverage = active.length / ROLE_CONTEXT_SIGNAL_KEYS.length;
  const liveCoverage = live.length / ROLE_CONTEXT_SIGNAL_KEYS.length;
  const quality = staleSignals.length >= Math.max(3, active.length / 2)
    ? ROLE_CONTEXT_QUALITY.STALE
    : coverage >= 0.7
      ? ROLE_CONTEXT_QUALITY.FULL
      : coverage >= 0.32
        ? ROLE_CONTEXT_QUALITY.PARTIAL
        : ROLE_CONTEXT_QUALITY.LIMITED;

  meta.coverage = Number(coverage.toFixed(3));
  meta.liveCoverage = Number(liveCoverage.toFixed(3));
  meta.quality = quality;
  meta.generatedAtGameTime = now;
  meta.missingSignals = unavailable;
  meta.staleSignals = staleSignals;
  meta.limitations = [
    ...(unavailable.includes('enemyEconomy') ? ['Enemy net worth is not available from Dota GEP'] : []),
    ...(unavailable.includes('mapPositions') ? ['Hero coordinates and fog-of-war positions are not available'] : []),
    ...(unavailable.includes('laneState') ? ['Lane wave state is not available'] : []),
    ...(unavailable.includes('bottledRune') ? ['Bottle rune contents are not available'] : []),
    ...(unavailable.includes('campState') ? ['Pull/stack camp state is not available'] : [])
  ];

  return { ...context, meta };
}

export function roleSignalAvailable(roleContext, key, { minimumConfidence = 0.5, allowInferred = true } = {}) {
  const record = roleContext?.meta?.signals?.[key];
  if (!record) return explicitContextSignals(roleContext).has(key);
  if (record.status === ROLE_SIGNAL_STATUS.STALE || record.status === ROLE_SIGNAL_STATUS.UNAVAILABLE || record.status === ROLE_SIGNAL_STATUS.UNKNOWN) return false;
  if (!allowInferred && record.status === ROLE_SIGNAL_STATUS.INFERRED) return false;
  return finite(record.confidence) >= minimumConfidence;
}

export function roleContextSummary(roleContext = {}) {
  const meta = finalizeRoleContextMeta(roleContext, roleContext?.meta?.generatedAtGameTime ?? 0).meta;
  return {
    quality: meta.quality,
    coverage: meta.coverage,
    liveCoverage: meta.liveCoverage,
    availableSignals: ROLE_CONTEXT_SIGNAL_KEYS.filter((key) => roleSignalAvailable({ ...roleContext, meta }, key)),
    missingSignals: [...meta.missingSignals],
    staleSignals: [...meta.staleSignals],
    limitations: [...meta.limitations],
    signals: meta.signals
  };
}
