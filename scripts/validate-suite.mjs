import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRecordingSuite } from '../packages/core/src/index.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const json = args.includes('--json');
const strict = args.includes('--strict');
const positional = args.filter((arg) => !arg.startsWith('--'));
const inputs = positional.length
  ? positional.map((path) => resolve(root, path))
  : [resolve(root, 'fixtures/recordings/real-match-validation-session.jsonl')];

async function discoverJsonl(path) {
  const info = await stat(path);
  if (info.isFile()) return extname(path).toLowerCase() === '.jsonl' ? [path] : [];
  if (!info.isDirectory()) return [];

  const entries = await readdir(path, { withFileTypes: true });
  const discovered = [];
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      discovered.push(...await discoverJsonl(child));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.jsonl')) {
      discovered.push(child);
    }
  }
  return discovered;
}

const paths = [...new Set((await Promise.all(inputs.map(discoverJsonl))).flat())].sort();
if (!paths.length) throw new Error('No JSONL recordings found in the supplied paths.');

const recordings = await Promise.all(paths.map(async (path) => ({
  name: basename(path) === 'events.jsonl' ? basename(resolve(path, '..')) : basename(path),
  text: await readFile(path, 'utf8')
})));
const report = validateRecordingSuite(recordings, {
  minRecordings: 5,
  staleAfterMs: 5000,
  gapThresholdMs: 5000,
  coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
});

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Dota Flow validation suite');
  console.log('='.repeat(72));
  console.log(`Status: ${report.status}`);
  console.log(`Recordings: ${report.summary.recordingCount}/${report.minRecordings}`);
  console.log(`Passing: ${report.summary.passingRecordingCount}; blocked: ${report.summary.blockedRecordingCount}; remaining: ${report.summary.remainingRecordingCount}`);
  console.log(`Cross-match reset: ${report.summary.resetValidated ? 'validated' : 'not yet validated'}`);
  console.log(`Heroes: ${report.summary.heroes.join(', ') || 'none'}`);
  console.log('');
  for (const item of report.signalCoverage) {
    console.log(`${item.id.padEnd(28)} ${item.passedRecordings}/${item.totalRecordings}`);
  }
}

if (strict && report.status !== 'READY') process.exitCode = 1;
