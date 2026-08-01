import { diagnoseJsonlRecording } from '/packages/core/src/recording.mjs';

const elements = Object.fromEntries([
  'fileInput', 'sampleButton', 'exportButton', 'fileName', 'summaryGrid', 'featureLegend',
  'featureRows', 'issueFilter', 'issueList', 'searchInput', 'mappingFilter', 'mappingRows', 'pipelineResult'
].map((id) => [id, document.getElementById(id)]));

let currentReport = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatTime(timestamp, base) {
  if (!Number.isFinite(timestamp)) return '—';
  const relative = Number.isFinite(base) ? timestamp - base : timestamp;
  return `+${(relative / 1000).toFixed(2)}s`;
}

function card(label, value) {
  return `<article class="summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function renderSummary(report) {
  const { recording, summary, featureHealth, pipeline } = report;
  elements.summaryGrid.innerHTML = [
    card('JSONL records', `${recording.parsedRecordCount}/${recording.lineCount}`),
    card('Canonical events', summary.canonicalEventCount),
    card('Unmapped', summary.ignoredMappingCount),
    card('Issues', summary.issueCount),
    card('Active features', featureHealth.summary.active),
    card('Final macro', pipeline.decision.action)
  ].join('');
}

function renderFeatures(report) {
  const health = report.featureHealth;
  elements.featureLegend.innerHTML = [
    `<span class="pill active">ACTIVE ${health.summary.active}</span>`,
    `<span class="pill stale">STALE ${health.summary.stale}</span>`,
    `<span class="pill unseen">UNSEEN ${health.summary.unseen}</span>`,
    `<span class="pill unexpected">UNEXPECTED ${health.summary.unexpected}</span>`
  ].join('');
  elements.featureRows.innerHTML = health.features.map((feature) => `
    <tr>
      <td><span class="pill ${feature.status.toLowerCase()}">${feature.status}</span></td>
      <td>${escapeHtml(feature.name)}</td>
      <td>${feature.count}</td>
      <td>${feature.ageMs === null ? '—' : `${feature.ageMs}ms ago`}</td>
      <td>${feature.expected ? 'yes' : '<span class="pill unexpected">no</span>'}</td>
    </tr>
  `).join('');
}

function renderIssues() {
  if (!currentReport) return;
  const filter = elements.issueFilter.value;
  const issues = currentReport.issues.filter((issue) => filter === 'all' || issue.code === filter);
  elements.issueList.innerHTML = issues.length ? issues.map((issue) => `
    <article class="issue">
      <strong>${escapeHtml(issue.code)}</strong>
      <span>${escapeHtml(issue.message)}</span>
    </article>
  `).join('') : '<div class="empty">Нет проблем в выбранной категории.</div>';
}

function renderMappings() {
  if (!currentReport) return;
  const filter = elements.mappingFilter.value;
  const query = elements.searchInput.value.trim().toLowerCase();
  const first = currentReport.summary.firstReceivedAt;
  const mappings = currentReport.mappings.filter((mapping) => {
    if (filter !== 'all' && mapping.status !== filter) return false;
    if (!query) return true;
    return [mapping.envelopeType, mapping.feature, mapping.rawName, mapping.canonicalType, mapping.reason]
      .some((value) => String(value ?? '').toLowerCase().includes(query));
  });
  elements.mappingRows.innerHTML = mappings.length ? mappings.map((mapping) => `
    <tr>
      <td>${mapping.sequence}.${mapping.index}</td>
      <td>${formatTime(mapping.receivedAt, first)}</td>
      <td>${escapeHtml(mapping.envelopeType)}</td>
      <td>${escapeHtml(mapping.rawName ?? mapping.feature ?? '—')}</td>
      <td><span class="pill ${escapeHtml(mapping.status)}">${escapeHtml(mapping.status.toUpperCase())}</span></td>
      <td>${escapeHtml(mapping.canonicalType ?? '—')}</td>
      <td class="details">${escapeHtml(mapping.reason ?? JSON.stringify(mapping.canonicalEvent?.payload ?? {}))}</td>
    </tr>
  `).join('') : '<tr><td colspan="7" class="empty">Ничего не найдено.</td></tr>';
}

function renderPipeline(report) {
  const { state, decision, decisionHistory, eventCount } = report.pipeline;
  elements.pipelineResult.textContent = JSON.stringify({
    eventCount,
    state: {
      phase: state.phase,
      matchId: state.matchId,
      hero: state.hero,
      gameTimeSec: state.gameTimeSec,
      level: state.level,
      gold: state.gold,
      gpm: state.gpm,
      inventory: state.inventory.map((item) => item.id),
      targetItem: state.targetItem?.id ?? null,
      warnings: state.diagnostics.warnings
    },
    decision: {
      action: decision.action,
      confidence: decision.confidence,
      reasons: decision.reasons,
      powerStatus: decision.powerState.status
    },
    decisionHistory
  }, null, 2);
}

function render(report) {
  currentReport = report;
  renderSummary(report);
  renderFeatures(report);
  renderIssues();
  renderMappings();
  renderPipeline(report);
  elements.exportButton.disabled = false;
}

function analyze(text, name) {
  const report = diagnoseJsonlRecording(text, {
    staleAfterMs: 5000,
    gapThresholdMs: 5000,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  elements.fileName.textContent = name;
  render(report);
}

elements.fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  analyze(await file.text(), file.name);
});

elements.sampleButton.addEventListener('click', async () => {
  const response = await fetch('/fixtures/recordings/sample-gep-session.jsonl');
  if (!response.ok) throw new Error(`Sample load failed: ${response.status}`);
  analyze(await response.text(), 'sample-gep-session.jsonl');
});

elements.exportButton.addEventListener('click', () => {
  if (!currentReport) return;
  const blob = new Blob([`${JSON.stringify(currentReport, null, 2)}\n`], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'dota-flow-diagnostics-report.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

elements.issueFilter.addEventListener('change', renderIssues);
elements.mappingFilter.addEventListener('change', renderMappings);
elements.searchInput.addEventListener('input', renderMappings);
