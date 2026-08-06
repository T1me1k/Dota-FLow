import { createInitialGameState } from './game-state.mjs';
import { StableDecisionCoordinator } from './decision-engine.mjs';
import { StableRoleDecisionCoordinator } from './role-engine.mjs';
import { applyGameEvent } from './event-reducer.mjs';
import { GAME_EVENT_TYPES } from './game-events.mjs';
import { normalizeGameState } from './game-state-normalizer.mjs';
import { buildCoachSuiteSnapshot } from './coach-suite.mjs';
import { LaneMatchupEngine } from './lane-matchup-engine.mjs';
import { ObjectiveEngine } from './objective-engine.mjs';
import { AdaptiveBuildCoordinator } from './adaptive-build-advisor.mjs';
import { FarmRouteEngine } from './farm-route-engine.mjs';
import { EnemyLastSeenTracker } from './enemy-last-seen-engine.mjs';
import { evaluateRoleV2 } from './role-engine/index.mjs';
import { DecisionOrchestratorCoordinator } from './decision-orchestrator.mjs';
import { presentPowerSpike } from './power-spike-presentation.mjs';

const HISTORY_LIMIT = 200;
function appendBounded(history, value) { history.push(value); if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT); }

function historyEntry(state, previousDecision, decision, event) {
  return {
    gameTimeSec: state.gameTimeSec,
    previousAction: previousDecision?.action ?? null,
    action: decision.action,
    confidence: decision.confidence,
    reasons: [...decision.reasons],
    triggerEventType: event.type,
    powerStatus: decision.powerState?.status ?? null
  };
}

function roleHistoryEntry(state, previousDecision, decision, event) {
  return {
    gameTimeSec: state.gameTimeSec,
    role: decision.role,
    previousAction: previousDecision?.action ?? null,
    action: decision.action,
    confidence: decision.confidence,
    reasons: [...decision.reasons],
    target: decision.target ?? null,
    triggerEventType: event.type
  };
}

export class GameEventPipeline {
  constructor({ initialState, coordinatorOptions } = {}) {
    const base = createInitialGameState(initialState ?? {});
    this.state = normalizeGameState(base, base, { eventType: 'PIPELINE_INITIALIZED' });
    this.coordinatorOptions = coordinatorOptions ?? {};
    this.coordinator = new StableDecisionCoordinator(this.coordinatorOptions);
    this.legacyRoleFallback = new StableRoleDecisionCoordinator(this.coordinatorOptions?.role ?? {});
    this.laneEngine = new LaneMatchupEngine();
    this.objectiveEngine = new ObjectiveEngine();
    this.buildCoordinator = new AdaptiveBuildCoordinator(this.coordinatorOptions?.build ?? {});
    this.farmRouteEngine = new FarmRouteEngine();
    this.enemyLastSeenTracker = new EnemyLastSeenTracker(this.coordinatorOptions?.enemyLastSeen ?? {});
    this.orchestrator = new DecisionOrchestratorCoordinator(this.coordinatorOptions?.orchestrator ?? {});
    this.decision = this.coordinator.update(this.state);
    this.roleDecision = evaluateRoleV2(this.state);
    this.laneDecision = this.laneEngine.evaluate(this.state);
    this.objectiveDecision = this.objectiveEngine.evaluate(this.state);
    this.adaptiveBuild = this.buildCoordinator.update(this.state);
    this.farmRoute = this.farmRouteEngine.evaluate(this.state);
    this.enemyLastSeen = this.enemyLastSeenTracker.update(this.state);
    this.decisionHistory = [];
    this.roleDecisionHistory = [];
    this.laneDecisionHistory = [];
    this.objectiveDecisionHistory = [];
    this.eventCount = 0;
    this.coachCall = this.updateCoachCall('PIPELINE_INITIALIZED');
    this.coach = buildCoachSuiteSnapshot(this.snapshotBase());
  }

  dispatch(event) {
    let previousDecision = this.decision;
    let previousRoleDecision = this.roleDecision;
    if (event?.type === GAME_EVENT_TYPES.MATCH_STARTED) {
      this.coordinator = new StableDecisionCoordinator(this.coordinatorOptions);
      this.legacyRoleFallback = new StableRoleDecisionCoordinator(this.coordinatorOptions?.role ?? {});
      this.buildCoordinator = new AdaptiveBuildCoordinator(this.coordinatorOptions?.build ?? {});
      this.enemyLastSeenTracker.reset(event?.payload?.matchId ?? null);
      this.orchestrator.reset();
      this.decisionHistory = [];
      this.roleDecisionHistory = [];
      this.laneDecisionHistory = [];
      this.objectiveDecisionHistory = [];
      this.eventCount = 0;
      previousDecision = null;
      previousRoleDecision = null;
    }

    this.state = applyGameEvent(this.state, event);
    this.decision = this.coordinator.update(this.state);
    this.roleDecision = evaluateRoleV2(this.state);
    const previousLane = this.laneDecision;
    const previousObjective = this.objectiveDecision;
    this.laneDecision = this.laneEngine.evaluate(this.state);
    this.objectiveDecision = this.objectiveEngine.evaluate(this.state);
    this.adaptiveBuild = this.buildCoordinator.update(this.state);
    this.farmRoute = this.farmRouteEngine.evaluate(this.state);
    this.enemyLastSeen = this.enemyLastSeenTracker.update(this.state);
    this.coachCall = this.updateCoachCall(event.type);
    this.eventCount += 1;

    if (this.decision.action !== previousDecision?.action) {
      appendBounded(this.decisionHistory, historyEntry(this.state, previousDecision, this.decision, event));
    }
    if (this.roleDecision.action !== previousRoleDecision?.action || this.roleDecision.role !== previousRoleDecision?.role) {
      appendBounded(this.roleDecisionHistory, roleHistoryEntry(this.state, previousRoleDecision, this.roleDecision, event));
    }
    if (this.laneDecision.action !== previousLane?.action) appendBounded(this.laneDecisionHistory, historyEntry(this.state, previousLane, this.laneDecision, event));
    if (this.objectiveDecision.action !== previousObjective?.action) appendBounded(this.objectiveDecisionHistory, historyEntry(this.state, previousObjective, this.objectiveDecision, event));

    this.coach = buildCoachSuiteSnapshot(this.snapshotBase());
    return this.snapshot();
  }

  dispatchMany(events = []) {
    let result = this.snapshot();
    for (const event of events) result = this.dispatch(event);
    return result;
  }

  snapshotBase() {
    return {
      state: this.state,
      decision: this.decision,
      roleDecision: this.roleDecision,
      laneDecision: this.laneDecision,
      objectiveDecision: this.objectiveDecision,
      powerSpike: presentPowerSpike(this.decision?.powerState ?? null),
      adaptiveBuild: this.adaptiveBuild,
      farmRoute: this.farmRoute,
      enemyLastSeen: this.enemyLastSeen,
      dataQuality: {
        lane: this.laneDecision?.dataQuality,
        objective: this.objectiveDecision?.dataQuality,
        role: this.state.roleContext?.meta?.quality ?? 'UNKNOWN',
        farmRoute: this.farmRoute?.dataQuality ?? 'UNAVAILABLE',
        enemyVisibility: this.enemyLastSeen?.dataQuality ?? 'UNAVAILABLE'
      },
      decisionHistory: [...this.decisionHistory],
      roleDecisionHistory: [...this.roleDecisionHistory],
      laneDecisionHistory: [...this.laneDecisionHistory],
      objectiveDecisionHistory: [...this.objectiveDecisionHistory],
      buildPlanHistory: [...(this.buildCoordinator?.history ?? [])],
      coachCall: this.coachCall,
      coachCallHistory: [...this.orchestrator.history],
      eventCount: this.eventCount
    };
  }

  updateCoachCall(reason) {
    return this.orchestrator.update({
      state: this.state,
      powerSpike: this.decision?.powerState ?? null,
      macroDecision: this.decision,
      roleDecision: this.roleDecision,
      laneDecision: this.laneDecision,
      objectiveDecision: this.objectiveDecision,
      adaptiveBuild: this.adaptiveBuild,
      farmRoute: this.farmRoute,
      enemyLastSeen: this.enemyLastSeen,
      coachProfile: this.state.coachProfile,
      dataQuality: {
        lane: this.laneDecision?.dataQuality,
        objective: this.objectiveDecision?.dataQuality,
        role: this.state.roleContext?.meta?.quality ?? 'UNKNOWN',
        farmRoute: this.farmRoute?.dataQuality ?? 'UNAVAILABLE',
        enemyVisibility: this.enemyLastSeen?.dataQuality ?? 'UNAVAILABLE'
      }
    }, reason);
  }

  snapshot() {
    return {
      ...this.snapshotBase(),
      coach: this.coach
    };
  }
}

export function createGameEventPipeline(options) {
  return new GameEventPipeline(options);
}
