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
  ].filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, value]) => ({ label, value }));
}

function allyStrengths(draft) {
  return [
    ['Инициация', draft.allyInitiation],
    ['Контроль', draft.allyControl],
    ['Save', draft.allySave],
    ['Push', draft.allyPush]
  ].filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, value]) => ({ label, value }));
}

function evaluateDraftAvailability(draft) {
  const ownCount = draft.ownTeam.length;
  const enemyCount = draft.enemyTeam.length;
  const totalCount = ownCount + enemyCount;
  const missingSignals = [];

  if (ownCount < 5) missingSignals.push(`Союзный draft: ${ownCount}/5`);
  if (enemyCount < 5) missingSignals.push(`Вражеский draft: ${enemyCount}/5`);

  const status = ownCount === 5 && enemyCount === 5
    ? 'READY'
    : totalCount >= 2 && enemyCount > 0
      ? 'PARTIAL'
      : 'UNAVAILABLE';

  return {
    status,
    dataQuality: status === 'READY' ? 'INFERRED' : status === 'PARTIAL' ? 'PARTIAL' : 'UNAVAILABLE',
    ownCount,
    enemyCount,
    totalCount,
    missingSignals
  };
}

function buildTips(draft, availability) {
  if (availability.status === 'UNAVAILABLE') return [];
  const tips = [];

  if (draft.enemyControl >= 0.55) tips.push('Не входи первым без защиты от контроля.');
  if (draft.enemyKite >= 0.5) tips.push('Сохраняй мобильность для доступа к задней линии.');
  if (draft.enemyBurst >= 0.55) tips.push('Не показывайся без информации о ключевых cooldown врага.');
  if (draft.allyInitiation >= 0.45) tips.push('Играй вторым номером после союзной инициации.');
  if (draft.allyPush >= 0.45) tips.push('После выигранной драки сразу конвертируй окно в строения.');
  if (!tips.length) tips.push('Не форсируй действие до первого подтверждённого окна силы.');

  return tips.slice(0, 4);
}

function buildMatchPlan(draft, tips, availability) {
  if (availability.status === 'UNAVAILABLE') return null;

  const fightRule = draft.enemyControl >= 0.55
    ? 'Входи после ключевого контроля или с готовой защитой.'
    : draft.enemyBurst >= 0.55
      ? 'Начинай драку только из информации и не подставляйся под первый burst.'
      : 'Играй вокруг подтверждённого power spike и численного преимущества.';

  const conversion = draft.allyPush >= 0.45
    ? 'После победы сразу забирай башню или Roshan.'
    : 'После победы закрепляй карту: vision, линии и безопасная экономика.';

  return {
    opening: tips[0],
    priorities: tips,
    fightRule,
    conversion
  };
}

export function buildPregameBriefing(state, { scouting = state.coachContext?.scouting } = {}) {
  const draft = analyzeDraft(state);
  const profile = getHeroProfile(state.hero);
  const availability = evaluateDraftAvailability(draft);
  const rawCounterItems = recommendCounterItems(state);
  const rawAdaptiveBuild = recommendAdaptiveBuild(state);
  const threats = availability.status === 'UNAVAILABLE' ? [] : topThreats(draft);
  const strengths = availability.status === 'UNAVAILABLE' ? [] : allyStrengths(draft);
  const tips = buildTips(draft, availability);
  const matchPlan = buildMatchPlan(draft, tips, availability);

  const adaptiveBuild = availability.status === 'UNAVAILABLE'
    ? {
        ...rawAdaptiveBuild,
        status: 'WAITING_FOR_DRAFT',
        recommendedPlan: null,
        alternatives: [],
        deviations: [],
        confidence: 0,
        limitations: [...availability.missingSignals, ...rawAdaptiveBuild.limitations]
      }
    : {
        ...rawAdaptiveBuild,
        dataQuality: availability.dataQuality,
        limitations: [...availability.missingSignals, ...rawAdaptiveBuild.limitations]
      };

  const counterItems = availability.enemyCount === 0
    ? []
    : rawCounterItems.recommendations.slice(0, 3);

  return {
    status: availability.status,
    dataQuality: availability.dataQuality,
    missingSignals: availability.missingSignals,
    hero: profile.id,
    displayName: profile.displayName,
    role: state.role,
    calibrationTier: profile.calibrationTier,
    draftConfidence: availability.status === 'UNAVAILABLE' ? 0 : draft.confidence,
    draftSummary: availability.status === 'UNAVAILABLE'
      ? null
      : {
          ownTeam: draft.ownTeam,
          enemyTeam: draft.enemyTeam,
          ownCount: availability.ownCount,
          enemyCount: availability.enemyCount,
          threats,
          strengths
        },
    threats,
    strengths,
    buildPlan: adaptiveBuild.recommendedPlan
      ? {
          id: adaptiveBuild.recommendedPlan.id,
          name: adaptiveBuild.recommendedPlan.name,
          items: adaptiveBuild.recommendedPlan.items,
          reasons: adaptiveBuild.recommendedPlan.reasons
        }
      : null,
    adaptiveBuild,
    counterItems,
    matchPlan,
    tips,
    scouting: scouting ?? {
      status: 'UNAVAILABLE',
      players: [],
      limitations: ['Player-stat provider is not configured']
    }
  };
}
