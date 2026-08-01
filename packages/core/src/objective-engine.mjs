export const OBJECTIVES = Object.freeze(['ROSHAN','TORMENTOR','TOWER','BARRACKS','WISDOM_RUNE','POWER_RUNE','LOTUS_POOL','OUTPOST','DEFEND_TOWER','HIGH_GROUND','MAP_CONTROL']);

function quality(state) { return state.objectiveContext?.dataQuality ?? (state.source === 'live' ? 'LIVE' : state.source === 'manual' ? 'MANUAL' : 'INFERRED'); }
function decision(action, objective, state, reasons, blockers = [], missingSignals = []) {
  const q = quality(state); const unsafe = ['TAKE_ROSHAN','CONTEST_ROSHAN','TAKE_TORMENTOR','HIGH_GROUND'].includes(action);
  if (unsafe && (['STALE','UNAVAILABLE'].includes(q) || missingSignals.length)) { blockers.push('Objective call needs current team and enemy readiness'); action = 'PREPARE_OBJECTIVE'; }
  return { action, objective, confidence: q === 'LIVE' ? 0.86 : q === 'MANUAL' ? 0.72 : q === 'INFERRED' ? 0.57 : 0.4, reasons, warnings: q === 'STALE' ? ['Objective signals are stale'] : [], blockers, missingSignals, dataQuality: q, generatedAtSec: state.gameTimeSec };
}
export class ObjectiveEngine {
  evaluate(state) {
    const c = state.objectiveContext ?? {}; const requested = c.objective ?? (state.context?.roshanAvailable ? 'ROSHAN' : 'MAP_CONTROL');
    const missing = ['teamReady','visibleEnemies'].filter((k) => c[k] == null);
    if ((c.resourcesPct ?? 1) < 0.45 || c.keyCooldownsReady === false) return decision('RESET_BEFORE_OBJECTIVE', requested, state, ['Восстанови ресурсы и cooldown перед объектом']);
    if (requested === 'DEFEND_TOWER' || c.ownTowerUnderAttack) return decision('DEFEND_TOWER', 'DEFEND_TOWER', state, ['Башню можно защитить без выдуманного состояния карты']);
    if (requested === 'ROSHAN') {
      if (c.roshanAvailable === false || state.context?.roshanAvailable === false) return decision('DO_NOT_ROSHAN','ROSHAN',state,['Roshan недоступен']);
      if (c.enemyCoreDead && c.teamReady >= 3 && c.objectiveDamage >= 0.55) return decision('TAKE_ROSHAN','ROSHAN',state,['Вражеский core мёртв','Команда и урон по объекту готовы'],[],missing);
      return decision('PREPARE_ROSHAN','ROSHAN',state,['Подготовь обзор, ресурсы и выходы'],[],missing);
    }
    if (requested === 'TORMENTOR') return decision(c.teamReady >= 3 ? 'TAKE_TORMENTOR' : 'PREPARE_TORMENTOR','TORMENTOR',state,['Сверь готовность команды и ресурсы'],[],missing);
    if (requested === 'TOWER' && c.enemyCoreDead) return decision('TAKE_TOWER','TOWER',state,['Конвертируй численное окно в безопасную башню'],[],missing);
    return decision('TRADE_OBJECTIVE', requested, state, ['Не форсируй неизвестную зону; выбери доступную конверсию']);
  }
  assess(state, objective) { const d = this.evaluate({ ...state, objectiveContext: { ...state.objectiveContext, objective } }); return { objective, status: d.action, readiness: 1 - d.blockers.length * 0.4, confidence: d.confidence, reasons: d.reasons, blockers: d.blockers, requiredActions: d.action.startsWith('PREPARE') ? ['VISION','RESOURCES','TEAM_READY'] : [], availableWindowSec: state.objectiveContext?.availableWindowSec ?? null, dataQuality: d.dataQuality }; }
}
export function evaluateObjective(state) { return new ObjectiveEngine().evaluate(state); }
