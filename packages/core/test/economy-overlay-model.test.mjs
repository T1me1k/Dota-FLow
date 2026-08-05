import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEconomyOverlayModel } from '../src/economy-overlay-model.mjs';

test('local GSI net worth is exact and never converted into an estimate',()=>{
  const model=buildEconomyOverlayModel({hero:'morphling',team:'radiant',netWorth:8421,gameTimeSec:900});
  assert.equal(model.rows.length,1);
  assert.equal(model.rows[0].local,true);
  assert.equal(model.rows[0].economy.value,8421);
  assert.equal(model.rows[0].economy.quality,'EXACT');
  assert.equal(model.exactCount,1);
});

test('enemy economy stays unavailable without public evidence',()=>{
  const model=buildEconomyOverlayModel({
    hero:'morphling',team:'radiant',netWorth:8421,gameTimeSec:900,
    roster:[
      {steamId:'local',hero:'morphling',team:'radiant',isLocalPlayer:true},
      {steamId:'enemy',hero:'axe',team:'dire'}
    ]
  });
  const enemy=model.rows.find(row=>row.hero==='axe');
  assert.equal(enemy.economy.value,null);
  assert.equal(enemy.economy.quality,'UNAVAILABLE');
});

test('public items and last hits produce a visible range rather than a fake exact number',()=>{
  const model=buildEconomyOverlayModel({
    hero:'sniper',team:'radiant',netWorth:6000,gameTimeSec:1200,
    roster:[
      {hero:'sniper',team:'radiant',isLocalPlayer:true},
      {hero:'juggernaut',team:'dire',level:13,lastHits:112,items:[{id:'item_power_treads'},{id:'item_manta'}]}
    ]
  },{sort:'NET_WORTH'});
  const enemy=model.rows.find(row=>row.hero==='juggernaut');
  assert.equal(enemy.economy.quality,'ESTIMATE');
  assert.ok(enemy.economy.low>0);
  assert.ok(enemy.economy.high>enemy.economy.low);
  assert.notEqual(enemy.economy.low,enemy.economy.high);
});

test('old public economy evidence is marked stale instead of presented as current',()=>{
  const model=buildEconomyOverlayModel({
    hero:'sniper',team:'radiant',netWorth:6000,gameTimeSec:200,
    roster:[
      {hero:'sniper',team:'radiant',isLocalPlayer:true},
      {hero:'axe',team:'dire',level:8,lastHits:48,economyObservedAtSec:100}
    ]
  },{staleAfterSec:45});
  const enemy=model.rows.find(row=>row.hero==='axe');
  assert.equal(enemy.economy.quality,'STALE');
  assert.equal(enemy.economy.originalQuality,'ESTIMATE');
  assert.equal(enemy.economy.ageSec,100);
  assert.equal(model.staleCount,1);
  assert.equal(model.estimatedCount,0);
});

test('fresh observed economy stays exact before the stale threshold',()=>{
  const model=buildEconomyOverlayModel({
    hero:'sniper',team:'radiant',netWorth:6000,gameTimeSec:120,
    economyObservedAtSec:100
  },{staleAfterSec:45});
  assert.equal(model.rows[0].economy.quality,'EXACT');
  assert.equal(model.rows[0].economy.ageSec,20);
});

test('enemy buyback timer starts only from a confirmed timestamp and keeps confirmed cost',()=>{
  const model=buildEconomyOverlayModel({
    hero:'sniper',team:'radiant',netWorth:6000,gameTimeSec:1000,
    roster:[
      {hero:'sniper',team:'radiant',isLocalPlayer:true},
      {hero:'axe',team:'dire',buybackUsedAtSec:900,buybackCost:3475},
      {hero:'puck',team:'dire'}
    ]
  });
  const axe=model.rows.find(row=>row.hero==='axe');
  assert.equal(axe.buybackRemainingSec,320);
  assert.equal(axe.buybackCost,3475);
  assert.equal(axe.buybackQuality,'CONFIRMED');
  assert.equal(model.rows.find(row=>row.hero==='puck').buybackRemainingSec,null);
});
