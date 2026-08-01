import test from 'node:test';
import assert from 'node:assert/strict';
import { HERO_CATALOG } from '../src/hero-catalog.mjs';
import { MockMatchRuntime } from '../src/mock-match-runtime.mjs';

const team = ['axe', 'puck', 'tusk', 'treant_protector'];
const enemy = ['juggernaut', 'underlord', 'windranger', 'crystal_maiden', 'zeus'];

test('every hero in HERO_CATALOG can start a canonical mock match', () => {
  assert.equal(HERO_CATALOG.length, 127);

  for (const hero of HERO_CATALOG) {
    const runtime = new MockMatchRuntime();
    const snapshot = runtime.startMatch({
      hero: hero.id,
      role: 'carry',
      draft: {
        radiant: [hero.id, ...team],
        dire: enemy
      }
    });

    assert.equal(snapshot.state.phase, 'playing', hero.id);
    assert.equal(snapshot.state.hero, hero.id, hero.id);
    assert.equal(snapshot.state.gameTimeSec, 0, hero.id);
    assert.match(snapshot.state.matchId, /^mock-match-/, hero.id);
    assert.ok(snapshot.macroDecision?.action, `${hero.id}: macro decision missing`);
    assert.ok(snapshot.roleDecision?.action, `${hero.id}: role decision missing`);
    assert.ok(snapshot.powerSpike, `${hero.id}: power spike projection missing`);
  }
});
