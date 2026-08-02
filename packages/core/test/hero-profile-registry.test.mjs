import test from 'node:test';
import assert from 'node:assert/strict';
import { HERO_CATALOG } from '../src/hero-catalog.mjs';
import { DETAILED_HERO_IDS, listDetailedProfilePacks } from '../src/hero-profile-registry.mjs';
import { getHeroProfile, listHeroProfiles } from '../src/hero-profiles.mjs';

test('catalog detailed IDs exactly equal registered detailed profile IDs', () => {
  const catalog = HERO_CATALOG.filter((hero) => hero.calibrationTier === 'DETAILED').map((hero) => hero.id).sort();
  const registered = listHeroProfiles().filter((hero) => hero.calibrationTier === 'DETAILED').map((hero) => hero.id).sort();
  assert.deepEqual(catalog, registered);
  assert.deepEqual(catalog, [...DETAILED_HERO_IDS].sort());
  assert.equal(new Set(registered).size, 127);
  assert.equal(registered.length, HERO_CATALOG.length);
});

test('new strategic packs satisfy detailed, scenario and spike contracts without duplicate models', () => {
  const newIds = listDetailedProfilePacks().slice(3).flatMap((pack) => pack.heroIds);
  const fingerprints = new Set();
  for (const id of newIds) {
    const profile = getHeroProfile(id);
    assert.equal(profile.calibrationTier, 'DETAILED');
    assert.ok(profile.playstyleIdentity);
    assert.equal(profile.buildPlans.length, 4);
    assert.ok(profile.buildPlans.every((plan) => plan.items.length >= 3 && plan.scenarioTags.length));
    assert.equal(profile.spikes.length, 4);
    assert.ok(profile.spikes.every((spike) => spike.id.startsWith(`${id}_`) && spike.recommendation));
    const fingerprint = JSON.stringify([profile.basePower, profile.stageCurves, profile.buildPlans.map((p) => p.items.map((i) => i.id)), profile.spikes.map((s) => [s.id,s.actions])]);
    assert.ok(!fingerprints.has(fingerprint), `duplicate strategic model for ${id}`);
    fingerprints.add(fingerprint);
  }
});

test('named strategic differences remain explicit', () => {
  const huskar=getHeroProfile('huskar'), sniper=getHeroProfile('sniper'), axe=getHeroProfile('axe'), tide=getHeroProfile('tidehunter');
  assert.ok(huskar.basePower.initiation !== sniper.basePower.initiation);
  assert.ok(sniper.playstyleIdentity.includes('positioning'));
  assert.notDeepEqual(axe.stageCurves, tide.stageCurves);
  assert.notDeepEqual(getHeroProfile('oracle').basePower, getHeroProfile('dazzle').basePower);
  assert.notDeepEqual(getHeroProfile('chen').stageCurves, getHeroProfile('enchantress').stageCurves);
});
