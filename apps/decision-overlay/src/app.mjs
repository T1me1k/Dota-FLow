import {
  DecisionOverlayController,
  LiveGepBridge,
  OVERLAY_MODES,
  OVERLAY_VIEW_STATES,
  parseJsonl
} from '/packages/core/src/index.mjs';

const STORAGE_KEY = 'dota-flow.overlay-settings.v1';
const elements = {
  overlay: document.getElementById('overlay'),
  connectionBadge: document.getElementById('connectionBadge'),
  clock: document.getElementById('clock'),
  decisionContent: document.getElementById('decisionContent'),
  actionKicker: document.getElementById('actionKicker'),
  actionLabel: document.getElementById('actionLabel'),
  confidence: document.getElementById('confidence'),
  instruction: document.getElementById('instruction'),
  reason: document.getElementById('reason'),
  heroLabel: document.getElementById('heroLabel'),
  powerLabel: document.getElementById('powerLabel'),
  targetLabel: document.getElementById('targetLabel'),
  statusContent: document.getElementById('statusContent'),
  statusLabel: document.getElementById('statusLabel'),
  statusMessage: document.getElementById('statusMessage')
};

function loadSettings() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    stored = {};
  }
  const params = new URLSearchParams(location.search);
  if (params.get('mode') === 'expanded') stored.mode = OVERLAY_MODES.EXPANDED;
  if (params.get('mode') === 'compact') stored.mode = OVERLAY_MODES.COMPACT;
  return stored;
}

const controller = new DecisionOverlayController({ settings: loadSettings() });
const electronMode = Boolean(window.dotaFlow?.onLiveSnapshot);
let lastVisibility = null;


function applySettings(settings) {
  const next = controller.updateSettings(settings && typeof settings === 'object' ? settings : {});
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.settings));
  } catch {
    // Storage is optional inside hardened renderer contexts.
  }
  render(next);
}

function compactHero(hero) {
  return String(hero ?? 'hero').replaceAll('_', ' ').toUpperCase();
}

function updateWindowVisibility(visible) {
  if (!electronMode || lastVisibility === visible) return;
  lastVisibility = visible;
  const operation = visible ? window.dotaFlow.showOverlay() : window.dotaFlow.hideOverlay();
  void operation.catch(() => {});
}

function render(model) {
  const overlay = elements.overlay;
  overlay.className = [
    'overlay',
    model.visible ? '' : 'is-hidden',
    `tone-${model.tone ?? 'neutral'}`,
    model.mode === OVERLAY_MODES.EXPANDED ? 'mode-expanded' : 'mode-compact',
    model.changed ? 'is-changed' : '',
    model.degraded ? 'is-degraded' : '',
    model.lowConfidence ? 'is-low-confidence' : ''
  ].filter(Boolean).join(' ');

  updateWindowVisibility(model.visible);
  if (!model.visible) return;

  const statusOnly = model.action === null;
  elements.decisionContent.hidden = statusOnly;
  elements.statusContent.hidden = !statusOnly;
  elements.clock.textContent = model.gameClock ?? '00:00';
  elements.connectionBadge.textContent = model.connectionState ?? 'LIVE';

  if (statusOnly) {
    elements.statusLabel.textContent = model.statusLabel ?? 'LIVE SIGNAL';
    elements.statusMessage.textContent = model.statusMessage ?? model.connectionMessage ?? '';
    return;
  }

  elements.actionKicker.textContent = model.baselineProfile
    ? 'BASELINE PROFILE'
    : model.viewState === OVERLAY_VIEW_STATES.LOW_CONFIDENCE
      ? 'LOW CONFIDENCE CALL'
      : model.viewState === OVERLAY_VIEW_STATES.DEGRADED
        ? 'DEGRADED LIVE CALL'
        : 'MACRO CALL';
  elements.actionLabel.textContent = model.label;
  elements.confidence.textContent = `${model.confidencePct}%`;
  elements.instruction.textContent = model.instruction;
  elements.reason.textContent = model.reasons.join(' · ');
  elements.reason.hidden = model.reasons.length === 0;
  elements.heroLabel.textContent = compactHero(model.hero);
  elements.powerLabel.textContent = model.spikeLabel
    ? `${model.powerStatus}: ${model.spikeLabel}`
    : `POWER: ${model.powerStatus}`;
  elements.targetLabel.textContent = model.baselineProfile
    ? 'BUILD: NOT CALIBRATED'
    : model.targetItem
      ? `${model.targetItem}${model.targetRemainingGold === null ? '' : ` · ${model.targetRemainingGold}g`}`
      : 'BUILD COMPLETE';
}

function consume(snapshot) {
  render(controller.ingest(snapshot));
}

async function startBrowserPreview() {
  const response = await fetch('/fixtures/recordings/live-bridge-session.jsonl');
  if (!response.ok) throw new Error(`Overlay sample load failed: ${response.status}`);
  const parsed = parseJsonl(await response.text());
  const records = parsed.records.map((record) => record.value);
  const bridge = new LiveGepBridge({
    staleAfterMs: 5000,
    gapThresholdMs: 5000,
    connectionStaleAfterMs: 5000,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  if (new URLSearchParams(location.search).has('static')) {
    let snapshot = bridge.snapshot();
    for (const record of records) snapshot = bridge.ingestEnvelope(record);
    consume(snapshot);
    return;
  }

  let cursor = 0;
  const tick = () => {
    if (cursor >= records.length) {
      bridge.reset({ archive: false, reason: 'BROWSER_PREVIEW_LOOP' });
      controller.reset();
      cursor = 0;
    }
    consume(bridge.ingestEnvelope(records[cursor]));
    cursor += 1;
  };
  tick();
  setInterval(tick, 720);
}

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    applySettings(JSON.parse(event.newValue));
  } catch {
    // Ignore malformed settings written by another preview tab.
  }
});

if (electronMode) {
  window.dotaFlow.onOverlaySettings(applySettings);
  applySettings(await window.dotaFlow.getOverlaySettings());
  window.dotaFlow.onLiveSnapshot(consume);
  consume(await window.dotaFlow.getLiveSnapshot());
} else {
  await startBrowserPreview();
}
