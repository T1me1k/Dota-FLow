import { GameEventPipeline } from './live-pipeline.mjs';
import { GAME_EVENT_TYPES } from './game-events.mjs';
import { createInitialGameState } from './game-state.mjs';
import { getHeroProfile } from './hero-profiles.mjs';
import { createManualContextEnvelope } from './manual-context.mjs';
import { createMatchReview } from './match-review.mjs';

const DEFAULT_DRAFT = Object.freeze({
  radiant: ['luna', 'axe', 'puck', 'tusk', 'treant_protector'],
  dire: ['juggernaut', 'underlord', 'windranger', 'crystal_maiden', 'zeus']
});

/**
 * Stateful mock adapter that deliberately drives the production canonical pipeline.
 * It is shared by browser controls and integration tests so Start Match cannot drift
 * into a UI-only state transition.
 */
export class MockMatchRuntime {
  #pipeline;
  #sequence = 0;
  #sessionId = null;
  #stateSamples = [];
  #lastReview = null;

  constructor() {
    this.#pipeline = new GameEventPipeline({ initialState: createInitialGameState() });
  }

  snapshot() {
    return this.#decorate(this.#pipeline.snapshot());
  }

  startMatch(options = {}) {
    if (this.#pipeline.state.phase === 'playing') return this.snapshot();
    const hero = String(options.hero || 'luna');
    const profile = getHeroProfile(hero);
    if (!profile || profile.id !== hero) throw new TypeError(`Unknown hero: ${hero}`);
    const role = String(options.role || 'carry');
    const allowedRoles = new Set(['carry', 'mid', 'offlane', 'soft_support', 'hard_support']);
    if (!allowedRoles.has(role)) throw new TypeError(`Unknown role: ${role}`);
    const draft = structuredClone(options.draft || DEFAULT_DRAFT);
    const ownDraft = options.team === 'dire' ? draft.dire : draft.radiant;
    if (!Array.isArray(ownDraft) || !Array.isArray(options.team === 'dire' ? draft.radiant : draft.dire)) throw new TypeError('Draft must contain radiant and dire arrays');
    if (!ownDraft.includes(hero)) ownDraft[0] = hero;
    this.#sequence += 1;
    const matchId = `mock-match-${Date.now()}-${this.#sequence}`;
    this.#sessionId = `mock-session-${Date.now()}-${this.#sequence}`;
    this.#stateSamples = [];
    this.#lastReview = null;
    const snapshot = this.#pipeline.dispatch({
      type: GAME_EVENT_TYPES.MATCH_STARTED,
      gameTimeSec: 0,
      source: 'mock-command',
      payload: { matchId, gameTimeSec: 0, hero, role, team: options.team || 'radiant', draft, source: 'mock', ...(options.buildPlanId ? { buildPlanId: options.buildPlanId } : {}) }
    });
    this.#captureState(snapshot.state);
    return this.#decorate(snapshot);
  }

  endMatch() {
    if (this.#pipeline.state.phase !== 'playing') return this.snapshot();
    const snapshot = this.#pipeline.dispatch({
      type: GAME_EVENT_TYPES.MATCH_ENDED,
      gameTimeSec: this.#pipeline.state.gameTimeSec,
      payload: { matchId: this.#pipeline.state.matchId }
    });
    this.#captureState(snapshot.state);
    const review = createMatchReview(snapshot, { states: this.#stateSamples });
    this.#lastReview = {
      ...review,
      metrics: { ...review.metrics, FPI: review.flowPerformanceIndex }
    };
    return this.#decorate(snapshot);
  }

  advance(seconds = 10) {
    if (this.#pipeline.state.phase !== 'playing') throw new Error('MATCH_NOT_ACTIVE');
    const gameTimeSec = this.#pipeline.state.gameTimeSec + Math.max(1, Number(seconds) || 1);
    const snapshot = this.#pipeline.dispatch({ type: GAME_EVENT_TYPES.CLOCK_UPDATED, gameTimeSec, payload: { gameTimeSec } });
    this.#captureState(snapshot.state);
    return this.#decorate(snapshot);
  }

  sendManualContext(command) {
    const envelope = createManualContextEnvelope(command, { gameTimeSec: this.#pipeline.state.gameTimeSec });
    const snapshot = this.#pipeline.dispatch({ type: GAME_EVENT_TYPES.ROLE_CONTEXT_UPDATED, source: 'manual', gameTimeSec: this.#pipeline.state.gameTimeSec, payload: envelope.payload.patch });
    this.#captureState(snapshot.state);
    return this.#decorate(snapshot);
  }

  startCoachTimer(command = {}) {
    if (!Number.isFinite(Number(command.durationSec))) throw new TypeError('INVALID_COACH_TIMER');
    const snapshot = this.#pipeline.dispatch({ type: GAME_EVENT_TYPES.COACH_TIMER_STARTED, source: 'manual', gameTimeSec: this.#pipeline.state.gameTimeSec, payload: { kind: command.kind || 'GLYPH', durationSec: Number(command.durationSec), label: command.label || 'Manual timer', source: 'manual' } });
    this.#captureState(snapshot.state);
    return this.#decorate(snapshot);
  }

  #captureState(state) {
    this.#stateSamples.push(structuredClone({
      gameTimeSec: state.gameTimeSec,
      gold: state.gold,
      gpm: state.gpm,
      level: state.level,
      alive: state.alive,
      health: state.health,
      maxHealth: state.maxHealth,
      kills: state.kills,
      deaths: state.deaths,
      teamScore: state.teamScore,
      targetItem: state.targetItem
    }));
  }

  #decorate(snapshot) {
    const phase = snapshot.state.phase;
    const active = phase === 'playing';
    const review = this.#lastReview ? structuredClone(this.#lastReview) : null;
    return structuredClone({
      ...snapshot,
      decision: active ? snapshot.decision : null,
      macroDecision: active ? snapshot.decision : null,
      roleDecision: active ? snapshot.roleDecision : null,
      laneDecision: active ? snapshot.laneDecision : null,
      objectiveDecision: active ? snapshot.objectiveDecision : null,
      powerSpike: active ? snapshot.powerSpike : null,
      adaptiveBuild: active ? snapshot.adaptiveBuild : null,
      coachCall: active ? snapshot.coachCall : null,
      coach: active ? snapshot.coach : null,
      review,
      runtimeMode: 'MOCK',
      status: active ? 'MATCH_ACTIVE' : phase === 'ended' ? 'MATCH_ENDED' : 'READY',
      dataQuality: active
        ? { overall: 'INFERRED', macro: 'INFERRED', role: 'INFERRED' }
        : { overall: 'UNAVAILABLE', macro: 'UNAVAILABLE', role: 'UNAVAILABLE' },
      runtimeMetadata: {
        source: 'canonical-mock-pipeline',
        engineProjections: active,
        sessionId: this.#sessionId,
        reviewAvailable: Boolean(review)
      }
    });
  }
}
