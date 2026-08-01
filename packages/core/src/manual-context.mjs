import { ROLE_SIGNAL_STATUS } from './role-context-adapter.mjs';

export const MANUAL_CONTEXT_COMMANDS = Object.freeze({
  LANE_PUSHED: 'LANE_PUSHED',
  LANE_NOT_PUSHED: 'LANE_NOT_PUSHED',
  LANE_PRIORITY_WON: 'LANE_PRIORITY_WON',
  LANE_PRIORITY_EVEN: 'LANE_PRIORITY_EVEN',
  LANE_PRIORITY_LOST: 'LANE_PRIORITY_LOST',
  ROUTE_SAFE: 'ROUTE_SAFE',
  ROUTE_UNSAFE: 'ROUTE_UNSAFE',
  WISDOM_FIGHT_EXPECTED: 'WISDOM_FIGHT_EXPECTED',
  WISDOM_QUIET: 'WISDOM_QUIET',
  BOTTLE_DOUBLE_DAMAGE: 'BOTTLE_DOUBLE_DAMAGE',
  BOTTLE_HASTE: 'BOTTLE_HASTE',
  BOTTLE_INVISIBILITY: 'BOTTLE_INVISIBILITY',
  BOTTLE_REGENERATION: 'BOTTLE_REGENERATION',
  BOTTLE_ARCANE: 'BOTTLE_ARCANE',
  BOTTLE_ILLUSION: 'BOTTLE_ILLUSION',
  BOTTLE_SHIELD: 'BOTTLE_SHIELD',
  BOTTLE_EMPTY: 'BOTTLE_EMPTY',
  TARGET_TOP: 'TARGET_TOP',
  TARGET_BOTTOM: 'TARGET_BOTTOM',
  TARGET_NONE: 'TARGET_NONE',
  CARRY_THREAT_HIGH: 'CARRY_THREAT_HIGH',
  CARRY_THREAT_LOW: 'CARRY_THREAT_LOW',
  PULL_AVAILABLE: 'PULL_AVAILABLE',
  PULL_UNAVAILABLE: 'PULL_UNAVAILABLE',
  STACK_AVAILABLE: 'STACK_AVAILABLE',
  STACK_UNAVAILABLE: 'STACK_UNAVAILABLE',
  CLEAR: 'CLEAR'
});

const MANUAL_SIGNAL_KEYS = Object.freeze([
  'laneState', 'laneTargets', 'enemyEconomy', 'mapPositions', 'bottledRune',
  'campState', 'teamReadiness', 'carryThreat', 'visionState', 'routeSafety'
]);

const EMPTY_LANES = Object.freeze({
  top: Object.freeze({ killPotential: 0, danger: 0, enemyCoreExposure: 0, objectiveValue: 0 }),
  mid: Object.freeze({ killPotential: 0, danger: 0, enemyCoreExposure: 0, objectiveValue: 0 }),
  bottom: Object.freeze({ killPotential: 0, danger: 0, enemyCoreExposure: 0, objectiveValue: 0 })
});

const CLEAR_PATCH = Object.freeze({
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
  lanes: EMPTY_LANES,
  meta: {
    signals: Object.fromEntries(MANUAL_SIGNAL_KEYS.map((key) => [key, {
      status: key === 'routeSafety' ? ROLE_SIGNAL_STATUS.UNKNOWN : ROLE_SIGNAL_STATUS.UNAVAILABLE,
      source: 'manual_clear',
      confidence: 0,
      details: 'Manual context cleared'
    }]))
  }
});

const DEFINITIONS = Object.freeze({
  [MANUAL_CONTEXT_COMMANDS.LANE_PUSHED]: { label: 'Lane pushed', patch: { lanePushed: true, lanePriority: 0.65 } },
  [MANUAL_CONTEXT_COMMANDS.LANE_NOT_PUSHED]: { label: 'Lane not pushed', patch: { lanePushed: false, lanePriority: -0.35 } },
  [MANUAL_CONTEXT_COMMANDS.LANE_PRIORITY_WON]: { label: 'Lane priority won', patch: { lanePriority: 0.85 } },
  [MANUAL_CONTEXT_COMMANDS.LANE_PRIORITY_EVEN]: { label: 'Lane priority even', patch: { lanePriority: 0, meta: { signals: { laneState: { status: ROLE_SIGNAL_STATUS.MANUAL, source: 'manual', confidence: 0.85, details: 'Lane priority confirmed even' } } } } },
  [MANUAL_CONTEXT_COMMANDS.LANE_PRIORITY_LOST]: { label: 'Lane priority lost', patch: { lanePriority: -0.85 } },
  [MANUAL_CONTEXT_COMMANDS.ROUTE_SAFE]: { label: 'Route safe', patch: { safeMoveAvailable: true, dangerLevel: 0.2 } },
  [MANUAL_CONTEXT_COMMANDS.ROUTE_UNSAFE]: { label: 'Route unsafe', patch: { safeMoveAvailable: false, dangerLevel: 0.85 } },
  [MANUAL_CONTEXT_COMMANDS.WISDOM_FIGHT_EXPECTED]: { label: 'Wisdom fight expected', patch: { wisdomFightExpected: true, wisdomControlRisk: 0.8, teamReady: 0.7 } },
  [MANUAL_CONTEXT_COMMANDS.WISDOM_QUIET]: { label: 'Wisdom uncontested', patch: { wisdomFightExpected: false, wisdomControlRisk: 0.15 } },
  [MANUAL_CONTEXT_COMMANDS.BOTTLE_DOUBLE_DAMAGE]: { label: 'Bottle: Double Damage', patch: { bottledRune: { type: 'double_damage' } } },
  [MANUAL_CONTEXT_COMMANDS.BOTTLE_HASTE]: { label: 'Bottle: Haste', patch: { bottledRune: { type: 'haste' } } },
  [MANUAL_CONTEXT_COMMANDS.BOTTLE_INVISIBILITY]: { label: 'Bottle: Invisibility', patch: { bottledRune: { type: 'invisibility' } } },
  [MANUAL_CONTEXT_COMMANDS.BOTTLE_REGENERATION]: { label: 'Bottle: Regeneration', patch: { bottledRune: { type: 'regeneration' } } },
  [MANUAL_CONTEXT_COMMANDS.BOTTLE_ARCANE]: { label: 'Bottle: Arcane', patch: { bottledRune: { type: 'arcane' } } },
  [MANUAL_CONTEXT_COMMANDS.BOTTLE_ILLUSION]: { label: 'Bottle: Illusion', patch: { bottledRune: { type: 'illusion' } } },
  [MANUAL_CONTEXT_COMMANDS.BOTTLE_SHIELD]: { label: 'Bottle: Shield', patch: { bottledRune: { type: 'shield' } } },
  [MANUAL_CONTEXT_COMMANDS.BOTTLE_EMPTY]: { label: 'Bottle empty', patch: { bottledRune: { type: null, heldSinceSec: null }, meta: { signals: { bottledRune: { status: ROLE_SIGNAL_STATUS.UNAVAILABLE, source: 'manual', confidence: 0, details: 'Bottle confirmed empty' } } } } },
  [MANUAL_CONTEXT_COMMANDS.TARGET_TOP]: { label: 'Top lane target', patch: { sideLaneKillPotential: 0.82, lanes: { ...EMPTY_LANES, top: { killPotential: 0.82, danger: 0.3, enemyCoreExposure: 0.7, objectiveValue: 0.55 } } } },
  [MANUAL_CONTEXT_COMMANDS.TARGET_BOTTOM]: { label: 'Bottom lane target', patch: { sideLaneKillPotential: 0.82, lanes: { ...EMPTY_LANES, bottom: { killPotential: 0.82, danger: 0.3, enemyCoreExposure: 0.7, objectiveValue: 0.55 } } } },
  [MANUAL_CONTEXT_COMMANDS.TARGET_NONE]: { label: 'No side-lane target', patch: { sideLaneKillPotential: 0, lanes: EMPTY_LANES, meta: { signals: { laneTargets: { status: ROLE_SIGNAL_STATUS.MANUAL, source: 'manual', confidence: 0.85, details: 'No valuable side-lane target confirmed' } } } } },
  [MANUAL_CONTEXT_COMMANDS.CARRY_THREAT_HIGH]: { label: 'Carry under threat', patch: { carryThreat: 0.9, enemyDiveThreat: 0.85 } },
  [MANUAL_CONTEXT_COMMANDS.CARRY_THREAT_LOW]: { label: 'Carry safe', patch: { carryThreat: 0.1, enemyDiveThreat: 0.1 } },
  [MANUAL_CONTEXT_COMMANDS.PULL_AVAILABLE]: { label: 'Pull available', patch: { pullAvailable: true } },
  [MANUAL_CONTEXT_COMMANDS.PULL_UNAVAILABLE]: { label: 'Pull unavailable', patch: { pullAvailable: false, meta: { signals: { campState: { status: ROLE_SIGNAL_STATUS.MANUAL, source: 'manual', confidence: 0.85, details: 'Pull camp unavailable' } } } } },
  [MANUAL_CONTEXT_COMMANDS.STACK_AVAILABLE]: { label: 'Stack available', patch: { stackCampAvailable: true } },
  [MANUAL_CONTEXT_COMMANDS.STACK_UNAVAILABLE]: { label: 'Stack unavailable', patch: { stackCampAvailable: false, meta: { signals: { campState: { status: ROLE_SIGNAL_STATUS.MANUAL, source: 'manual', confidence: 0.85, details: 'Stack camp unavailable' } } } } },
  [MANUAL_CONTEXT_COMMANDS.CLEAR]: { label: 'Manual context cleared', patch: CLEAR_PATCH }
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function listManualContextCommands() {
  return Object.entries(DEFINITIONS).map(([id, definition]) => ({ id, label: definition.label }));
}

export function manualContextPatch(command, { gameTimeSec = null } = {}) {
  const definition = DEFINITIONS[command];
  if (!definition) throw new TypeError(`Unknown manual context command: ${String(command)}`);
  const patch = clone(definition.patch);
  if (patch.bottledRune?.type && patch.bottledRune.heldSinceSec == null && Number.isFinite(Number(gameTimeSec))) {
    patch.bottledRune.heldSinceSec = Number(gameTimeSec);
  }
  return patch;
}

export function createManualContextEnvelope(command, {
  receivedAt = Date.now(),
  gameTimeSec = null,
  sourceSequence = null,
  note = null
} = {}) {
  const definition = DEFINITIONS[command];
  if (!definition) throw new TypeError(`Unknown manual context command: ${String(command)}`);
  return {
    type: 'manual-context',
    receivedAt: Number(receivedAt),
    ...(sourceSequence !== null ? { sourceSequence } : {}),
    payload: {
      command,
      label: definition.label,
      patch: manualContextPatch(command, { gameTimeSec }),
      ...(Number.isFinite(Number(gameTimeSec)) ? { gameTimeSec: Number(gameTimeSec) } : {}),
      ...(note ? { note: String(note) } : {})
    }
  };
}
