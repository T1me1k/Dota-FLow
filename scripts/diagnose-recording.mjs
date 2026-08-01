import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { diagnoseJsonlRecording } from '../packages/core/src/recording.mjs';

function parseArgs(argv) {
  const result = { file: null, json: false, report: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') result.json = true;
    else if (arg === '--report') result.report = argv[++index] ?? null;
    else if (!arg.startsWith('--') && !result.file) result.file = arg;
  }
  return result;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function printHuman(file, report) {
  const { recording, summary, featureHealth, issues, mappings, pipeline } = report;
  console.log(`\nDota Flow GEP diagnostics: ${file}`);
  console.log('='.repeat(72));
  console.log(`JSONL: ${recording.parsedRecordCount}/${recording.lineCount} parsed; ${recording.parseErrorCount} parse errors`);
  console.log(`Envelopes: ${summary.envelopeCount}; canonical: ${summary.canonicalEventCount}; unmapped: ${summary.ignoredMappingCount}; invalid: ${summary.invalidEnvelopeCount}`);
  console.log(`Types: game-event ${summary.envelopeTypeCounts['game-event']}, info-update ${summary.envelopeTypeCounts['info-update']}, status ${summary.envelopeTypeCounts.status}, manual ${summary.envelopeTypeCounts['manual-context'] ?? 0}`);
  console.log(`Duration: ${formatDuration(summary.durationMs)}; issues: ${summary.issueCount}`);
  console.log(`Final macro: ${pipeline.decision.action} (${Math.round(pipeline.decision.confidence * 100)}%); game time: ${pipeline.state.gameTimeSec}s`);

  console.log('\nFeature health');
  console.log(`ACTIVE ${featureHealth.summary.active} · STALE ${featureHealth.summary.stale} · UNSEEN ${featureHealth.summary.unseen} · UNEXPECTED ${featureHealth.summary.unexpected}`);
  for (const feature of featureHealth.features.filter((item) => item.count > 0)) {
    console.log(`  ${feature.status.padEnd(6)} ${feature.name.padEnd(34)} count=${feature.count} age=${feature.ageMs ?? '—'}ms`);
  }

  const unmapped = mappings.filter((mapping) => mapping.status === 'ignored' || mapping.status === 'invalid');
  if (unmapped.length) {
    console.log('\nUnmapped / invalid payloads');
    for (const mapping of unmapped.slice(0, 20)) {
      console.log(`  #${mapping.sequence}.${mapping.index} ${mapping.envelopeType} ${mapping.rawName ?? 'unknown'} — ${mapping.reason}`);
    }
  }

  if (issues.length) {
    console.log('\nIssues');
    for (const issue of issues.slice(0, 30)) console.log(`  ${issue.code}: ${issue.message}`);
  }
}

const args = parseArgs(process.argv.slice(2));
const file = resolve(args.file ?? 'fixtures/recordings/sample-gep-session.jsonl');
const text = await readFile(file, 'utf8');
const report = diagnoseJsonlRecording(text, {
  coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 },
  staleAfterMs: 5_000,
  gapThresholdMs: 5_000
});

if (args.report) await writeFile(resolve(args.report), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
if (args.json) console.log(JSON.stringify(report, null, 2));
else printHuman(file, report);

if (report.recording.parseErrorCount || report.summary.invalidEnvelopeCount) process.exitCode = 1;
