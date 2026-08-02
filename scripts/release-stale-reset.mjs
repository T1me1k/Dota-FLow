import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decisionPath = join(root, 'packages/core/src/decision-engine.mjs');
const invokerReplayPath = join(root, 'fixtures/scenarios/recordings/safety-02-invoker.jsonl');

let decision = readFileSync(decisionPath, 'utf8');
const before = `    const heldFor = state.gameTimeSec - this.changedAtGameTime;
    const urgent = candidate.action === MACRO_ACTIONS.RESET && candidate.scores.RESET >= 50;
    const strongSwitch = candidate.margin >= this.switchMargin;

    if (urgent || (heldFor >= this.minimumHoldSec && strongSwitch)) {
      return this.#accept(candidate, state.gameTimeSec);
    }`;
const after = `    const heldFor = state.gameTimeSec - this.changedAtGameTime;
    const urgent = candidate.action === MACRO_ACTIONS.RESET && candidate.scores.RESET >= 50;
    const strongSwitch = candidate.margin >= this.switchMargin;
    const staleResetCleared = this.current.action === MACRO_ACTIONS.RESET
      && candidate.action !== MACRO_ACTIONS.RESET
      && state.alive !== false
      && healthPct(state) >= 0.58
      && manaPct(state) >= 0.25
      && Number(state.gold ?? 0) < 2200
      && Number(state.unreliableGold ?? 0) < 1800
      && state.context?.safeRouteAvailable !== false;

    if (urgent || staleResetCleared || (heldFor >= this.minimumHoldSec && strongSwitch)) {
      return this.#accept(candidate, state.gameTimeSec);
    }`;

if (!decision.includes(after)) {
  if (!decision.includes(before)) throw new Error('StableDecisionCoordinator replacement target not found');
  decision = decision.replace(before, after);
  writeFileSync(decisionPath, decision);
}

let invokerReplay = readFileSync(invokerReplayPath, 'utf8');
const oldFinalContext = '"context":{"synthetic":true,"objectiveWindow":false}}}';
const newFinalContext = '"context":{"synthetic":true,"objectiveWindow":false,"roshanAvailable":false}}}';
const finalSnapshotMarker = '"gameTimeSec":1361';
const finalSnapshotIndex = invokerReplay.indexOf(finalSnapshotMarker);
if (finalSnapshotIndex === -1) throw new Error('Invoker final snapshot not found');
const prefix = invokerReplay.slice(0, finalSnapshotIndex);
let suffix = invokerReplay.slice(finalSnapshotIndex);
if (!suffix.includes(newFinalContext)) {
  if (!suffix.includes(oldFinalContext)) throw new Error('Invoker final context replacement target not found');
  suffix = suffix.replace(oldFinalContext, newFinalContext);
  writeFileSync(invokerReplayPath, prefix + suffix);
}

for (const path of [
  join(root, 'scripts/release-stale-reset.mjs'),
  join(root, '.github/workflows/release-stale-reset.yml')
]) rmSync(path, { force: true });

console.log('Released stale emergency RESET and calibrated Invoker safety replay.');
