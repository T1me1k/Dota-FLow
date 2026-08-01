import {
  GAME_EVENT_TYPES,
  GameEventPipeline,
  createInitialGameState
} from '../packages/core/src/index.mjs';

const asJson = process.argv.includes('--json');

const initialState = createInitialGameState({
  phase: 'pregame',
  hero: 'anti_mage',
  role: 'carry',
  team: 'radiant',
  draft: {
    radiant: ['anti_mage', 'tidehunter', 'lion', 'puck', 'crystal_maiden'],
    dire: ['axe', 'drow_ranger', 'zeus', 'omniknight', 'spirit_breaker']
  }
});

const pipeline = new GameEventPipeline({
  initialState,
  coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
});

const snapshots = [];
snapshots.push({ stage: 'pregame', snapshot: pipeline.snapshot() });

pipeline.dispatch({
  type: GAME_EVENT_TYPES.MATCH_STARTED,
  gameTimeSec: 0,
  payload: { matchId: 'coach-suite-demo', hero: 'anti_mage', role: 'carry', team: 'radiant' }
});
pipeline.dispatch({
  type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
  gameTimeSec: 6 * 60 + 35,
  payload: { level: 8, gold: 1220, gpm: 475, lastHits: 61, health: 1040, maxHealth: 1280 }
});
snapshots.push({ stage: 'live', snapshot: pipeline.snapshot() });

pipeline.dispatch({
  type: GAME_EVENT_TYPES.COACH_TIMER_STARTED,
  gameTimeSec: 18 * 60 + 40,
  payload: { kind: 'ROSHAN', label: 'Roshan respawn' }
});
pipeline.dispatch({
  type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
  gameTimeSec: 27 * 60,
  payload: { level: 21, gold: 2140, gpm: 635, lastHits: 267, kills: 7, deaths: 3, assists: 9 }
});
snapshots.push({ stage: 'roshan-window', snapshot: pipeline.snapshot() });

pipeline.dispatch({
  type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
  gameTimeSec: 36 * 60,
  payload: {
    level: 25,
    gpm: 672,
    lastHits: 386,
    kills: 11,
    deaths: 4,
    assists: 14,
    damage: { heroTotal: 33700, towerTotal: 7400 },
    teamScore: { radiant: 47, dire: 38 }
  }
});
const post = pipeline.dispatch({
  type: GAME_EVENT_TYPES.MATCH_ENDED,
  gameTimeSec: 36 * 60,
  payload: {}
});
snapshots.push({ stage: 'postgame', snapshot: post });

const output = snapshots.map(({ stage, snapshot }) => ({
  stage,
  macro: snapshot.decision.action,
  roleTask: snapshot.roleDecision.action,
  briefingTips: snapshot.coach.pregame.tips,
  counterItems: snapshot.coach.counterItems.recommendations.map((item) => item.name),
  alerts: snapshot.coach.timers.alerts.map((timer) => `${timer.label}:${timer.status}`),
  voiceCue: snapshot.coach.voiceCue?.text ?? null,
  performance: snapshot.coach.performance
    ? { score: snapshot.coach.performance.score, grade: snapshot.coach.performance.grade, improvements: snapshot.coach.performance.improvements.map((item) => item.message) }
    : null
}));

if (asJson) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log('Dota Flow Coach Suite simulation');
  for (const row of output) {
    console.log(`\n[${row.stage}] ${row.macro} · ${row.roleTask}`);
    if (row.briefingTips.length) console.log(`Plan: ${row.briefingTips[0]}`);
    if (row.counterItems.length) console.log(`Counter-items: ${row.counterItems.slice(0, 3).join(', ')}`);
    if (row.alerts.length) console.log(`Alerts: ${row.alerts.join(', ')}`);
    if (row.voiceCue) console.log(`Voice: ${row.voiceCue}`);
    if (row.performance) console.log(`FPI: ${row.performance.score} (${row.performance.grade})`);
  }
}
