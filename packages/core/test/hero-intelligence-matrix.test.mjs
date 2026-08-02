import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../src/game-state.mjs';
import { recommendAdaptiveBuild } from '../src/adaptive-build-advisor.mjs';
import { evaluatePowerState } from '../src/power-spike-engine.mjs';
import { getHeroProfile } from '../src/hero-profiles.mjs';
import { listDetailedProfilePacks } from '../src/hero-profile-registry.mjs';

const addedIds = listDetailedProfilePacks().slice(3).flatMap((pack) => pack.heroIds);
const stateFor = (hero, patch={}) => createInitialGameState({ phase:'playing', hero, role:getHeroProfile(hero).role, gameTimeSec:0, gpm:400, ...patch });

function assertPlanMatchesHeroAndScenario(hero, recommendation, scenarioTag, reasonCode) {
  const profile = getHeroProfile(hero);
  const selected = recommendation.recommendedPlan;
  assert.ok(selected.id.startsWith(`${hero}_`), `${hero}: selected plan must remain hero-specific`);
  assert.ok(selected.scenarioTags.includes(scenarioTag), `${hero}: ${selected.id} must declare ${scenarioTag}`);
  assert.ok(selected.reasons.includes(reasonCode), `${hero}: ${selected.id} must explain ${reasonCode}`);
  assert.ok(profile.buildPlans.some((plan) => plan.id === selected.id), `${hero}: selected plan must belong to the profile`);
  assert.ok(selected.items.some((item) => item.id === selected.coreItems.at(-1).id), `${hero}: target progression must remain inside the selected plan`);
}

test('adaptive build matrix covers balanced, control and recovery scenarios for all 79 added heroes', () => {
  for (const hero of addedIds) {
    const balancedState = stateFor(hero);
    const balanced = recommendAdaptiveBuild(balancedState);
    assertPlanMatchesHeroAndScenario(hero, balanced, 'balanced', 'balanced_draft');
    assert.equal(recommendAdaptiveBuild(balancedState).recommendedPlan.id, balanced.recommendedPlan.id);

    const controlState = stateFor(hero, { draft:{ radiant:[hero], dire:['lion','axe','puck','zeus','spirit_breaker'] } });
    const control = recommendAdaptiveBuild(controlState);
    assertPlanMatchesHeroAndScenario(hero, control, 'enemy_control_high', 'enemy_control_high');
    assert.equal(recommendAdaptiveBuild(controlState).recommendedPlan.id, control.recommendedPlan.id);

    const recoveryState = stateFor(hero,{gameTimeSec:15*60,gpm:250});
    const recovery = recommendAdaptiveBuild(recoveryState);
    assertPlanMatchesHeroAndScenario(hero, recovery, 'player_behind', 'player_behind');
    assert.equal(recommendAdaptiveBuild(recoveryState).recommendedPlan.id, recovery.recommendedPlan.id);
    assert.ok(recovery.limitations.some((entry) => entry.startsWith('missing_signal:')));
    assert.equal(getHeroProfile(hero).id, hero);
  }
  assert.equal(getHeroProfile('future_unknown').id, 'unknown');
});

test('power spike matrix provides four hero-specific lifecycle-ready spikes for all added heroes', () => {
  for (const hero of addedIds) {
    const profile=getHeroProfile(hero);
    assert.equal(profile.spikes.length,4);
    for(const spike of profile.spikes){
      assert.ok(spike.id.startsWith(`${hero}_`));
      assert.ok(spike.recommendation);
      assert.ok(spike.earlyToleranceMin>0&&spike.lateToleranceMin>0);
      assert.ok(spike.activeDurationSec>0&&spike.fadeDurationSec>0);
      assert.ok(spike.calibrationVersion.startsWith('prototype'));
    }
    const level=evaluatePowerState(stateFor(hero,{gameTimeSec:7*60,level:6,progression:{levelReachedAt:{6:7*60},itemAcquiredAt:{}}}));
    assert.ok(level.permanentSpikes.some((spike)=>spike.id===`${hero}_level_6`));
  }
});
