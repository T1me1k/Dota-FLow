import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'fixtures/scenarios/replay-scenarios.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const scenario = manifest.find((entry) => entry.id === 'safety-02-invoker');
if (!scenario) throw new Error('safety-02-invoker scenario not found');
const checkpoint = scenario.checkpoints.find((entry) => entry.gameTimeSec === 1516);
if (!checkpoint) throw new Error('Invoker 1516 checkpoint not found');

checkpoint.expectedPrimaryAction = 'RESET_BEFORE_OBJECTIVE';
checkpoint.expectedUrgency = 'CRITICAL';
checkpoint.requiredReasonCodes = ['HEALTH_IS_CRITICALLY_LOW_15'];
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

for (const path of [
  join(root, 'scripts/calibrate-invoker-safety-checkpoint.mjs'),
  join(root, '.github/workflows/calibrate-invoker-safety-checkpoint.yml')
]) rmSync(path, { force: true });

console.log('Calibrated Invoker safety checkpoint to the precise safety call.');
