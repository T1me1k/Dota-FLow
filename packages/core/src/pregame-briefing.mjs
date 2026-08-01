import { analyzeDraft } from './draft-analyzer.mjs';
import { getHeroProfile } from './hero-profiles.mjs';
import { recommendCounterItems } from './counter-item-engine.mjs';
import { recommendAdaptiveBuild } from './adaptive-build-advisor.mjs';

function topThreats(draft) {
  return [
    ['Контроль', draft.enemyControl],
    ['Burst', draft.enemyBurst],
    ['Kite', draft.enemyKite],
    ['Глобальное давление', draft.enemyGlobal],
    ['Save', draft.enemySave],
    ['Плотность', draft.enemyDurability]
  ].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, value]) => ({ label, value }));
}

function allyStrengths(draft) {
  return [
    ['Инициация', draft.allyInitiation],
    ['Контроль', draft.allyControl],
    ['Save', draft.allySave],
    ['Push', draft.allyPush]
  ].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, value]) => ({ label, value }));
}

export function buildPregameBriefing(state, { scouting = state.coachContext?.scouting } = {}) {
  const draft = analyzeDraft(state);
  const profile = getHeroProfile(state.hero);
  const counterItems = recommendCounterItems(state);
  const adaptiveBuild = recommendAdaptiveBuild(state);
  const primaryPlan = adaptiveBuild.recommendedPlan;
  const threats = topThreats(draft);
  const strengths = allyStrengths(draft);
  const tips = [];

  if (draft.enemyControl >= 0.55) tips.push('Не входи первым без защиты от контроля.');
  if (draft.enemyKite >= 0.5) tips.push('Сохраняй мобильность для доступа к задней линии.');
  if (draft.enemyBurst >= 0.55) tips.push('Не показывайся без информации о ключевых cooldown врага.');
  if (draft.allyInitiation >= 0.45) tips.push('Играй вторым номером после союзной инициации.');
  if (draft.allyPush >= 0.45) tips.push('После выигранной драки сразу конвертируй окно в строения.');
  if (!tips.length) tips.push('Собери информацию о линиях и не форсируй действие до первого подтверждённого окна силы.');

  return {
    hero: profile.id,
    displayName: profile.displayName,
    role: state.role,
    calibrationTier: profile.calibrationTier,
    draftConfidence: draft.confidence,
    threats,
    strengths,
    buildPlan: primaryPlan ? { id: primaryPlan.id, name: primaryPlan.name, items: primaryPlan.items, reasons: primaryPlan.reasons } : null,
    adaptiveBuild,
    counterItems: counterItems.recommendations.slice(0, 3),
    tips: tips.slice(0, 4),
    scouting: scouting ?? { status: 'UNAVAILABLE', players: [], limitations: ['Player-stat provider is not configured'] }
  };
}
