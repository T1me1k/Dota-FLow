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

export class VoiceCoachCoordinator {
  constructor({ cooldownSec = 12 } = {}) {
    this.cooldownSec = cooldownSec;
    this.lastKey = null;
    this.lastAtSec = -Infinity;
  }

  update(input) {
    const candidate = selectVoiceCoachCue(input);
    if (!candidate) return null;
    const now = Number(input.state?.gameTimeSec ?? 0);
    if (candidate.key === this.lastKey || now - this.lastAtSec < this.cooldownSec) return null;
    this.lastKey = candidate.key;
    this.lastAtSec = now;
    return candidate;
  }
}
