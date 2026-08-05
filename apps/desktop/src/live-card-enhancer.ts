import type { RuntimeSnapshot } from './runtime/provider';
import './live-card-enhancer.css';

const RUNTIME_SNAPSHOT_EVENT = 'dota-flow:runtime-snapshot';
const POWER_LABELS = new Set(['Power spike', 'Пик силы', 'Active power spike', 'Активный пик силы']);
const BUILD_LABELS = new Set(['Adaptive build', 'Адаптивный билд']);
let latestSnapshot: RuntimeSnapshot | null = null;
let renderQueued = false;

function language(): 'ru' | 'en' {
  return document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'ru';
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function localized(source: unknown, base: string, fallback: unknown = ''): string {
  const data = record(source);
  const suffix = language() === 'ru' ? 'Ru' : 'En';
  return String(data[`${base}${suffix}`] ?? fallback ?? '').trim();
}

function localizedArray(source: unknown, base: string): string[] {
  const data = record(source);
  const suffix = language() === 'ru' ? 'Ru' : 'En';
  const value = data[`${base}${suffix}`];
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function setText(element: Element | null, value: string): void {
  if (element && element.textContent !== value) element.textContent = value;
}

function ensureElement<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  selector: string,
  className: string
): HTMLElementTagNameMap[K] {
  const existing = parent.querySelector<HTMLElementTagNameMap[K]>(selector);
  if (existing) return existing;
  const created = document.createElement(tag);
  created.className = className;
  parent.append(created);
  return created;
}

function cardByKicker(scope: string, labels: Set<string>): HTMLElement | null {
  for (const card of document.querySelectorAll<HTMLElement>(scope)) {
    const kicker = card.querySelector<HTMLElement>('.kicker')?.textContent?.trim() ?? '';
    if (labels.has(kicker)) return card;
  }
  return null;
}

function statusTone(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'ACTIVE') return 'green';
  if (normalized === 'APPROACHING' || normalized === 'FADING') return 'orange';
  return 'muted';
}

function timingSummary(power: Record<string, unknown>): string {
  const expected = Number(power.expectedMinute);
  const delta = Number(power.timingDeltaSec);
  const labels = language() === 'ru'
    ? { benchmark: 'ориентир', early: 'раньше', late: 'позже' }
    : { benchmark: 'benchmark', early: 'early', late: 'late' };
  const parts: string[] = [];
  if (Number.isFinite(expected)) parts.push(`${labels.benchmark}: ${expected} мин`);
  if (Number.isFinite(delta) && delta !== 0) {
    const absolute = Math.abs(delta);
    const formatted = absolute >= 60 ? `${Math.round(absolute / 60)} мин` : `${absolute} сек`;
    parts.push(`${delta < 0 ? labels.early : labels.late}: ${formatted}`);
  }
  return parts.join(' · ');
}

function renderPowerCard(card: HTMLElement, snapshot: RuntimeSnapshot): void {
  const power = record(snapshot.powerSpike);
  const name = localized(power, 'name', power.name);
  const status = String(power.status ?? 'NONE');
  setText(card.querySelector('h3'), name || (language() === 'ru' ? 'Нет подтверждённого пика' : 'No confirmed spike'));

  const details = ensureElement(card, 'div', '[data-live-power-details]', 'live-power-details');
  details.dataset.livePowerDetails = 'true';
  const statusRow = ensureElement(details, 'div', '[data-live-power-status-row]', 'live-power-status-row');
  statusRow.dataset.livePowerStatusRow = 'true';
  const badge = ensureElement(statusRow, 'span', '[data-live-power-status]', `badge ${statusTone(status)}`);
  badge.dataset.livePowerStatus = 'true';
  badge.className = `badge ${statusTone(status)}`;
  setText(badge, localized(power, 'statusLabel', status));
  const timing = ensureElement(statusRow, 'small', '[data-live-power-timing]', 'live-power-timing');
  timing.dataset.livePowerTiming = 'true';
  setText(timing, timingSummary(power));

  const detail = ensureElement(details, 'p', '[data-live-power-detail]', 'live-power-detail');
  detail.dataset.livePowerDetail = 'true';
  setText(detail, localized(power, 'statusDetail'));
  const recommendation = ensureElement(details, 'p', '[data-live-power-recommendation]', 'live-power-recommendation');
  recommendation.dataset.livePowerRecommendation = 'true';
  setText(recommendation, localized(power, 'recommendation', power.recommendation));

  const blockers = localizedArray(power, 'spikeBlockers');
  const list = ensureElement(details, 'ul', '[data-live-power-blockers]', 'live-power-blockers');
  list.dataset.livePowerBlockers = 'true';
  const signature = blockers.join('\n');
  if (list.dataset.signature !== signature) {
    list.dataset.signature = signature;
    list.replaceChildren(...blockers.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  }
  list.hidden = blockers.length === 0;
}

function renderBuildCard(card: HTMLElement, snapshot: RuntimeSnapshot): void {
  const build = record(snapshot.adaptiveBuild);
  const nextItem = String(build.nextItem ?? '').trim();
  setText(card.querySelector('h3'), nextItem || (language() === 'ru' ? 'Следующий предмет не подтверждён' : 'Next item is not confirmed'));
  const plan = card.querySelector('span');
  setText(plan, localized(build, 'activePlan', build.activePlan));
  const reason = ensureElement(card, 'p', '[data-live-build-reason]', 'live-build-reason');
  reason.dataset.liveBuildReason = 'true';
  setText(reason, localized(build, 'nextItemReason', build.nextItemReason));
  const quality = ensureElement(card, 'small', '[data-live-build-quality]', 'live-build-quality');
  quality.dataset.liveBuildQuality = 'true';
  const qualityValue = String(build.dataQuality ?? 'UNAVAILABLE').toUpperCase();
  setText(quality, language() === 'ru' ? `Источник: ${qualityValue}` : `Source: ${qualityValue}`);
}

function render(): void {
  renderQueued = false;
  const snapshot = latestSnapshot;
  if (!snapshot) return;
  const livePower = cardByKicker('.live-layout .stack > .card', POWER_LABELS);
  if (livePower) renderPowerCard(livePower, snapshot);
  const dashboardPower = cardByKicker('.dashboard-grid > .card', POWER_LABELS);
  if (dashboardPower) setText(dashboardPower.querySelector('h3'), localized(snapshot.powerSpike, 'name', record(snapshot.powerSpike).name));
  const build = cardByKicker('.live-layout .stack > .card', BUILD_LABELS);
  if (build) renderBuildCard(build, snapshot);
}

function scheduleRender(): void {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(render);
}

window.addEventListener(RUNTIME_SNAPSHOT_EVENT, (event) => {
  latestSnapshot = (event as CustomEvent<RuntimeSnapshot>).detail;
  scheduleRender();
});

const observer = new MutationObserver(scheduleRender);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'], childList: true, subtree: true });
