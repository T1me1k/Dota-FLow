function cue(key, priority, text, reason, category) {
  return { key, priority, text, reason, category };
}

export function selectVoiceCoachCue({ state, decision, roleDecision, timers }) {
  const candidates = [];
  if (state.phase !== 'playing') return null;
  if (decision?.action === 'RESET' && decision.confidence >= 0.72) {
    candidates.push(cue(`macro:RESET:${Math.floor(state.gameTimeSec / 10)}`, 100, 'Отойди и восстановись.', decision.reasons?.[0], 'MACRO'));
  }
  for (const timer of timers?.alerts ?? []) {
    if (timer.status === 'READY' || timer.status === 'WINDOW') {
      candidates.push(cue(`timer:${timer.id}:${timer.status}`, 88, `${timer.label}: окно активно.`, null, 'TIMER'));
    } else if (timer.remainingSec <= 20) {
      candidates.push(cue(`timer:${timer.id}:${Math.ceil(timer.remainingSec / 5)}`, 78, `${timer.label} через ${Math.ceil(timer.remainingSec)} секунд.`, null, 'TIMER'));
    }
  }
  if (roleDecision?.confidence >= 0.78 && ['MOVE_TO_WISDOM', 'CONTROL_POWER_RUNE', 'HOLD_RUNE_FOR_WISDOM', 'PROTECT_CARRY'].includes(roleDecision.action)) {
    candidates.push(cue(`role:${roleDecision.action}:${Math.floor(state.gameTimeSec / 15)}`, 75, roleDecision.message, roleDecision.reasons?.[0], 'ROLE'));
  }
  if (decision?.changed && decision.confidence >= 0.78) {
    candidates.push(cue(`macro:${decision.action}:${Math.floor(state.gameTimeSec / 15)}`, 65, decision.message, decision.reasons?.[0], 'MACRO'));
  }
  return candidates.sort((a, b) => b.priority - a.priority)[0] ?? null;
}

export function formatCoachCallVoiceMessage(coachCall) {
  if (!coachCall) return null;
  const action = coachCall.primaryAction.replaceAll('_', ' ').toLowerCase();
  const reason = coachCall.reasons?.[0];
  return `${action}. ${reason ?? coachCall.instruction ?? ''}`.trim();
}

export function selectOrchestratedVoiceCue({ state, coachCall }) {
  if (!coachCall || state?.phase !== 'playing') return null;
  return cue(`coach:${coachCall.primaryAction}`, ({ CRITICAL:100, HIGH:85, MEDIUM:65, LOW:40, INFORMATIONAL:20 })[coachCall.urgency] ?? 50, formatCoachCallVoiceMessage(coachCall), coachCall.reasons?.[0] ?? null, 'COACH_CALL');
}

export class VoiceCoachCoordinator {
  constructor({ cooldownSec = 12 } = {}) {
    this.cooldownSec = cooldownSec;
    this.lastKey = null;
    this.lastAtSec = -Infinity;
  }

  update(input) {
    const candidate = input.coachCall ? selectOrchestratedVoiceCue(input) : selectVoiceCoachCue(input);
    if (!candidate) return null;
    const now = Number(input.state?.gameTimeSec ?? 0);
    const criticalOverride = candidate.priority >= 100 && this.lastPriority < 100;
    if (candidate.key === this.lastKey || (!criticalOverride && now - this.lastAtSec < this.cooldownSec)) return null;
    this.lastKey = candidate.key;
    this.lastAtSec = now;
    this.lastPriority = candidate.priority;
    return candidate;
  }
}
