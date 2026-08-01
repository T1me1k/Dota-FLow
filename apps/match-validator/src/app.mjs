import { MATCH_VALIDATION_PROFILES, validateJsonlRecording } from '/packages/core/src/index.mjs';

const ids = ['fileInput','sampleButton','exportButton','fileName','gateStatus','gateMessage','summaryGrid','signalRows','blockerList','contractRows','calibrationResult'];
const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
let currentReport = null;

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}
function card(label, value) { return `<article class="summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`; }
function mapText(value) { return Object.entries(value ?? {}).map(([key,count]) => `${key}:${count}`).join(', ') || '—'; }

function render(report) {
  currentReport = report;
  const statusClass = report.status.toLowerCase();
  elements.gateStatus.className = `gate-status ${statusClass}`;
  elements.gateStatus.textContent = report.status;
  elements.gateMessage.textContent = report.blockers.length
    ? report.blockers.map((item) => item.label).join(' · ')
    : report.status === 'PASS_WITH_WARNINGS' ? 'Обязательные сигналы готовы; остались необязательные сценарии.' : 'Recording готов к калибровке.';
  elements.summaryGrid.innerHTML = [
    card('Required', `${report.summary.passedRequiredSignalCount}/${report.summary.requiredSignalCount}`),
    card('Score', `${Math.round(report.score * 100)}%`),
    card('Matches', report.summary.matchCount),
    card('Heroes', report.calibration.heroes.length),
    card('Contracts', report.contracts.length),
    card('Issues', report.diagnostics.summary.issueCount)
  ].join('');
  elements.signalRows.innerHTML = report.signals.map((signal) => {
    const state = signal.pass ? 'pass' : signal.required ? 'fail' : 'miss';
    return `<tr><td><span class="pill ${state}">${signal.pass ? 'PASS' : signal.required ? 'FAIL' : 'MISS'}</span></td><td>${escapeHtml(signal.label)}</td><td>${signal.required ? 'required' : 'optional'}</td><td class="details">${escapeHtml(signal.message)}<br>${escapeHtml(JSON.stringify(signal.evidence))}</td></tr>`;
  }).join('');
  const blockers = report.blockers.length ? report.blockers : report.warnings;
  elements.blockerList.innerHTML = blockers.length ? blockers.map((item) => `<article class="issue"><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.message)}</span></article>`).join('') : '<div class="empty">Блокеров нет.</div>';
  elements.contractRows.innerHTML = report.contracts.map((contract) => `<tr><td>${escapeHtml(contract.feature)}</td><td>${contract.count}</td><td>${escapeHtml(contract.envelopeTypes.join(', '))}</td><td>${escapeHtml(mapText(contract.rawKinds))}</td><td>${escapeHtml(mapText(contract.parsedKinds))}</td><td class="details">${escapeHtml(contract.keys.map((key) => `${key.name}:${Object.keys(key.types).join('|')}`).join(', ') || '—')}</td><td>${contract.frequency.averageIntervalMs ?? '—'}ms</td></tr>`).join('');
  elements.calibrationResult.textContent = JSON.stringify(report.calibration, null, 2);
  elements.exportButton.disabled = false;
}

function analyze(text, name) {
  elements.fileName.textContent = name;
  render(validateJsonlRecording(text, {
    profile: MATCH_VALIDATION_PROFILES.RELEASE,
    staleAfterMs: 15000,
    gapThresholdMs: 15000,
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  }));
}

elements.fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (file) analyze(await file.text(), file.name);
});
elements.sampleButton.addEventListener('click', async () => {
  const response = await fetch('/fixtures/recordings/real-match-validation-session.jsonl');
  if (!response.ok) throw new Error(`Sample load failed: ${response.status}`);
  analyze(await response.text(), 'real-match-validation-session.jsonl');
});
elements.exportButton.addEventListener('click', () => {
  if (!currentReport) return;
  const blob = new Blob([`${JSON.stringify(currentReport, null, 2)}\n`], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'dota-flow-validation-report.json';
  link.click();
  URL.revokeObjectURL(link.href);
});
