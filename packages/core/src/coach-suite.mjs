import { buildPregameBriefing } from './pregame-briefing.mjs';
import { recommendCounterItems } from './counter-item-engine.mjs';
import { evaluateCoachTimers } from './coach-timers.mjs';
import { evaluateFlowPerformance } from './flow-performance-index.mjs';
import { selectVoiceCoachCue } from './voice-coach.mjs';
import { recommendAdaptiveBuild } from './adaptive-build-advisor.mjs';
import { aggregateFlowPerformance } from './flow-progress-profile.mjs';

export function buildCoachSuiteSnapshot({ state, decision, roleDecision, decisionHistory = [], roleDecisionHistory = [] }) {
  const timers = evaluateCoachTimers(state);
  const performance = state.phase === 'ended'
    ? evaluateFlowPerformance({ state, decisionHistory, roleDecisionHistory })
    : null;
  const performanceHistory = state.coachContext?.performanceHistory ?? [];
  return {
    pregame: buildPregameBriefing(state),
    counterItems: recommendCounterItems(state),
    adaptiveBuild: recommendAdaptiveBuild(state),
    timers,
    voiceCue: selectVoiceCoachCue({ state, decision, roleDecision, timers }),
    performance,
    progress: aggregateFlowPerformance(performance ? [...performanceHistory, performance] : performanceHistory)
  };
}
