import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  DecisionOverlayController,
  LiveGepBridge,
  parseJsonl
} from '../packages/core/src/index.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const fileArg = args.find((arg) => !arg.startsWith('--'));
const inputPath = resolve(fileArg ?? 'fixtures/recordings/live-bridge-session.jsonl');
const parsed = parseJsonl(await readFile(inputPath, 'utf8'));
if (parsed.records.length === 0) {
  throw new Error(`No valid GEP envelopes in ${inputPath}`);
}

const bridge = new LiveGepBridge({
  staleAfterMs: 5000,
  gapThresholdMs: 5000,
  connectionStaleAfterMs: 5000,
  coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
});
const controller = new DecisionOverlayController({
  settings: { mode: 'COMPACT', reasonLimit: 1 }
});

const timeline = [];
let previousKey = null;
for (const record of parsed.records) {
  const envelope = record.value;
  const model = controller.ingest(bridge.ingestEnvelope(envelope), envelope.receivedAt);
  const key = `${model.visible}:${model.viewState}:${model.action ?? '—'}:${model.matchId ?? '—'}`;
  if (key !== previousKey) {
    timeline.push({
      at: envelope.receivedAt,
      visible: model.visible,
      viewState: model.viewState,
      action: model.action,
      label: model.label ?? model.statusLabel ?? null,
      confidencePct: model.confidencePct ?? null,
      matchId: model.matchId ?? null,
      hiddenReason: model.hiddenReason ?? null
    });
    previousKey = key;
  }
}

const final = controller.snapshot(parsed.records.at(-1).value.receivedAt);
const report = {
  inputPath,
  parseErrors: parsed.errors,
  envelopeCount: parsed.records.length,
  timeline,
  final
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`\nDota Flow Decision Overlay simulation`);
  console.log('='.repeat(48));
  for (const entry of timeline) {
    const state = entry.visible ? `${entry.label} ${entry.confidencePct ?? ''}%`.trim() : `hidden (${entry.hiddenReason})`;
    console.log(`${String(entry.at).padStart(6)}ms  ${entry.viewState.padEnd(14)} ${state}${entry.matchId ? ` · ${entry.matchId}` : ''}`);
  }
  console.log(`\nFinal: ${final.visible ? `${final.label} (${final.confidencePct}%)` : `hidden (${final.hiddenReason})`}`);
  console.log(`Mode: ${final.mode}; connection: ${final.connectionState}; match: ${final.matchId ?? '—'}`);
}
