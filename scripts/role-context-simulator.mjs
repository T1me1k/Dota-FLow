import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LiveGepBridge,
  parseJsonl,
  roleContextSummary
} from '../packages/core/src/index.mjs';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const input = args.find((arg) => !arg.startsWith('--')) ?? 'fixtures/recordings/role-context-session.jsonl';
const inputPath = resolve(projectRoot, input);
const parsed = parseJsonl(await readFile(inputPath, 'utf8'));
if (parsed.errors.length) {
  for (const error of parsed.errors) console.error(`line ${error.lineNumber}: ${error.message}`);
  process.exitCode = 1;
}

const bridge = new LiveGepBridge({
  staleAfterMs: 5_000,
  gapThresholdMs: 5_000,
  connectionStaleAfterMs: 5_000,
  coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
});
for (const record of parsed.records) bridge.ingestEnvelope(record.value);
const snapshot = bridge.snapshot(parsed.records.at(-1)?.value?.receivedAt ?? Date.now());
const pipeline = snapshot.diagnostics.pipeline;
const context = roleContextSummary(pipeline.state.roleContext);
const report = {
  input: inputPath,
  hero: pipeline.state.hero,
  role: pipeline.state.role,
  gameTimeSec: pipeline.state.gameTimeSec,
  roleDecision: pipeline.roleDecision,
  context,
  telemetry: {
    gold: pipeline.state.gold,
    gpm: pipeline.state.gpm,
    xpm: pipeline.state.xpm,
    level: pipeline.state.level,
    health: pipeline.state.health,
    mana: pipeline.state.mana,
    lastHits: pipeline.state.lastHits,
    denies: pipeline.state.denies,
    abilityCount: Object.keys(pipeline.state.abilities ?? {}).length,
    wardPurchaseCooldownSec: pipeline.state.wardPurchaseCooldownSec
  }
};

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('\nDota Flow Role Context Adapter');
  console.log('='.repeat(52));
  console.log(`Input: ${inputPath}`);
  console.log(`Player: ${report.hero} · ${report.role} · ${report.gameTimeSec}s`);
  console.log(`Role task: ${report.roleDecision.action} (${Math.round(report.roleDecision.confidence * 100)}%)`);
  console.log(`Context: ${context.quality} · ${Math.round(context.coverage * 100)}% coverage · ${Math.round(context.liveCoverage * 100)}% live`);
  console.log(`Telemetry: ${report.telemetry.lastHits}/${report.telemetry.denies} CS · ${report.telemetry.gold} gold · ${report.telemetry.gpm} GPM · level ${report.telemetry.level}`);
  console.log(`Available: ${context.availableSignals.join(', ') || 'none'}`);
  console.log(`Unavailable/stale: ${[...context.missingSignals, ...context.staleSignals].join(', ') || 'none'}`);
  for (const limitation of context.limitations) console.log(`  - ${limitation}`);
}
