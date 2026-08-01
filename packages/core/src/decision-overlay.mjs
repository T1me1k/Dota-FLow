import { LIVE_BRIDGE_STATES } from './live-gep-bridge.mjs';
import { MACRO_ACTIONS, targetGoldRemaining } from './game-state.mjs';

export const OVERLAY_MODES = Object.freeze({
  COMPACT: 'COMPACT',
  EXPANDED: 'EXPANDED'
});

export const OVERLAY_VIEW_STATES = Object.freeze({
  HIDDEN: 'HIDDEN',
  DECISION: 'DECISION',
  DEGRADED: 'DEGRADED',
  STALE: 'STALE',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE'
});

export const OVERLAY_ACTION_META = Object.freeze({
  [MACRO_ACTIONS.FARM]: {
    label: 'ФАРМ',
    shortLabel: 'FARM',
    instruction: 'Добери безопасный цикл фарма.',
    tone: 'farm',
    priority: 30
  },
  [MACRO_ACTIONS.CONNECT]: {
    label: 'ПОДКЛЮЧИСЬ',
    shortLabel: 'CONNECT',
    instruction: 'Сместись ближе к команде, не форсируя драку.',
    tone: 'connect',
    priority: 58
  },
  [MACRO_ACTIONS.FIGHT]: {
    label: 'ДЕРИСЬ',
    shortLabel: 'FIGHT',
    instruction: 'Используй текущее окно силы для драки.',
    tone: 'fight',
    priority: 88
  },
  [MACRO_ACTIONS.PRESSURE]: {
    label: 'ДАВИ',
    shortLabel: 'PRESSURE',
    instruction: 'Конвертируй преимущество в карту и вышки.',
    tone: 'pressure',
    priority: 68
  },
  [MACRO_ACTIONS.RESET]: {
    label: 'ОТОЙДИ',
    shortLabel: 'RESET',
    instruction: 'Прерви действие и восстанови ресурсы.',
    tone: 'reset',
    priority: 100
  },
  [MACRO_ACTIONS.OBJECTIVE]: {
    label: 'ОБЪЕКТ',
    shortLabel: 'OBJECTIVE',
    instruction: 'Соберись на ближайшем доступном объекте.',
    tone: 'objective',
    priority: 82
  },
  [MACRO_ACTIONS.NEUTRAL]: {
    label: 'ЖДИ ДАННЫЕ',
    shortLabel: 'NEUTRAL',
    instruction: 'Недостаточно сигнала для макрорешения.',
    tone: 'neutral',
    priority: 0
  }
});

export const DEFAULT_OVERLAY_SETTINGS = Object.freeze({
  enabled: true,
  mode: OVERLAY_MODES.COMPACT,
  reasonLimit: 2,
  minConfidence: 0.42,
  hideLowConfidence: false,
  hideOutsideMatch: true,
  hideWhenUnavailable: true,
  showStaleDecision: false,
  changePulseMs: 2400
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMode(value) {
  return value === OVERLAY_MODES.EXPANDED ? OVERLAY_MODES.EXPANDED : OVERLAY_MODES.COMPACT;
}

export function normalizeOverlaySettings(settings = {}) {
  const merged = { ...DEFAULT_OVERLAY_SETTINGS, ...(settings ?? {}) };
  return {
    enabled: merged.enabled !== false,
    mode: normalizeMode(merged.mode),
    reasonLimit: Math.round(clamp(finite(merged.reasonLimit, DEFAULT_OVERLAY_SETTINGS.reasonLimit), 0, 4)),
    minConfidence: clamp(finite(merged.minConfidence, DEFAULT_OVERLAY_SETTINGS.minConfidence), 0, 1),
    hideLowConfidence: Boolean(merged.hideLowConfidence),
    hideOutsideMatch: merged.hideOutsideMatch !== false,
    hideWhenUnavailable: merged.hideWhenUnavailable !== false,
    showStaleDecision: Boolean(merged.showStaleDecision),
    changePulseMs: Math.max(0, finite(merged.changePulseMs, DEFAULT_OVERLAY_SETTINGS.changePulseMs))
  };
}

function formatClock(seconds) {
  const value = Math.max(0, finite(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

function normalizePhase(value) {
  return String(value ?? '').trim().toLowerCase();
}

function matchIsActive(state) {
  const phase = normalizePhase(state?.phase);
  if (['playing', 'in_progress', 'game', 'active'].includes(phase)) return true;
  if (['idle', 'unknown', 'ended', 'post_game', 'pregame', 'strategy', 'draft'].includes(phase)) return false;
  return finite(state?.gameTimeSec, -90) >= 0 && Boolean(state?.matchId);
}

function connectionAllowsDecision(bridgeState, settings) {
  if (bridgeState === LIVE_BRIDGE_STATES.LIVE || bridgeState === LIVE_BRIDGE_STATES.DEGRADED) return true;
  if (bridgeState === LIVE_BRIDGE_STATES.STALE) return settings.showStaleDecision;
  return false;
}

function hiddenModel(reason, settings, bridge = {}) {
  return {
    visible: false,
    viewState: OVERLAY_VIEW_STATES.HIDDEN,
    hiddenReason: reason,
    mode: settings.mode,
    connectionState: bridge.state ?? LIVE_BRIDGE_STATES.WAITING,
    connectionMessage: bridge.message ?? '',
    action: null,
    changed: false,
    priority: 0
  };
}

function statusModel(viewState, snapshot, settings, message) {
  const bridge = snapshot?.bridge ?? {};
  const state = snapshot?.diagnostics?.pipeline?.state ?? {};
  return {
    visible: true,
    viewState,
    hiddenReason: null,
    mode: settings.mode,
    connectionState: bridge.state ?? LIVE_BRIDGE_STATES.WAITING,
    connectionMessage: bridge.message ?? '',
    statusLabel: viewState === OVERLAY_VIEW_STATES.STALE ? 'ДАННЫЕ УСТАРЕЛИ' : 'СИГНАЛ НЕСТАБИЛЕН',
    statusMessage: message,
    matchId: state.matchId ?? bridge.activeMatchId ?? null,
    hero: state.hero ?? null,
    gameTimeSec: finite(state.gameTimeSec, 0),
    gameClock: formatClock(state.gameTimeSec),
    action: null,
    changed: false,
    priority: viewState === OVERLAY_VIEW_STATES.STALE ? 96 : 72,
    tone: viewState === OVERLAY_VIEW_STATES.STALE ? 'stale' : 'degraded'
  };
}

export function deriveDecisionOverlayModel(snapshot, options = {}) {
  const settings = normalizeOverlaySettings(options.settings);
  const now = finite(options.now, Date.now());
  const changedAt = options.changedAt === null || options.changedAt === undefined
    ? null
    : finite(options.changedAt, now);
  const bridge = snapshot?.bridge ?? {};
  const pipeline = snapshot?.diagnostics?.pipeline ?? {};
  const state = pipeline.state ?? {};
  const decision = pipeline.decision ?? {};
  const bridgeState = bridge.state ?? LIVE_BRIDGE_STATES.WAITING;

  if (!settings.enabled) return hiddenModel('OVERLAY_DISABLED', settings, bridge);

  if ([LIVE_BRIDGE_STATES.WAITING, LIVE_BRIDGE_STATES.STOPPED].includes(bridgeState)) {
    return hiddenModel(`CONNECTION_${bridgeState}`, settings, bridge);
  }

  if (bridgeState === LIVE_BRIDGE_STATES.UNAVAILABLE && settings.hideWhenUnavailable) {
    return hiddenModel('CONNECTION_UNAVAILABLE', settings, bridge);
  }

  if (settings.hideOutsideMatch && !matchIsActive(state)) {
    return hiddenModel('MATCH_NOT_ACTIVE', settings, bridge);
  }

  if (bridgeState === LIVE_BRIDGE_STATES.STALE && !settings.showStaleDecision) {
    return statusModel(OVERLAY_VIEW_STATES.STALE, snapshot, settings, bridge.message || 'Live-события временно не поступают.');
  }

  const action = Object.hasOwn(OVERLAY_ACTION_META, decision.action)
    ? decision.action
    : MACRO_ACTIONS.NEUTRAL;
  const confidence = clamp(finite(decision.confidence, 0), 0, 1);
  if (settings.hideLowConfidence && confidence < settings.minConfidence) {
    return hiddenModel('LOW_CONFIDENCE', settings, bridge);
  }

  if (!connectionAllowsDecision(bridgeState, settings)) {
    if (bridgeState === LIVE_BRIDGE_STATES.UNAVAILABLE) {
      return statusModel(OVERLAY_VIEW_STATES.DEGRADED, snapshot, settings, bridge.message || 'Overwolf GEP недоступен.');
    }
    return hiddenModel(`CONNECTION_${bridgeState}`, settings, bridge);
  }

  const meta = OVERLAY_ACTION_META[action];
  const reasonLimit = settings.mode === OVERLAY_MODES.COMPACT
    ? Math.min(settings.reasonLimit, 1)
    : settings.reasonLimit;
  const reasons = Array.isArray(decision.reasons)
    ? decision.reasons.filter((reason) => typeof reason === 'string' && reason.trim()).slice(0, reasonLimit)
    : [];
  const powerState = decision.powerState ?? {};
  const calibrationTier = decision.profile?.calibrationTier ?? powerState.calibrationTier ?? 'DETAILED';
  const baselineProfile = calibrationTier === 'BASELINE';
  const spike = powerState.primarySpike ?? powerState.nextSpike ?? null;
  const remainingGold = targetGoldRemaining(state);
  const lowConfidence = confidence < settings.minConfidence;
  const viewState = bridgeState === LIVE_BRIDGE_STATES.DEGRADED
    ? OVERLAY_VIEW_STATES.DEGRADED
    : lowConfidence
      ? OVERLAY_VIEW_STATES.LOW_CONFIDENCE
      : OVERLAY_VIEW_STATES.DECISION;

  return {
    visible: true,
    viewState,
    hiddenReason: null,
    mode: settings.mode,
    connectionState: bridgeState,
    connectionMessage: bridge.message ?? '',
    action,
    label: meta.label,
    shortLabel: meta.shortLabel,
    instruction: decision.message || meta.instruction,
    headline: decision.headline || meta.label,
    tone: meta.tone,
    priority: meta.priority,
    confidence,
    confidencePct: Math.round(confidence * 100),
    lowConfidence,
    reasons,
    changed: changedAt !== null && now - changedAt <= settings.changePulseMs,
    changedAt,
    matchId: state.matchId ?? bridge.activeMatchId ?? null,
    hero: state.hero ?? null,
    gameTimeSec: finite(state.gameTimeSec, 0),
    gameClock: formatClock(state.gameTimeSec),
    alive: state.alive !== false,
    healthPct: state.maxHealth > 0 ? clamp(finite(state.health) / finite(state.maxHealth, 1), 0, 1) : 0,
    targetItem: state.targetItem?.name ?? null,
    targetRemainingGold: remainingGold,
    calibrationTier,
    baselineProfile,
    profileTemplate: decision.profile?.profileTemplate ?? powerState.profileTemplate ?? null,
    powerStatus: powerState.status ?? 'NONE',
    spikeLabel: spike?.label ?? spike?.name ?? null,
    degraded: bridgeState === LIVE_BRIDGE_STATES.DEGRADED,
    stale: bridgeState === LIVE_BRIDGE_STATES.STALE
  };
}

export class DecisionOverlayController {
  constructor({ settings, now = () => Date.now() } = {}) {
    this.settings = normalizeOverlaySettings(settings);
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.lastAction = null;
    this.lastMatchId = null;
    this.changedAt = null;
    this.lastSnapshot = null;
    this.model = hiddenModel('NO_SNAPSHOT', this.settings);
  }

  updateSettings(patch = {}) {
    this.settings = normalizeOverlaySettings({ ...this.settings, ...patch });
    if (this.lastSnapshot) {
      this.model = deriveDecisionOverlayModel(this.lastSnapshot, {
        settings: this.settings,
        now: this.now(),
        changedAt: this.changedAt
      });
    } else {
      this.model = hiddenModel('NO_SNAPSHOT', this.settings);
    }
    return this.snapshot();
  }

  ingest(snapshot, observedAt = this.now()) {
    const now = finite(observedAt, this.now());
    const action = snapshot?.diagnostics?.pipeline?.decision?.action ?? null;
    const matchId = snapshot?.diagnostics?.pipeline?.state?.matchId
      ?? snapshot?.bridge?.activeMatchId
      ?? null;
    if (matchId && this.lastMatchId && String(matchId) !== String(this.lastMatchId)) {
      this.lastAction = null;
      this.changedAt = null;
    }
    if (matchId) this.lastMatchId = String(matchId);
    if (action && action !== MACRO_ACTIONS.NEUTRAL && this.lastAction && action !== this.lastAction) {
      this.changedAt = now;
    }
    if (action && action !== MACRO_ACTIONS.NEUTRAL) this.lastAction = action;
    this.lastSnapshot = snapshot;
    this.model = deriveDecisionOverlayModel(snapshot, {
      settings: this.settings,
      now,
      changedAt: this.changedAt
    });
    return this.snapshot();
  }

  reset() {
    this.lastAction = null;
    this.lastMatchId = null;
    this.changedAt = null;
    this.lastSnapshot = null;
    this.model = hiddenModel('NO_SNAPSHOT', this.settings);
    return this.snapshot();
  }

  snapshot(now = this.now()) {
    if (this.lastSnapshot) {
      this.model = deriveDecisionOverlayModel(this.lastSnapshot, {
        settings: this.settings,
        now,
        changedAt: this.changedAt
      });
    }
    return { ...this.model, settings: { ...this.settings } };
  }
}

export function createDecisionOverlayController(options) {
  return new DecisionOverlayController(options);
}
