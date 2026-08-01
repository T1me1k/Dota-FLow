import { analyzeDraft } from './draft-analyzer.mjs';
import { getHeroProfile } from './hero-profiles.mjs';
import { recommendCounterItems } from './counter-item-engine.mjs';

const ITEM_SIGNALS = Object.freeze({
  item_black_king_bar: { control: 26, burst: 18, magic: 18, label: 'защита от контроля и magic burst' },
  item_sphere: { control: 18, global: 20, label: 'защита от направленной инициации' },
  item_manta: { control: 13, kite: 10, label: 'dispel и давление боковых линий' },
  item_lotus_orb: { control: 18, global: 14, label: 'reflect/dispel против направленных заклинаний' },
  item_pipe: { magic: 24, burst: 12, label: 'командная защита от magic damage' },
  item_glimmer_cape: { magic: 15, burst: 12, label: 'дешёвый save против burst' },
  item_nullifier: { save: 25, label: 'снятие защитных эффектов' },
  item_skadi: { durability: 18, label: 'anti-heal против плотных целей' },
  item_spirit_vessel: { durability: 22, label: 'ранний anti-heal' },
  item_shivas_guard: { durability: 20, label: 'anti-heal и armor' },
  item_monkey_king_bar: { evasion: 25, label: 'точность против evasion' },
  item_blink: { kite: 18, ranged: 12, label: 'быстрый доступ к цели' },
  item_hurricane_pike: { kite: 18, ranged: 8, label: 'позиционирование против kite' }
});

function planScore(plan, draft, index) {
  let score = 50 - index * 3;
  const reasons = [];
  for (const item of plan.items ?? []) {
    const signal = ITEM_SIGNALS[item.id];
    if (!signal) continue;
    const contribution =
      (signal.control ?? 0) * draft.enemyControl +
      (signal.burst ?? 0) * draft.enemyBurst +
      (signal.magic ?? 0) * (draft.enemyBurst * 0.7) +
      (signal.global ?? 0) * draft.enemyGlobal +
      (signal.kite ?? 0) * draft.enemyKite +
      (signal.save ?? 0) * draft.enemySave +
      (signal.durability ?? 0) * draft.enemyDurability +
      (signal.ranged ?? 0) * draft.enemyKite;
    if (contribution >= 7) {
      score += contribution;
      reasons.push(`${item.name}: ${signal.label}`);
    }
  }
  return { plan, score, reasons };
}

export function recommendAdaptiveBuild(state) {
  const profile = getHeroProfile(state.hero);
  const plans = (profile.buildPlans ?? []).filter((plan) => !plan.generic && (plan.items?.length ?? 0) > 0);
  const draft = analyzeDraft(state);
  const counterItems = recommendCounterItems(state, { limit: 5 });
  if (!plans.length) {
    return {
      status: 'NOT_CALIBRATED',
      recommendedPlan: null,
      alternatives: [],
      deviations: counterItems.recommendations.slice(0, 3),
      confidence: Math.min(0.55, counterItems.confidence),
      limitations: ['Для героя ещё нет детализированного build plan']
    };
  }

  const ranked = plans
    .map((plan, index) => planScore(plan, draft, index))
    .sort((a, b) => b.score - a.score);
  const selected = ranked[0];
  const selectedIds = new Set((selected.plan.items ?? []).map((item) => item.id));
  const deviations = counterItems.recommendations
    .filter((item) => !selectedIds.has(item.id))
    .slice(0, 3);

  return {
    status: 'READY',
    recommendedPlan: {
      ...selected.plan,
      score: Math.round(selected.score),
      reasons: selected.reasons.length ? selected.reasons.slice(0, 3) : ['Стандартный план профиля героя']
    },
    alternatives: ranked.slice(1, 3).map((entry) => ({
      id: entry.plan.id,
      name: entry.plan.name,
      score: Math.round(entry.score),
      reasons: entry.reasons.slice(0, 2)
    })),
    deviations,
    confidence: Math.max(0.35, Math.min(0.92, draft.confidence * (plans.length > 1 ? 1 : 0.82))),
    limitations: [
      ...(draft.enemyTeam.length < 5 ? ['Вражеский draft неполный'] : []),
      ...(profile.balanceCalibration?.startsWith('prototype') ? ['Тайминги профиля требуют live-калибровки'] : [])
    ]
  };
}

export class AdaptiveBuildCoordinator {
  constructor({ cooldownSec = 120, scoreMargin = 8 } = {}) { this.cooldownSec=cooldownSec; this.scoreMargin=scoreMargin; this.current=null; this.history=[]; }
  update(state) {
    const proposed=recommendAdaptiveBuild(state); const plan=proposed.recommendedPlan;
    if(!plan) return {...proposed,history:[...this.history]};
    if(!this.current){this.current={planId:plan.id,target:plan.items?.find(i=>!state.inventory?.some(x=>x.id===i.id))?.id??null,score:plan.score,changedAt:state.gameTimeSec};return {...proposed,history:[...this.history]};}
    const elapsed=state.gameTimeSec-this.current.changedAt;
    if(plan.id!==this.current.planId&&elapsed>=this.cooldownSec&&plan.score>=this.current.score+this.scoreMargin){const nextTarget=plan.items?.find(i=>!state.inventory?.some(x=>x.id===i.id))?.id??null;this.history.push({previousPlanId:this.current.planId,nextPlanId:plan.id,previousTarget:this.current.target,nextTarget,reasons:plan.reasons,trigger:'DRAFT_OR_THREAT_CHANGED',confidence:proposed.confidence,gameTimeSec:state.gameTimeSec});this.current={planId:plan.id,target:nextTarget,score:plan.score,changedAt:state.gameTimeSec};}
    return {...proposed,activePlanId:this.current.planId,history:[...this.history]};
  }
}
