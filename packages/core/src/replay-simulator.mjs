import { GameEventPipeline } from './live-pipeline.mjs';

export function validateReplayScenario(scenario) {
  if (!scenario || typeof scenario !== 'object') throw new TypeError('Replay scenario must be an object');
  if (!Array.isArray(scenario.events)) throw new TypeError('Replay scenario must contain an events array');
  return scenario;
}

export function runReplayScenario(scenario, options = {}) {
  validateReplayScenario(scenario);
  const pipeline = new GameEventPipeline({
    initialState: { ...(scenario.initialState ?? {}), ...(options.initialState ?? {}) },
    coordinatorOptions: options.coordinatorOptions
  });
  const timeline = [];

  for (const event of scenario.events) {
    const snapshot = pipeline.dispatch(event);
    timeline.push({
      event,
      gameTimeSec: snapshot.state.gameTimeSec,
      action: snapshot.decision.action,
      confidence: snapshot.decision.confidence,
      powerStatus: snapshot.decision.powerState.status,
      targetItemId: snapshot.state.targetItem?.id ?? null
    });
  }

  return {
    name: scenario.name ?? 'Unnamed replay',
    finalState: pipeline.state,
    finalDecision: pipeline.decision,
    decisionHistory: [...pipeline.decisionHistory],
    timeline,
    eventCount: pipeline.eventCount
  };
}
