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

export function presentPowerSpike(powerState) {
  if (!powerState || typeof powerState !== 'object') return null;
  const spike = selectedSpike(powerState);
  const status = String(powerState.status ?? 'NONE').toUpperCase();
  const statusLabels = STATUS_LABELS[status] ?? STATUS_LABELS.NONE;
  const timingKey = String(spike?.timing?.key ?? '').toUpperCase();
  const timingLabels = TIMING_LABELS[timingKey] ?? null;
  const deltaSec = timingDeltaSec(spike);

  return {
    ...powerState,
    name: spike?.name ?? null,
    recommendation: spike?.recommendation ?? null,
    expectedMinute: Number.isFinite(Number(spike?.expectedMinute)) ? Number(spike.expectedMinute) : null,
    timingDeltaSec: deltaSec,
    timingKey: timingKey || null,
    statusLabelRu: statusLabels.ru,
    statusLabelEn: statusLabels.en,
    timingLabelRu: timingLabels?.ru ?? null,
    timingLabelEn: timingLabels?.en ?? null,
    blocked: Boolean(spike?.blocked),
    spikeBlockers: Array.isArray(spike?.blockers) ? spike.blockers : [],
    dataQuality: spike ? 'INFERRED' : 'UNAVAILABLE',
    available: Boolean(spike)
  };
}
