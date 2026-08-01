import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MATCH_VALIDATION_PROFILES, validateJsonlRecording } from '../packages/core/src/index.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const json = args.includes('--json');
const strict = args.includes('--strict');
const release = args.includes('--release');
const pathArg = args.find((arg) => !arg.startsWith('--'));
const input = resolve(root, pathArg ?? 'fixtures/recordings/real-match-validation-session.jsonl');
const text = await readFile(input, 'utf8');
const report = validateJsonlRecording(text, {
  profile: release ? MATCH_VALIDATION_PROFILES.RELEASE : MATCH_VALIDATION_PROFILES.SINGLE_MATCH,
  staleAfterMs: 5000,
  gapThresholdMs: 5000,
  coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
});

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Dota Flow real-match validation: ${input}`);
  console.log('='.repeat(72));
  console.log(`Gate: ${report.status}; profile: ${report.profile}; score: ${Math.round(report.score * 100)}%`);
  console.log(`Required: ${report.summary.passedRequiredSignalCount}/${report.summary.requiredSignalCount}; blockers: ${report.summary.blockerCount}`);
  console.log(`Matches: ${report.summary.matchCount}; heroes: ${report.calibration.heroes.join(', ') || 'none'}`);
  console.log('');
  for (const signal of report.signals) {
    const marker = signal.pass ? 'PASS' : signal.required ? 'FAIL' : 'MISS';
    console.log(`${marker.padEnd(4)} ${signal.required ? '[required]' : '[optional]'} ${signal.label}`);
    if (!signal.pass || signal.required) console.log(`     ${signal.message}`);
  }
  console.log('');
  console.log('Payload contracts');
  for (const contract of report.contracts) {
    const kinds = Object.entries(contract.parsedKinds).map(([kind, count]) => `${kind}:${count}`).join(', ');
    console.log(`  ${contract.feature.padEnd(30)} ${String(contract.count).padStart(3)}  ${contract.envelopeTypes.join('+')}  ${kinds}`);
  }
  console.log('');
  console.log(`Calibration: ${report.calibration.itemAcquisitions.length} item timings; ${report.calibration.levelTimings.length} level timings; ${report.calibration.decisions.transitionCount} decision transitions`);
}

if (strict && report.status === 'BLOCKED') process.exitCode = 1;
