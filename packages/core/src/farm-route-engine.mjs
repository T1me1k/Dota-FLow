const MAX_INPUT_NODES = 32;
const MAX_ROUTE_NODES = 3;
const MAX_EXPANSIONS = 256;
const DEFAULT_MOVE_SPEED = 300;

const SAFETY_RISK = Object.freeze({ SAFE: 0.08, GUARDED: 0.22, CONTESTED: 0.55, DANGEROUS: 0.9 });
const TYPE_CLEAR_SEC = Object.freeze({ LANE: 18, SMALL: 12, MEDIUM: 17, LARGE: 23, ANCIENT: 34 });
const TYPE_VALUE = Object.freeze({ LANE: 210, SMALL: 95, MEDIUM: 125, LARGE: 175, ANCIENT: 260 });
const SUSTAIN_ITEMS = new Set(['item_morbid_mask','item_mask_of_madness','item_satanic','item_vanguard','item_bfury','item_bloodstone']);
const AOE_ITEMS = new Set(['item_maelstrom','item_mjollnir','item_bfury','item_radiance','item_shivas_guard']);
const MOBILITY_ITEMS = new Set(['item_blink','item_travel_boots','item_travel_boots_2','item_hurricane_pike']);

const HERO_CAPABILITIES = Object.freeze({
  morphling: { archetype: 'mobile_scaling_core', mobility: 1.25, aoe: 1.08, sustain: 0.2, ancientLevel: 9, ancientNetWorth: 6200, ancientHealthPct: 0.68 },
  monkey_king: { archetype: 'mobile_melee_core', mobility: 1.32, aoe: 0.95, sustain: 0.12, ancientLevel: 12, ancientNetWorth: 8200, ancientHealthPct: 0.76, ancientNeedsSustain: true },
  sniper: { archetype: 'ranged_stationary_core', mobility: 0.82, aoe: 1.08, sustain: 0.02, ancientLevel: 12, ancientNetWorth: 8800, ancientHealthPct: 0.82, ancientNeedsSustain: true },
  juggernaut: { archetype: 'sustain_melee_core', mobility: 1, aoe: 1.16, sustain: 0.35, ancientLevel: 10, ancientNetWorth: 6800, ancientHealthPct: 0.66 },
  crystal_maiden: { archetype: 'fragile_support', mobility: 0.76, aoe: 1.08, sustain: 0, ancientLevel: 17, ancientNetWorth: 12000, ancientHealthPct: 0.9, ancientNeedsSustain: true },
  lion: { archetype: 'fragile_support', mobility: 0.82, aoe: 0.84, sustain: 0, ancientLevel: 17, ancientNetWorth: 12000, ancientHealthPct: 0.9, ancientNeedsSustain: true }
});
const GENERIC_CAPABILITY = Object.freeze({ archetype: 'generic', mobility: 1, aoe: 1, sustain: 0, ancientLevel: 13, ancientNetWorth: 9000, ancientHealthPct: 0.8, ancientNeedsSustain: true });

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }
function normalizeHero(value) { return String(value ?? '').replace(/^npc_dota_hero_/, '').trim().toLowerCase(); }
function normalizeItem(value) {
  const id = String(typeof value === 'string' ? value : value?.id ?? value?.name ?? '').trim().toLowerCase();
  if (!id) return '';
  return id.startsWith('item_') ? id : `item_${id}`;
}
function normalizePosition(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const x = numberOrNull(value.x ?? value.xpos);
  const y = numberOrNull(value.y ?? value.ypos);
  return x === null || y === null ? null : { x, y };
}
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function quality(value) {
  const normalized = String(value ?? '').trim().toUpperCase();
  return ['LIVE','OBSERVED','MANUAL','INFERRED','STALE','UNAVAILABLE'].includes(normalized) ? normalized : 'UNAVAILABLE';
}
function normalizeNode(raw, index) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const type = String(raw.type ?? raw.kind ?? '').trim().toUpperCase();
  const position = normalizePosition(raw.position ?? raw);
  const id = String(raw.id ?? `${type.toLowerCase() || 'node'}-${index + 1}`).trim();
  const safety = String(raw.safety ?? raw.safetyState ?? 'UNKNOWN').trim().toUpperCase();
  const availabilityQuality = quality(raw.availabilityQuality ?? raw.meta?.availabilityQuality ?? raw.quality);
  const safetyQuality = quality(raw.safetyQuality ?? raw.meta?.safetyQuality ?? raw.quality);
  if (!id || !position || !Object.hasOwn(TYPE_VALUE, type)) return null;
  return {
    id,
    label: String(raw.label ?? raw.name ?? id),
    type,
    position,
    available: raw.available === true,
    availabilityQuality,
    safety,
    safetyQuality,
    expectedGold: Math.max(0, numberOrNull(raw.expectedGold ?? raw.value) ?? TYPE_VALUE[type]),
    expectedXp: Math.max(0, numberOrNull(raw.expectedXp) ?? 0),
    clearTimeSec: Math.max(4, numberOrNull(raw.clearTimeSec) ?? TYPE_CLEAR_SEC[type]),
    expiresAtSec: numberOrNull(raw.expiresAtSec),
    observedAtSec: numberOrNull(raw.observedAtSec),
    risk: numberOrNull(raw.risk)
  };
}

export function buildFarmCapability(state = {}) {
  const hero = normalizeHero(state.hero);
  const base = HERO_CAPABILITIES[hero] ?? GENERIC_CAPABILITY;
  const items = new Set((Array.isArray(state.inventory) ? state.inventory : []).map(normalizeItem).filter(Boolean));
  const hasSustainItem = [...items].some((id) => SUSTAIN_ITEMS.has(id));
  const hasAoeItem = [...items].some((id) => AOE_ITEMS.has(id));
  const hasMobilityItem = [...items].some((id) => MOBILITY_ITEMS.has(id));
  const level = Math.max(1, numberOrNull(state.level) ?? 1);
  const netWorth = Math.max(0, numberOrNull(state.netWorth ?? state.roleContext?.playerNetWorth) ?? 0);
  const healthPct = clamp((numberOrNull(state.health) ?? 0) / Math.max(1, numberOrNull(state.maxHealth) ?? 1), 0, 1);
  const manaPct = clamp((numberOrNull(state.mana) ?? 0) / Math.max(1, numberOrNull(state.maxMana) ?? 1), 0, 1);
  const sustain = clamp(base.sustain + (hasSustainItem ? 0.45 : 0), 0, 1);
  const mobility = base.mobility + (hasMobilityItem ? 0.18 : 0);
  const aoe = base.aoe + (hasAoeItem ? 0.22 : 0);
  const ancientEligible = level >= base.ancientLevel
    && netWorth >= base.ancientNetWorth
    && healthPct >= base.ancientHealthPct
    && (!base.ancientNeedsSustain || sustain >= 0.35);
  return {
    hero,
    archetype: base.archetype,
    level,
    netWorth,
    healthPct,
    manaPct,
    sustain,
    mobility,
    aoe,
    hasSustainItem,
    hasAoeItem,
    hasMobilityItem,
    ancientEligible,
    ancientRequirements: {
      level: base.ancientLevel,
      netWorth: base.ancientNetWorth,
      healthPct: base.ancientHealthPct,
      sustainRequired: Boolean(base.ancientNeedsSustain)
    }
  };
}

function nodeAssessment(node, state, capability) {
  const blockers = [];
  const missingSignals = [];
  if (!node.available) blockers.push('NODE_NOT_CONFIRMED_AVAILABLE');
  if (!['LIVE','OBSERVED','MANUAL'].includes(node.availabilityQuality)) missingSignals.push(`AVAILABILITY:${node.id}`);
  if (!Object.hasOwn(SAFETY_RISK, node.safety)) missingSignals.push(`SAFETY:${node.id}`);
  if (!['LIVE','OBSERVED','MANUAL'].includes(node.safetyQuality)) missingSignals.push(`SAFETY_QUALITY:${node.id}`);
  if (node.safety === 'DANGEROUS') blockers.push('NODE_CONFIRMED_DANGEROUS');
  if (node.expiresAtSec !== null && node.expiresAtSec <= Number(state.gameTimeSec ?? 0)) blockers.push('NODE_SIGNAL_EXPIRED');
  if (node.type === 'ANCIENT' && !capability.ancientEligible) blockers.push('HERO_NOT_READY_FOR_ANCIENTS');
  if (capability.healthPct < 0.28) blockers.push('LOCAL_HEALTH_TOO_LOW');
  const explicitRisk = node.risk === null ? SAFETY_RISK[node.safety] : clamp(node.risk, 0, 1);
  return { eligible: blockers.length === 0 && missingSignals.length === 0, blockers, missingSignals, risk: explicitRisk };
}

function routeNodeScore(node, assessment, travelSec, capability) {
  const typeEfficiency = node.type === 'ANCIENT' ? capability.aoe * (0.7 + capability.sustain * 0.5) : capability.aoe;
  const clearSec = node.clearTimeSec / clamp(typeEfficiency, 0.65, 1.7);
  const duration = Math.max(1, travelSec + clearSec);
  const valueRate = node.expectedGold / duration;
  const riskPenalty = assessment.risk * 20;
  const laneFirstBonus = node.type === 'LANE' ? 2.5 : 0;
  return { score: valueRate - riskPenalty + laneFirstBonus, clearSec, duration };
}

function confidenceFor(route, nodes, capability) {
  const qualities = route.flatMap((entry) => [entry.node.availabilityQuality, entry.node.safetyQuality]);
  const qualityScore = qualities.every((entry) => entry === 'LIVE') ? 0.92
    : qualities.every((entry) => ['LIVE','OBSERVED'].includes(entry)) ? 0.84
      : qualities.every((entry) => ['LIVE','OBSERVED','MANUAL'].includes(entry)) ? 0.74 : 0.45;
  const coverage = Math.min(1, nodes.length / 3);
  return +clamp(qualityScore * (0.82 + coverage * 0.12) * (capability.healthPct < 0.5 ? 0.82 : 1), 0.3, 0.95).toFixed(3);
}

function instruction(node, language) {
  const prefix = language === 'ru' ? 'Следующий фарм' : 'Next farm';
  const typeLabels = language === 'ru'
    ? { LANE: 'линия', SMALL: 'малый лагерь', MEDIUM: 'средний лагерь', LARGE: 'большой лагерь', ANCIENT: 'древние' }
    : { LANE: 'lane wave', SMALL: 'small camp', MEDIUM: 'medium camp', LARGE: 'large camp', ANCIENT: 'ancients' };
  return `${prefix}: ${node.label} · ${typeLabels[node.type]}`;
}

function unavailable(status, missingSignals, blockers, capability, diagnostics) {
  return {
    status,
    route: [],
    nextNode: null,
    instructionRu: blockers.length ? 'Безопасный маршрут сейчас заблокирован.' : 'Недостаточно подтверждённых данных для маршрута.',
    instructionEn: blockers.length ? 'A safe route is currently blocked.' : 'Not enough confirmed data for a route.',
    confidence: 0,
    reasons: [],
    blockers: [...new Set(blockers)],
    missingSignals: [...new Set(missingSignals)],
    dataQuality: 'UNAVAILABLE',
    capability,
    diagnostics
  };
}

export function planFarmRoute(state = {}, options = {}) {
  const position = normalizePosition(state.position ?? state.heroPosition);
  const rawNodes = Array.isArray(options.nodes) ? options.nodes : Array.isArray(state.farmNodes) ? state.farmNodes : [];
  const capability = buildFarmCapability(state);
  const diagnostics = { inputNodeCount: rawNodes.length, evaluatedNodeCount: 0, eligibleNodeCount: 0, expansions: 0, maxExpansions: MAX_EXPANSIONS };
  if (!position) return unavailable('UNAVAILABLE', ['LOCAL_POSITION'], [], capability, diagnostics);
  if (!rawNodes.length) return unavailable('UNAVAILABLE', ['FARM_ROUTE_NODES'], [], capability, diagnostics);

  const nodes = rawNodes.slice(0, MAX_INPUT_NODES).map(normalizeNode).filter(Boolean);
  diagnostics.evaluatedNodeCount = nodes.length;
  const rejectedBlockers = [];
  const missingSignals = [];
  const eligible = [];
  for (const node of nodes) {
    const assessment = nodeAssessment(node, state, capability);
    if (assessment.eligible) eligible.push({ node, assessment });
    else {
      rejectedBlockers.push(...assessment.blockers.map((code) => `${code}:${node.id}`));
      missingSignals.push(...assessment.missingSignals);
    }
  }
  diagnostics.eligibleNodeCount = eligible.length;
  if (!eligible.length) return unavailable(rejectedBlockers.length ? 'BLOCKED' : 'UNAVAILABLE', missingSignals, rejectedBlockers, capability, diagnostics);

  const moveSpeed = Math.max(100, numberOrNull(state.moveSpeed) ?? DEFAULT_MOVE_SPEED) * capability.mobility;
  let frontier = [{ position, route: [], score: 0, totalTravelSec: 0, totalClearSec: 0, totalExpectedGold: 0, used: new Set() }];
  const completed = [];
  for (let depth = 0; depth < MAX_ROUTE_NODES && frontier.length && diagnostics.expansions < MAX_EXPANSIONS; depth += 1) {
    const next = [];
    for (const partial of frontier) {
      for (const candidate of eligible) {
        if (partial.used.has(candidate.node.id) || diagnostics.expansions >= MAX_EXPANSIONS) continue;
        diagnostics.expansions += 1;
        const travelSec = distance(partial.position, candidate.node.position) / moveSpeed;
        const scored = routeNodeScore(candidate.node, candidate.assessment, travelSec, capability);
        const routeEntry = {
          id: candidate.node.id,
          label: candidate.node.label,
          type: candidate.node.type,
          expectedGold: Math.round(candidate.node.expectedGold),
          travelSec: Math.round(travelSec),
          clearSec: Math.round(scored.clearSec),
          safety: candidate.node.safety,
          risk: +candidate.assessment.risk.toFixed(2),
          availabilityQuality: candidate.node.availabilityQuality,
          safetyQuality: candidate.node.safetyQuality,
          node: candidate.node
        };
        const used = new Set(partial.used); used.add(candidate.node.id);
        const built = {
          position: candidate.node.position,
          route: [...partial.route, routeEntry],
          score: partial.score + scored.score * (1 - depth * 0.08),
          totalTravelSec: partial.totalTravelSec + travelSec,
          totalClearSec: partial.totalClearSec + scored.clearSec,
          totalExpectedGold: partial.totalExpectedGold + candidate.node.expectedGold,
          used
        };
        next.push(built);
        completed.push(built);
      }
    }
    frontier = next.sort((a, b) => b.score - a.score || a.totalTravelSec - b.totalTravelSec).slice(0, 24);
  }

  const best = completed.sort((a, b) => b.score - a.score || b.totalExpectedGold - a.totalExpectedGold)[0];
  if (!best) return unavailable('BLOCKED', missingSignals, rejectedBlockers, capability, diagnostics);
  const route = best.route.map(({ node: _node, ...entry }) => entry);
  const first = route[0];
  const reasons = [
    `EXPECTED_GOLD:${Math.round(best.totalExpectedGold)}`,
    `TRAVEL_SEC:${Math.round(best.totalTravelSec)}`,
    `HERO_ARCHETYPE:${capability.archetype}`,
    ...(route.some((entry) => entry.type === 'ANCIENT') ? ['ANCIENTS_CONFIRMED_ELIGIBLE'] : [])
  ];
  return {
    status: 'READY',
    route,
    nextNode: first,
    instructionRu: instruction(first, 'ru'),
    instructionEn: instruction(first, 'en'),
    totalExpectedGold: Math.round(best.totalExpectedGold),
    totalTravelSec: Math.round(best.totalTravelSec),
    totalClearSec: Math.round(best.totalClearSec),
    confidence: confidenceFor(best.route, eligible, capability),
    reasons,
    blockers: [],
    missingSignals: [],
    dataQuality: best.route.every((entry) => entry.node.availabilityQuality === 'LIVE' && entry.node.safetyQuality === 'LIVE') ? 'LIVE' : 'OBSERVED',
    capability,
    diagnostics
  };
}

export class FarmRouteEngine {
  evaluate(state, options) { return planFarmRoute(state, options); }
}

export const FARM_ROUTE_LIMITS = Object.freeze({ maxInputNodes: MAX_INPUT_NODES, maxRouteNodes: MAX_ROUTE_NODES, maxExpansions: MAX_EXPANSIONS });
