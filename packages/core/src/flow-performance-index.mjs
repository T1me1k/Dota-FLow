import { benchmarkAt, getHeroProfile } from './hero-profiles.mjs';

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function safeRatio(value, target) {
  return target > 0 ? value / target : 0;
}

export function evaluateFlowPerformance({ state, decisionHistory = [], roleDecisionHistory = [] }) {
  const profile = getHeroProfile(state.hero);
  const benchmark = benchmarkAt(profile, Math.max(0, state.gameTimeSec));
  const durationMin = Math.max(1, state.gameTimeSec / 60);
  const economy = clamp(50 + (state.gpm - benchmark.gpm) * 0.22 + (state.lastHits / durationMin - 5) * 6);
  const survival = clamp(100 - state.deaths * 13 + (state.buybackAvailable ? 4 : 0));
  const fighting = clamp(35 + state.kills * 7 + state.assists * 4 - state.deaths * 5 + safeRatio(state.damage?.heroTotal ?? 0, 20000) * 25);
  const objectives = clamp(30 + safeRatio(state.damage?.towerTotal ?? 0, 8000) * 55 + ((state.teamScore?.[state.team] ?? 0) > (state.teamScore?.[state.team === 'radiant' ? 'dire' : 'radiant'] ?? 0) ? 8 : 0));
  const switchesPerTen = decisionHistory.length / Math.max(1, durationMin / 10);
  const discipline = clamp(92 - Math.max(0, switchesPerTen - 4) * 7 - (state.diagnostics?.ignoredEventCount ?? 0) * 2);
  const roleExecution = clamp(55 + Math.min(25, roleDecisionHistory.length * 2) + (state.role === 'carry' || state.role === 'mid' ? Math.min(20, state.lastHits / durationMin * 2) : Math.min(20, state.assists * 2)));
  const dataQuality = clamp(100 - (state.diagnostics?.warnings?.length ?? 0) * 3);

  const dimensions = { economy, survival, fighting, objectives, discipline, roleExecution, dataQuality };
  const score = clamp(economy * 0.22 + survival * 0.18 + fighting * 0.18 + objectives * 0.14 + discipline * 0.12 + roleExecution * 0.12 + dataQuality * 0.04);
  const ranked = Object.entries(dimensions).sort((a, b) => a[1] - b[1]);
  const tips = ranked.slice(0, 3).map(([dimension, value]) => {
    const messages = {
      economy: 'Сократи пустые перемещения и привязывай фарм-маршрут к следующему предмету.',
      survival: 'Раньше выходи из опасной зоны и не показывайся без информации о ключевых врагах.',
      fighting: 'Подключайся только при готовых ресурсах и фокусируй достижимую цель.',
      objectives: 'После выигранного действия сразу выбирай башню, Roshan или контроль территории.',
      discipline: 'Не меняй план после каждого мелкого события; держи решение до появления сильного сигнала.',
      roleExecution: 'Синхронизируй ролевую задачу с общим macro call и ближайшим таймером.',
      dataQuality: 'Запиши полный матч без разрывов, чтобы отчёт опирался на надёжные данные.'
    };
    return { dimension, value, message: messages[dimension] };
  });

  return {
    name: 'Flow Performance Index',
    score,
    grade: score >= 85 ? 'S' : score >= 75 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D',
    dimensions,
    strengths: Object.entries(dimensions).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([dimension, value]) => ({ dimension, value })),
    improvements: tips,
    benchmark: { expectedGpm: benchmark.gpm, actualGpm: state.gpm, expectedLevel: benchmark.level, actualLevel: state.level },
    confidence: Math.max(0.35, Math.min(0.95, dataQuality / 100 * (state.phase === 'ended' ? 0.95 : 0.72)))
  };
}
