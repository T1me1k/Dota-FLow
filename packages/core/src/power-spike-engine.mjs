import { healthPct, manaPct, targetGoldRemaining } from './game-state.mjs';
import { analyzeDraft } from './draft-analyzer.mjs';
import { getHeroProfile, ownsItem } from './hero-profiles.mjs';

export const POWER_DIMENSIONS = Object.freeze(['farm', 'fight', 'push', 'survival', 'initiation', 'objective', 'mobility']);
export const SPIKE_STATUS = Object.freeze({ NONE: 'NONE', APPROACHING: 'APPROACHING', ACTIVE: 'ACTIVE', FADING: 'FADING', MISSED: 'MISSED' });

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function stageAt(gameTimeSec) {
  const minute = gameTimeSec / 60;
  if (minute < 12) return 'early';
  if (minute < 28) return 'mid';
  return 'late';
}

function addDimensions(target, effects = {}, multiplier = 1) {
  for (const dimension of POWER_DIMENSIONS) {
    target[dimension] = clamp((target[dimension] ?? 0) + (effects[dimension] ?? 0) * multiplier);
  }
}

function triggerSatisfied(state, trigger) {
  const conditions = trigger?.all ?? [];
  return conditions.every((entry) => {
    if (entry.type === 'level_gte') return state.level >= Number(entry.value);
    if (entry.type === 'item_owned') return ownsItem(state, entry.value);
    return false;
  });
}

function triggerTimeSec(state, spike) {
  const times = [];
  for (const entry of spike.trigger?.all ?? []) {
    if (entry.type === 'item_owned') {
      const recorded = state.progression?.itemAcquiredAt?.[entry.value];
      if (Number.isFinite(recorded)) times.push(recorded);
    }
    if (entry.type === 'level_gte') {
      const recorded = state.progression?.levelReachedAt?.[entry.value];
      if (Number.isFinite(recorded)) times.push(recorded);
    }
  }
  if (times.length) return Math.max(...times);
  return spike.expectedMinute * 60;
}

function timingQuality(state, spike, activatedAtSec) {
  const expected = spike.expectedMinute * 60;
  const deltaMin = (activatedAtSec - expected) / 60;
  if (deltaMin < -spike.earlyToleranceMin) return { key: 'EARLY', label: 'ранний', multiplier: 1.18, deltaMin };
  if (deltaMin <= spike.lateToleranceMin) return { key: 'ON_TIME', label: 'вовремя', multiplier: 1, deltaMin };
  if (deltaMin <= spike.lateToleranceMin * 1.8) return { key: 'LATE', label: 'поздний', multiplier: 0.72, deltaMin };
  return { key: 'VERY_LATE', label: 'сильно запоздал', multiplier: 0.42, deltaMin };
}

function proximityToTrigger(state, spike) {
  let progress = 1;
  const missing = [];
  for (const entry of spike.trigger?.all ?? []) {
    if (entry.type === 'level_gte') {
      const required = Number(entry.value);
      if (state.level < required) {
        const gap = required - state.level;
        progress = Math.min(progress, gap <= 1 ? 0.82 : gap <= 2 ? 0.55 : 0.2);
        missing.push(`${gap} ур.`);
      }
    }
    if (entry.type === 'item_owned' && !ownsItem(state, entry.value)) {
      const targetMatches = state.targetItem?.id === entry.value;
      const remaining = targetMatches ? targetGoldRemaining(state) : null;
      if (remaining !== null) {
        const itemProgress = remaining <= 500 ? 0.92 : remaining <= 1200 ? 0.75 : remaining <= 2200 ? 0.48 : 0.2;
        progress = Math.min(progress, itemProgress);
        missing.push(`${remaining}g`);
      } else {
        progress = Math.min(progress, 0.15);
        missing.push(entry.value.replace('item_', ''));
      }
    }
  }
  return { progress, missing };
}

function checkRequirements(state, spike) {
  const blockers = [];
  for (const requirement of spike.requires ?? []) {
    if (requirement.type === 'ultimate_ready' && !state.ultimateReady) blockers.push(requirement.message);
    if (requirement.type === 'min_health_pct' && healthPct(state) < requirement.value) blockers.push(requirement.message);
    if (requirement.type === 'min_mana_pct' && manaPct(state) < requirement.value) blockers.push(requirement.message);
  }
  return blockers;
}

function applyMatchup(profile, state, draft, dimensions, actionBias, blockers) {
  const hasBkb = ownsItem(state, 'item_black_king_bar');
  if (profile.vulnerabilities.includes('control') && draft.enemyControl >= 0.55 && !hasBkb) {
    dimensions.fight = clamp(dimensions.fight - 14);
    dimensions.survival = clamp(dimensions.survival - 12);
    actionBias.FIGHT -= 14;
    blockers.push('У противника много контроля; без BKB вход рискован');
  }
  if (profile.vulnerabilities.includes('kite') && draft.enemyKite >= 0.5) {
    dimensions.fight = clamp(dimensions.fight - 10);
    dimensions.mobility = clamp(dimensions.mobility - 6);
    actionBias.FIGHT -= 8;
    blockers.push('Вражеский драфт хорошо держит дистанцию');
  }
  if (profile.vulnerabilities.includes('burst') && draft.enemyBurst >= 0.55 && draft.allySave < 0.35) {
    dimensions.survival = clamp(dimensions.survival - 10);
    actionBias.FIGHT -= 7;
  }
  if (profile.vulnerabilities.includes('save') && draft.enemySave >= 0.45) {
    dimensions.fight = clamp(dimensions.fight - 8);
    actionBias.FIGHT -= 7;
    blockers.push('У противника есть сильные спасения; выбирай цель осторожно');
  }

  dimensions.initiation = clamp(dimensions.initiation + draft.allyInitiation * 10);
  dimensions.fight = clamp(dimensions.fight + draft.allyControl * 8 + draft.allySave * 6);
  dimensions.push = clamp(dimensions.push + draft.allyPush * 9);
  actionBias.CONNECT += Math.round(draft.allyInitiation * 10);
  actionBias.PRESSURE += Math.round(draft.allyPush * 8);
}

export function evaluatePowerState(state) {
  const profile = getHeroProfile(state.hero);
  const stage = stageAt(state.gameTimeSec);
  const dimensions = Object.fromEntries(POWER_DIMENSIONS.map((key) => [key, profile.basePower[key] ?? 0]));
  addDimensions(dimensions, profile.stageCurves?.[stage]);

  const draft = analyzeDraft(state);
  const actionBias = { FARM: 0, CONNECT: 0, FIGHT: 0, PRESSURE: 0, RESET: 0, OBJECTIVE: 0 };
  const permanentSpikes = [];
  const activeSpikes = [];
  const approachingSpikes = [];
  const fadingSpikes = [];
  const missedSpikes = [];
  const blockers = [];

  for (const spike of profile.spikes) {
    const satisfied = triggerSatisfied(state, spike.trigger);
    if (!satisfied) {
      const proximity = proximityToTrigger(state, spike);
      const expectedSoon = state.gameTimeSec >= spike.expectedMinute * 60 - 180;
      if (proximity.progress >= 0.7 || expectedSoon && proximity.progress >= 0.45) {
        approachingSpikes.push({ ...spike, proximity });
      }
      continue;
    }

    const activatedAtSec = triggerTimeSec(state, spike);
    const timing = timingQuality(state, spike, activatedAtSec);
    const elapsed = Math.max(0, state.gameTimeSec - activatedAtSec);
    const requirementBlockers = checkRequirements(state, spike);
    const isBlocked = requirementBlockers.length > 0;
    blockers.push(...requirementBlockers);

    addDimensions(dimensions, spike.permanent, 1);
    permanentSpikes.push({ id: spike.id, name: spike.name, timing });

    let lifecycle;
    let windowMultiplier = timing.multiplier;
    let missedAtSec = null;
    if (timing.key === 'VERY_LATE' && elapsed > spike.activeDurationSec * 0.35) {
      lifecycle = SPIKE_STATUS.MISSED;
      missedAtSec = activatedAtSec + spike.activeDurationSec * 0.35;
      windowMultiplier *= 0.2;
    } else if (elapsed <= spike.activeDurationSec) {
      lifecycle = SPIKE_STATUS.ACTIVE;
    } else if (elapsed <= spike.activeDurationSec + spike.fadeDurationSec) {
      lifecycle = SPIKE_STATUS.FADING;
      const fadeProgress = (elapsed - spike.activeDurationSec) / spike.fadeDurationSec;
      windowMultiplier *= 1 - fadeProgress * 0.75;
    } else {
      lifecycle = SPIKE_STATUS.MISSED;
      missedAtSec = activatedAtSec + spike.activeDurationSec + spike.fadeDurationSec;
      windowMultiplier = 0;
    }

    if (isBlocked) windowMultiplier *= 0.32;
    addDimensions(dimensions, spike.window, windowMultiplier);
    for (const [action, value] of Object.entries(spike.actions ?? {})) {
      actionBias[action] = (actionBias[action] ?? 0) + Math.round(value * windowMultiplier);
    }

    const evaluated = {
      ...spike,
      activatedAtSec,
      elapsed,
      timing,
      lifecycle,
      missedAtSec,
      missedAgoSec: missedAtSec === null ? null : Math.max(0, state.gameTimeSec - missedAtSec),
      blocked: isBlocked,
      blockers: requirementBlockers,
      effectiveMultiplier: Number(windowMultiplier.toFixed(2))
    };
    if (lifecycle === SPIKE_STATUS.ACTIVE) activeSpikes.push(evaluated);
    else if (lifecycle === SPIKE_STATUS.FADING) fadingSpikes.push(evaluated);
    else missedSpikes.push(evaluated);
  }

  applyMatchup(profile, state, draft, dimensions, actionBias, blockers);

  if (healthPct(state) < 0.4) {
    dimensions.fight = clamp(dimensions.fight - 24);
    dimensions.survival = clamp(dimensions.survival - 20);
    actionBias.RESET += 24;
  }
  if (manaPct(state) < 0.25) {
    dimensions.fight = clamp(dimensions.fight - 12);
    actionBias.RESET += 14;
  }

  const primaryActive = [...activeSpikes, ...fadingSpikes]
    .sort((a, b) => (b.priority * b.effectiveMultiplier) - (a.priority * a.effectiveMultiplier))[0] ?? null;
  const nextSpike = approachingSpikes.sort((a, b) => b.proximity.progress - a.proximity.progress || b.priority - a.priority)[0] ?? null;
  const recentMissed = missedSpikes
    .filter((spike) => spike.missedAgoSec <= spike.fadeDurationSec)
    .sort((a, b) => b.missedAtSec - a.missedAtSec || b.priority - a.priority)[0] ?? null;

  let status = SPIKE_STATUS.NONE;
  if (primaryActive?.lifecycle) status = primaryActive.lifecycle;
  else if (nextSpike) status = SPIKE_STATUS.APPROACHING;
  else if (recentMissed) status = SPIKE_STATUS.MISSED;

  const rawConfidence = clamp(
    45 + draft.confidence * 20 + (primaryActive ? 18 : 0) + (state.inventory.length ? 8 : 0) - blockers.length * 4,
    25,
    96
  ) / 100;
  const confidence = Number(Math.max(0.25, rawConfidence * (profile.profileConfidence ?? 1)).toFixed(2));

  return {
    hero: profile.id,
    displayName: profile.displayName,
    role: profile.role,
    roles: profile.roles ?? [profile.role],
    archetypes: profile.archetypes,
    calibrationTier: profile.calibrationTier ?? 'DETAILED',
    profileTemplate: profile.profileTemplate ?? 'custom',
    stage,
    status,
    primarySpike: primaryActive,
    nextSpike,
    activeSpikes,
    fadingSpikes,
    missedSpikes,
    permanentSpikes,
    dimensions: Object.fromEntries(Object.entries(dimensions).map(([key, value]) => [key, Math.round(value)])),
    actionBias,
    blockers: [...new Set(blockers)].slice(0, 4),
    draft,
    confidence,
    generatedAt: Date.now()
  };
}
