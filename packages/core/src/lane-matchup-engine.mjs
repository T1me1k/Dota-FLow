const ACTIONS = new Set(['HOLD_LANE','SHOVE_LANE','FREEZE_LANE','PULL_LANE','RESET_LANE','PRESSURE_HERO','PRESSURE_TOWER','LEAVE_LANE','ROTATE','CALL_SUPPORT','PROTECT_CORE','SACRIFICE_LANE','RECOVER']);
const DANGEROUS = new Set(['PRESSURE_HERO','PRESSURE_TOWER','LEAVE_LANE','ROTATE']);

function qualityOf(lane = {}) {
  const values = Object.values(lane.sources ?? {}).map((source) => source?.quality ?? source);
  if (values.includes('STALE')) return 'STALE';
  if (values.includes('LIVE')) return values.includes('UNAVAILABLE') ? 'PARTIAL' : 'LIVE';
  if (values.includes('MANUAL')) return 'MANUAL';
  if (values.includes('INFERRED')) return 'INFERRED';
  return 'UNAVAILABLE';
}

function result(action, state, lane, reasons, { blockers = [], missing = [] } = {}) {
  const dataQuality = qualityOf(lane);
  if (DANGEROUS.has(action) && (dataQuality === 'UNAVAILABLE' || dataQuality === 'STALE' || missing.length)) {
    blockers.push(`Unsafe ${action} requires current lane evidence`);
    action = state.role?.includes('support') ? 'PROTECT_CORE' : 'HOLD_LANE';
    reasons = ['Сохраняй безопасную позицию: состояние линии не подтверждено', ...reasons];
  }
  return { action, confidence: dataQuality === 'LIVE' ? 0.84 : dataQuality === 'MANUAL' ? 0.72 : dataQuality === 'INFERRED' ? 0.58 : 0.42, reasons: reasons.slice(0, 3), warnings: dataQuality === 'STALE' ? ['Lane context is stale'] : [], blockers, missingSignals: missing, dataQuality, generatedAtSec: state.gameTimeSec, laneState: lane };
}

export function normalizeLaneState(state) {
  const c = state.laneState ?? state.roleContext ?? {};
  return {
    laneId: c.laneId ?? (state.role === 'mid' ? 'mid' : null), lanePhase: c.lanePhase ?? (state.gameTimeSec < 720 ? 'LANING' : 'POST_LANE'),
    laneEquilibrium: c.laneEquilibrium ?? null, wavePosition: c.wavePosition ?? null, lanePushed: c.lanePushed ?? null,
    lanePriority: c.lanePriority ?? null, ownLevel: c.ownLevel ?? state.level ?? null, opponentLevel: c.opponentLevel ?? null,
    ownEconomy: c.ownEconomy ?? state.gold ?? null, opponentEconomy: c.opponentEconomy ?? null,
    ownResources: c.ownResources ?? { health: state.health, mana: state.mana }, opponentResources: c.opponentResources ?? null,
    killPotential: c.killPotential ?? c.sideLaneKillPotential ?? null, deathRisk: c.deathRisk ?? c.dangerLevel ?? null,
    towerPressure: c.towerPressure ?? c.towerPressureOpportunity ?? null, rotationCost: c.rotationCost ?? null,
    missingHeroesRisk: c.missingHeroesRisk ?? null, supportPresence: c.supportPresence ?? null,
    nextObjectiveTiming: c.nextObjectiveTiming ?? null, confidence: c.confidence ?? null, sources: c.sources ?? c.meta?.signals ?? {}
  };
}

export class LaneMatchupEngine {
  evaluate(state) {
    const l = normalizeLaneState(state); const role = state.role ?? 'carry';
    const missing = ['lanePriority','deathRisk'].filter((k) => l[k] == null);
    if ((l.deathRisk ?? 0) >= 0.75 || state.health / Math.max(1,state.maxHealth) < 0.3) return result(role.includes('support') ? 'PROTECT_CORE' : 'RESET_LANE', state, l, ['Высокий риск смерти важнее давления'], { missing: [] });
    if (role === 'mid' && l.lanePushed && state.level >= 6 && state.ultimateReady && (l.killPotential ?? 0) >= 0.65) return result('ROTATE', state, l, ['Волна подготовлена перед ротацией','Ultimate готов и есть боковая цель'], { missing });
    if (role === 'carry' && l.supportPresence === false && (l.deathRisk ?? 0) > 0.5) return result('LEAVE_LANE', state, l, ['Линия небезопасна без поддержки','Перейди к безопасному recovery pattern'], { missing });
    if (role === 'offlane' && (l.towerPressure ?? 0) > 0.65 && (l.deathRisk ?? 1) < 0.45) return result('PRESSURE_TOWER', state, l, ['Преимущество линии можно конвертировать в башню'], { missing });
    if (role === 'hard_support' && l.lanePushed && l.supportPresence !== false) return result('PULL_LANE', state, l, ['Pull восстановит равновесие линии']);
    if (role?.includes('support')) return result('PROTECT_CORE', state, l, ['Сохраняй ресурсы core и допустимую дистанцию ухода']);
    if (l.lanePushed === false && (l.deathRisk ?? 0) < 0.4) return result('FREEZE_LANE', state, l, ['Удерживай безопасную экономику у своей башни']);
    return result('HOLD_LANE', state, l, ['Сохраняй линию до подтверждённого окна'], { missing: [] });
  }
}

export const LANE_ACTIONS = Object.freeze([...ACTIONS]);
export function evaluateLaneMatchup(state) { return new LaneMatchupEngine().evaluate(state); }
