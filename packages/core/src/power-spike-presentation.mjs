import { localizedBlockerCopy, localizedSpikeCopy } from './live-card-copy.mjs';

const STATUS_LABELS = Object.freeze({
  NONE: { ru: 'Нет активного пика', en: 'No active spike' },
  APPROACHING: { ru: 'Приближается', en: 'Approaching' },
  ACTIVE: { ru: 'Активен', en: 'Active' },
  FADING: { ru: 'Окно заканчивается', en: 'Window fading' },
  MISSED: { ru: 'Тайминг упущен', en: 'Timing missed' }
});

const TIMING_LABELS = Object.freeze({
  EARLY: { ru: 'раньше ориентира', en: 'ahead of benchmark' },
  ON_TIME: { ru: 'в пределах ориентира', en: 'on benchmark' },
  LATE: { ru: 'позже ориентира', en: 'behind benchmark' },
  VERY_LATE: { ru: 'значительно позже ориентира', en: 'well behind benchmark' }
});

function selectedSpike(powerState) {
  return powerState?.primarySpike
    ?? powerState?.nextSpike
    ?? powerState?.missedSpikes?.[0]
    ?? null;
}

function timingDeltaSec(spike) {
  if (!spike || !Number.isFinite(Number(spike.expectedMinute))) return null;
  if (!Number.isFinite(Number(spike.activatedAtSec))) return null;
  return Math.round(Number(spike.activatedAtSec) - Number(spike.expectedMinute) * 60);
}

function statusDetail(status, spike, blocked) {
  const minute = Number.isFinite(Number(spike?.expectedMinute)) ? Math.round(Number(spike.expectedMinute) * 10) / 10 : null;
  if (status === 'APPROACHING') return {
    ru: minute === null ? 'Триггер ещё не подтверждён.' : `Триггер ещё не подтверждён; ориентир — ${minute}-я минута.`,
    en: minute === null ? 'The trigger is not confirmed yet.' : `The trigger is not confirmed yet; benchmark minute ${minute}.`
  };
  if (status === 'ACTIVE' && blocked) return {
    ru: 'Предмет или уровень подтверждён, но условия безопасного входа пока не выполнены.',
    en: 'The item or level is confirmed, but safe commitment conditions are not met yet.'
  };
  if (status === 'ACTIVE') return {
    ru: 'Предмет или уровень подтверждён; основное окно активно.',
    en: 'The item or level is confirmed and the primary window is active.'
  };
  if (status === 'FADING') return {
    ru: 'Триггер подтверждён, но основная длительность окна заканчивается.',
    en: 'The trigger is confirmed, but the primary window is fading.'
  };
  if (status === 'MISSED') return {
    ru: 'Подтверждённый тайминг вышел за основное окно; это не запрет на действие.',
    en: 'The confirmed timing is beyond its primary window; this is not an action ban.'
  };
  return {
    ru: 'Нет подтверждённого уровня или предмета для отдельного окна силы.',
    en: 'No confirmed level or item currently creates a separate power window.'
  };
}

export function presentPowerSpike(powerState) {
  if (!powerState || typeof powerState !== 'object') return null;
  const spike = selectedSpike(powerState);
  const status = String(powerState.status ?? 'NONE').toUpperCase();
  const statusLabels = STATUS_LABELS[status] ?? STATUS_LABELS.NONE;
  const timingKey = String(spike?.timing?.key ?? '').toUpperCase();
  const timingLabels = TIMING_LABELS[timingKey] ?? null;
  const deltaSec = timingDeltaSec(spike);
  const spikeCopy = localizedSpikeCopy(spike);
  const blockers = Array.isArray(spike?.blockers) ? spike.blockers : [];
  const blockerCopy = blockers.map(localizedBlockerCopy);
  const detail = statusDetail(status, spike, Boolean(spike?.blocked));

  return {
    ...powerState,
    name: spike?.name ?? null,
    recommendation: spike?.recommendation ?? null,
    ...spikeCopy,
    expectedMinute: Number.isFinite(Number(spike?.expectedMinute)) ? Number(spike.expectedMinute) : null,
    timingDeltaSec: deltaSec,
    timingKey: timingKey || null,
    statusLabelRu: statusLabels.ru,
    statusLabelEn: statusLabels.en,
    statusDetailRu: detail.ru,
    statusDetailEn: detail.en,
    timingLabelRu: timingLabels?.ru ?? null,
    timingLabelEn: timingLabels?.en ?? null,
    blocked: Boolean(spike?.blocked),
    spikeBlockers: blockers,
    spikeBlockersRu: blockerCopy.map((entry) => entry.ru),
    spikeBlockersEn: blockerCopy.map((entry) => entry.en),
    dataQuality: spike ? 'INFERRED' : 'UNAVAILABLE',
    available: Boolean(spike)
  };
}
