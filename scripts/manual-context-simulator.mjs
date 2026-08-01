import {
  MANUAL_CONTEXT_COMMANDS,
  LiveGepBridge,
  roleContextSummary
} from '../packages/core/src/index.mjs';

const bridge = new LiveGepBridge({
  initialState: {
    phase: 'playing',
    hero: 'queen_of_pain',
    role: 'mid',
    gameTimeSec: 345,
    health: 900,
    maxHealth: 1000,
    mana: 700,
    maxMana: 800
  },
  coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0, role: { minimumHoldSec: 0 } }
});

function print(label, snapshot) {
  const pipeline = snapshot.diagnostics.pipeline;
  const summary = roleContextSummary(pipeline.state.roleContext);
  console.log(`${label.padEnd(24)} ${pipeline.roleDecision.action.padEnd(24)} ${Math.round(pipeline.roleDecision.confidence * 100)}% · ${summary.quality}`);
}

print('Timer only', bridge.snapshot());
print('Confirm lane pushed', bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.LANE_PUSHED));
bridge.ingestEnvelope({
  type: 'game-event',
  gameId: 7314,
  receivedAt: Date.now() + 1,
  sourceSequence: 'clock-370',
  payload: { name: 'clock_time_changed', data: { clock_time: 370 } }
});
print('Confirm Bottle DD', bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.BOTTLE_DOUBLE_DAMAGE));
print('Confirm Wisdom fight', bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.WISDOM_FIGHT_EXPECTED));
print('Clear confirmations', bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.CLEAR));

const snapshot = bridge.snapshot();
console.log(`\nManual envelopes: ${snapshot.bridge.manualEnvelopeCount}`);
console.log(`GEP forwarded: ${snapshot.bridge.forwardedEnvelopeCount}`);
console.log(`Connection: ${snapshot.bridge.state} (set by the clock envelope, never by manual input)`);
