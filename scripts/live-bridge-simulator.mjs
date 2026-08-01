import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LiveGepBridge, parseJsonl } from '../packages/core/src/index.mjs';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const paceIndex = args.indexOf('--pace');
const paceMs = paceIndex >= 0 ? Math.max(0, Number(args[paceIndex + 1]) || 0) : 0;
const positional = args.filter((arg, index) => !arg.startsWith('--') && index !== paceIndex + 1);
const inputPath = resolve(projectRoot, positional[0] ?? 'fixtures/recordings/live-bridge-session.jsonl');

const text = await readFile(inputPath, 'utf8');
const parsed = parseJsonl(text);
if (parsed.errors.length) {
  console.error(`JSONL parse errors: ${parsed.errors.length}`);
  for (const error of parsed.errors) console.error(`  line ${error.lineNumber}: ${error.message}`);
  process.exitCode = 1;
}

const bridge = new LiveGepBridge({
  staleAfterMs: 5000,
  gapThresholdMs: 5000,
  connectionStaleAfterMs: 5000,
  dedupeWindowMs: 30_000,
  coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
});

let previous = bridge.snapshot(parsed.records[0]?.value?.receivedAt ?? Date.now());
for (const record of parsed.records) {
  const before = previous;
  const after = bridge.ingestEnvelope(record.value);
  const at = record.value.receivedAt;
  const stateChanged = before.bridge.state !== after.bridge.state;
  const decisionChanged = before.diagnostics.pipeline.decision.action !== after.diagnostics.pipeline.decision.action;
  const sessionChanged = before.bridge.session.generation !== after.bridge.session.generation;
  const duplicateAdded = after.bridge.duplicateEnvelopeCount > before.bridge.duplicateEnvelopeCount;

  if (!jsonOutput && (stateChanged || decisionChanged || sessionChanged || duplicateAdded)) {
    const markers = [];
    if (stateChanged) markers.push(`${before.bridge.state} → ${after.bridge.state}`);
    if (decisionChanged) markers.push(`macro ${before.diagnostics.pipeline.decision.action} → ${after.diagnostics.pipeline.decision.action}`);
    if (sessionChanged) markers.push(`session ${before.bridge.session.id} → ${after.bridge.session.id}`);
    if (duplicateAdded) markers.push('duplicate suppressed');
    console.log(`${String(at).padStart(6)}ms  ${markers.join(' · ')}`);
  }

  previous = after;
  if (paceMs > 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, paceMs));
}

const final = bridge.snapshot(parsed.records.at(-1)?.value?.receivedAt ?? Date.now());
if (jsonOutput) {
  console.log(JSON.stringify(final, null, 2));
} else {
  console.log('\nDota Flow Live Bridge simulation');
  console.log('='.repeat(48));
  console.log(`Input: ${inputPath}`);
  console.log(`Envelopes: ${final.bridge.receivedEnvelopeCount} received; ${final.bridge.forwardedEnvelopeCount} forwarded; ${final.bridge.duplicateEnvelopeCount} duplicates`);
  console.log(`Connection: ${final.bridge.state}; session: ${final.bridge.session.id}; archives: ${final.bridge.session.archiveCount}`);
  console.log(`Current match: ${final.bridge.activeMatchId ?? 'unknown'}; hero: ${final.diagnostics.pipeline.state.hero}; game time: ${final.diagnostics.pipeline.state.gameTimeSec}s`);
  console.log(`Macro: ${final.diagnostics.pipeline.decision.action} (${Math.round(final.diagnostics.pipeline.decision.confidence * 100)}%)`);
  console.log(`Current issues: ${final.diagnostics.summary.issueCount}; canonical events: ${final.diagnostics.summary.canonicalEventCount}`);
}
