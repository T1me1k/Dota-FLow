import { readFile, readdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { runReplayScenario } from '../packages/core/src/replay-simulator.mjs';

function formatTime(seconds) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

async function scenarioPaths(argumentsList) {
  if (argumentsList.length) return argumentsList.map((path) => resolve(path));
  const directory = resolve('fixtures/replays');
  const files = await readdir(directory);
  return files.filter((file) => file.endsWith('.json')).sort().map((file) => resolve(directory, file));
}

for (const path of await scenarioPaths(process.argv.slice(2))) {
  const scenario = JSON.parse(await readFile(path, 'utf8'));
  const result = runReplayScenario(scenario);
  console.log(`\n=== ${result.name} (${basename(path)}) ===`);
  if (!result.decisionHistory.length) console.log('No macro action changes recorded.');
  for (const entry of result.decisionHistory) {
    console.log(`${formatTime(entry.gameTimeSec)} ${entry.previousAction ?? '—'} → ${entry.action} (${Math.round(entry.confidence * 100)}%)`);
    for (const reason of entry.reasons.slice(0, 2)) console.log(`  - ${reason}`);
  }
  console.log(`Final: ${result.finalDecision.action}; events: ${result.eventCount}; target: ${result.finalState.targetItem?.name ?? 'build complete'}`);
}
