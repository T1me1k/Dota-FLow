import { GAME_EVENT_TYPES, LiveGepBridge, createCoachEventEnvelope, parseJsonl, roleContextSummary } from '/packages/core/src/index.mjs';

const $ = (id) => document.getElementById(id);
const elements = Object.fromEntries([
  'startButton', 'stepButton', 'pauseButton', 'resetButton', 'sourceLabel', 'connectionState',
  'connectionMessage', 'sessionLabel', 'summaryGrid', 'decisionAction', 'decisionConfidence',
  'decisionReasons', 'roleAction', 'roleMessage', 'roleContextBadge', 'roleLimitations', 'roleContextSummary', 'roleSignalList', 'stateGrid', 'featureSummary', 'featureList', 'issueList', 'bridgeEventList', 'archiveList',
  'overlayMode', 'hideLowConfidence', 'showOverlayButton', 'hideOverlayButton',
  'startCaptureButton', 'stopCaptureButton', 'openCapturesButton', 'captureLabel',
  'manualContextStatus', 'manualShortcutHelp', 'bottleRuneSelect', 'laneTargetSelect',
  'voiceCoachToggle', 'voiceCueLabel', 'coachTimerList', 'counterItemList', 'startRoshanTimer', 'startAegisTimer', 'clearCoachTimers'
].map((id) => [id, $(id)]));

let bridge = createBridge();
let records = [];
let cursor = 0;
let timer = null;
let electronMode = Boolean(window.dotaFlow?.onLiveSnapshot);
let lastVoiceCueKey = null;
let lastRenderedSnapshot = null;
const VOICE_STORAGE_KEY = 'dota-flow.voice-coach.v1';


const OVERLAY_STORAGE_KEY = 'dota-flow.overlay-settings.v1';

function readBrowserOverlaySettings() {
  try {
    const value = JSON.parse(localStorage.getItem(OVERLAY_STORAGE_KEY) ?? '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function renderOverlaySettings(settings = {}) {
  elements.overlayMode.value = settings.mode === 'EXPANDED' ? 'EXPANDED' : 'COMPACT';
  elements.hideLowConfidence.checked = Boolean(settings.hideLowConfidence);
}

async function updateOverlaySettings(patch) {
  if (electronMode) {
    const settings = await window.dotaFlow.setOverlaySettings(patch);
    renderOverlaySettings(settings);
    return;
  }
  const settings = { ...readBrowserOverlaySettings(), ...patch };
  localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(settings));
  renderOverlaySettings(settings);
}



function voiceEnabled() {
  return elements.voiceCoachToggle.checked;
}

function speakVoiceCue(cue) {
  elements.voiceCueLabel.textContent = cue?.text ?? 'Voice idle';
  if (!voiceEnabled() || !cue || cue.key === lastVoiceCueKey || !('speechSynthesis' in window)) return;
  lastVoiceCueKey = cue.key;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cue.text);
  utterance.lang = 'ru-RU';
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
}

async function applyCoachEvent(eventType, payload = {}) {
  if (electronMode) return window.dotaFlow.applyCoachEvent(eventType, payload);
  const current = bridge.snapshot();
  const gameTimeSec = current.diagnostics?.pipeline?.state?.gameTimeSec ?? 0;
  return bridge.ingestEnvelope(createCoachEventEnvelope(eventType, payload, { gameTimeSec }));
}

function renderCaptureStatus(status = {}) {
  const state = status?.state ?? 'IDLE';
  const count = status?.envelopeCount ?? 0;
  elements.captureLabel.textContent = `Capture: ${state} · ${count} envelopes${status?.captureId ? ` · ${status.captureId}` : ''}`;
  elements.startCaptureButton.disabled = !electronMode || state === 'RECORDING';
  elements.stopCaptureButton.disabled = !electronMode || state !== 'RECORDING';
  elements.openCapturesButton.disabled = !electronMode;
}

function createBridge() {
  return new LiveGepBridge({
    staleAfterMs: 5000,
    gapThresholdMs: 5000,
    connectionStaleAfterMs: 5000,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatClock(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

function card(label, value) {
  return `<article class="summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function listRows(rows, emptyText) {
  return rows.length ? rows.join('') : `<div class="empty">${escapeHtml(emptyText)}</div>`;
}

function render(snapshot) {
  lastRenderedSnapshot = snapshot;
  const { bridge: bridgeState, diagnostics, archives, bridgeEvents } = snapshot;
  const { state, decision, roleDecision } = diagnostics.pipeline;
  const stateClass = bridgeState.state.toLowerCase();
  elements.connectionState.className = `state ${stateClass}`;
  elements.connectionState.textContent = bridgeState.state;
  elements.connectionMessage.textContent = bridgeState.message;
  elements.sessionLabel.textContent = `${bridgeState.session.id} · generation ${bridgeState.session.generation}`;
  const lastManual = bridgeEvents.slice().reverse().find((event) => event.code === 'MANUAL_CONTEXT_APPLIED');
  elements.manualContextStatus.textContent = lastManual ? `${lastManual.message} · ${formatClock(state.gameTimeSec)}` : 'Нет ручных отметок';

  elements.summaryGrid.innerHTML = [
    card('Received', bridgeState.receivedEnvelopeCount),
    card('Forwarded', bridgeState.forwardedEnvelopeCount),
    card('Duplicates', bridgeState.duplicateEnvelopeCount),
    card('Manual', bridgeState.manualEnvelopeCount ?? 0),
    card('Coach', bridgeState.coachEnvelopeCount ?? 0),
    card('Canonical', diagnostics.summary.canonicalEventCount),
    card('Issues', diagnostics.summary.issueCount),
    card('Archives', bridgeState.session.archiveCount)
  ].join('');

  elements.decisionAction.textContent = decision.action;
  elements.decisionConfidence.textContent = `${Math.round(decision.confidence * 100)}% confidence · ${decision.profile?.calibrationTier ?? 'DETAILED'}`;
  elements.decisionReasons.innerHTML = decision.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('');
  elements.roleAction.textContent = `${roleDecision?.action ?? 'WAIT'} · ${Math.round((roleDecision?.confidence ?? 1) * 100)}%`;
  elements.roleMessage.textContent = roleDecision?.message ?? 'Role Engine waiting';
  const roleContext = roleContextSummary(state.roleContext);
  const qualityClass = roleContext.quality.toLowerCase();
  elements.roleContextBadge.className = `context-badge ${qualityClass}`;
  elements.roleContextBadge.textContent = `CONTEXT ${roleContext.quality} · ${Math.round(roleContext.coverage * 100)}%`;
  elements.roleLimitations.textContent = roleDecision?.dataLimited
    ? `Ограничено данными: ${(roleDecision.missingSignals ?? roleContext.missingSignals).slice(0, 4).join(', ') || 'неполный live context'}`
    : 'Ролевое решение подтверждено доступным контекстом.';
  elements.roleContextSummary.innerHTML = `<span class="pill active">${Math.round(roleContext.liveCoverage * 100)}% LIVE</span> <span class="pill ${qualityClass}">${roleContext.quality}</span>`;
  elements.roleSignalList.innerHTML = Object.entries(roleContext.signals).map(([name, signal]) => `
    <div class="signal-card"><span class="pill ${String(signal.status).toLowerCase()}">${escapeHtml(signal.status)}</span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(signal.source ?? 'not observed')}</small></div>
  `).join('');

  const normalized = {
    Match: state.matchId ?? '—',
    Phase: state.phase,
    Hero: state.hero,
    Role: state.role,
    Time: formatClock(state.gameTimeSec),
    Level: state.level,
    Gold: state.gold,
    GPM: state.gpm,
    HP: `${state.health}/${state.maxHealth}`,
    Target: state.targetItem?.name ?? 'build complete',
    Inventory: state.inventory.map((item) => item.name ?? item.id).join(', ') || 'empty'
  };
  elements.stateGrid.innerHTML = Object.entries(normalized)
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('');

  const featureHealth = diagnostics.featureHealth;
  elements.featureSummary.innerHTML = `<span class="pill active">${featureHealth.summary.active} ACTIVE</span> <span class="pill stale">${featureHealth.summary.stale} STALE</span>`;
  const visibleFeatures = featureHealth.features
    .filter((feature) => feature.status !== 'UNSEEN' || feature.requested)
    .slice(0, 12);
  elements.featureList.innerHTML = listRows(visibleFeatures.map((feature) => `
    <div class="list-row"><span class="pill ${feature.status.toLowerCase()}">${feature.status}</span><strong>${escapeHtml(feature.name)}</strong><span>${feature.count} envelopes · ${feature.ageMs ?? '—'}ms ago</span></div>
  `), 'Feature events пока не получены.');

  elements.issueList.innerHTML = listRows(diagnostics.issues.slice(-10).reverse().map((issue) => `
    <div class="list-row"><span>${escapeHtml(issue.code)}</span><strong>${escapeHtml(issue.feature ?? issue.canonicalType ?? 'pipeline')}</strong><span>${escapeHtml(issue.message)}</span></div>
  `), 'Текущая session без проблем.');

  elements.bridgeEventList.innerHTML = listRows(bridgeEvents.slice(-14).reverse().map((event) => `
    <div class="event-row"><span>${escapeHtml(event.at ?? '—')}</span><strong>${escapeHtml(event.code)}</strong><span>${escapeHtml(event.message ?? event.reason ?? `${event.previousState ?? ''} ${event.state ?? ''}`)}</span></div>
  `), 'Bridge lifecycle events пока отсутствуют.');


  const coach = diagnostics.pipeline.coach;
  const allTimers = [...(coach?.timers?.periodic ?? []), ...(coach?.timers?.tracked ?? [])];
  elements.coachTimerList.innerHTML = listRows(allTimers.slice(0, 8).map((timer) => `
    <div class="list-row"><span class="pill ${String(timer.status).toLowerCase()}">${escapeHtml(timer.status)}</span><strong>${escapeHtml(timer.label)}</strong><span>${timer.status === 'READY' ? 'ready' : `${Math.ceil(timer.remainingSec ?? 0)} sec`}</span></div>
  `), 'Таймеры появятся после старта матча.');
  const adaptivePlan = coach?.adaptiveBuild?.recommendedPlan;
  const counterRows = [
    ...(adaptivePlan ? [`<div class="list-row"><span class="pill active">BUILD</span><strong>${escapeHtml(adaptivePlan.name)}</strong><span>${escapeHtml(adaptivePlan.reasons?.[0] ?? 'Adaptive plan')}</span></div>`] : []),
    ...(coach?.counterItems?.recommendations ?? []).map((item) => `<div class="list-row"><span>#${item.priority}</span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.reasons?.[0] ?? 'Draft adaptation')}</span></div>`)
  ];
  elements.counterItemList.innerHTML = listRows(counterRows, 'Для adaptive build и counter-items нужен полный draft.');
  speakVoiceCue(coach?.voiceCue ?? null);

  elements.archiveList.innerHTML = listRows(archives.slice().reverse().map((archive) => `
    <div class="list-row"><span>${escapeHtml(archive.matchId ?? archive.id)}</span><strong>${escapeHtml(archive.finalDecision.action)}</strong><span>${archive.summary.envelopeCount} envelopes · ${archive.finalState.hero} · ${formatClock(archive.finalState.gameTimeSec)}</span></div>
  `), 'Предыдущих match-сессий пока нет.');
}

async function applyManualContext(command) {
  if (!command) return;
  const snapshot = electronMode
    ? await window.dotaFlow.applyManualContext(command)
    : bridge.ingestManualContext(command);
  render(snapshot);
  elements.bottleRuneSelect.value = '';
  elements.laneTargetSelect.value = '';
}

document.querySelectorAll('[data-manual-command]').forEach((button) => {
  button.addEventListener('click', () => void applyManualContext(button.dataset.manualCommand));
});
elements.bottleRuneSelect.addEventListener('change', () => void applyManualContext(elements.bottleRuneSelect.value));
elements.laneTargetSelect.addEventListener('change', () => void applyManualContext(elements.laneTargetSelect.value));

async function loadSample() {
  if (records.length) return;
  const response = await fetch('/fixtures/recordings/live-bridge-session.jsonl');
  if (!response.ok) throw new Error(`Sample load failed: ${response.status}`);
  const parsed = parseJsonl(await response.text());
  records = parsed.records.map((record) => record.value);
}

async function step() {
  if (electronMode) return;
  await loadSample();
  if (cursor >= records.length) {
    pause();
    return;
  }
  render(bridge.ingestEnvelope(records[cursor]));
  cursor += 1;
  if (cursor >= records.length) pause();
}

async function start() {
  if (electronMode || timer) return;
  await loadSample();
  timer = setInterval(() => void step(), 420);
  elements.startButton.disabled = true;
}

function pause() {
  clearInterval(timer);
  timer = null;
  elements.startButton.disabled = electronMode;
}

async function reset() {
  pause();
  cursor = 0;
  if (electronMode) {
    render(await window.dotaFlow.resetLiveSession());
    return;
  }
  bridge = createBridge();
  render(bridge.snapshot());
}

elements.startButton.addEventListener('click', () => void start());
elements.stepButton.addEventListener('click', () => void step());
elements.pauseButton.addEventListener('click', pause);
elements.resetButton.addEventListener('click', () => void reset());

elements.overlayMode.addEventListener('change', () => {
  void updateOverlaySettings({ mode: elements.overlayMode.value });
});
elements.hideLowConfidence.addEventListener('change', () => {
  void updateOverlaySettings({ hideLowConfidence: elements.hideLowConfidence.checked });
});
elements.showOverlayButton.addEventListener('click', () => {
  if (electronMode) void window.dotaFlow.showOverlay();
  else window.open('/overlay', 'dota-flow-overlay-preview', 'width=480,height=210');
});
elements.hideOverlayButton.addEventListener('click', () => {
  if (electronMode) void window.dotaFlow.hideOverlay();
});
elements.startCaptureButton.addEventListener('click', async () => {
  if (electronMode) renderCaptureStatus(await window.dotaFlow.startCapture());
});
elements.stopCaptureButton.addEventListener('click', async () => {
  if (electronMode) renderCaptureStatus(await window.dotaFlow.stopCapture());
});
elements.openCapturesButton.addEventListener('click', () => {
  if (electronMode) void window.dotaFlow.openRecordingsFolder();
});


elements.voiceCoachToggle.checked = localStorage.getItem(VOICE_STORAGE_KEY) === 'true';
elements.voiceCoachToggle.addEventListener('change', () => {
  localStorage.setItem(VOICE_STORAGE_KEY, String(elements.voiceCoachToggle.checked));
  if (!elements.voiceCoachToggle.checked && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  if (lastRenderedSnapshot) render(lastRenderedSnapshot);
});
elements.startRoshanTimer.addEventListener('click', async () => {
  render(await applyCoachEvent(GAME_EVENT_TYPES.COACH_TIMER_STARTED, { kind: 'ROSHAN', label: 'Roshan respawn' }));
});
elements.startAegisTimer.addEventListener('click', async () => {
  render(await applyCoachEvent(GAME_EVENT_TYPES.COACH_TIMER_STARTED, { kind: 'AEGIS', label: 'Aegis expires' }));
});
elements.clearCoachTimers.addEventListener('click', async () => {
  const timers = lastRenderedSnapshot?.diagnostics?.pipeline?.state?.coachContext?.timers ?? [];
  let snapshot = lastRenderedSnapshot ?? bridge.snapshot();
  for (const timer of timers) {
    snapshot = await applyCoachEvent(GAME_EVENT_TYPES.COACH_TIMER_CLEARED, { id: timer.id });
  }
  render(snapshot);
});

if (electronMode) {
  elements.sourceLabel.textContent = 'Источник: Overwolf Electron IPC';
  elements.startButton.disabled = true;
  elements.stepButton.disabled = true;
  elements.pauseButton.disabled = true;
  window.dotaFlow.onOverlaySettings(renderOverlaySettings);
  window.dotaFlow.onCaptureStatus(renderCaptureStatus);
  renderOverlaySettings(await window.dotaFlow.getOverlaySettings());
  renderCaptureStatus(await window.dotaFlow.getCaptureStatus());
  const shortcuts = await window.dotaFlow.getManualContextShortcuts();
  elements.manualShortcutHelp.textContent = `Electron shortcuts: ${Object.entries(shortcuts).map(([key, command]) => `${key} → ${command}`).join(' · ')}`;
  window.dotaFlow.onLiveSnapshot(render);
  render(await window.dotaFlow.getLiveSnapshot());
} else {
  elements.hideOverlayButton.disabled = true;
  renderCaptureStatus();
  renderOverlaySettings(readBrowserOverlaySettings());
  render(bridge.snapshot());
}
