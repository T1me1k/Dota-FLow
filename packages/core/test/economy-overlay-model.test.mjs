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

test('enemy buyback timer starts only from a confirmed timestamp',()=>{
  const model=buildEconomyOverlayModel({
    hero:'sniper',team:'radiant',netWorth:6000,gameTimeSec:1000,
    roster:[
      {hero:'sniper',team:'radiant',isLocalPlayer:true},
      {hero:'axe',team:'dire',buybackUsedAtSec:900},
      {hero:'puck',team:'dire'}
    ]
  });
  assert.equal(model.rows.find(row=>row.hero==='axe').buybackRemainingSec,320);
  assert.equal(model.rows.find(row=>row.hero==='axe').buybackQuality,'CONFIRMED');
  assert.equal(model.rows.find(row=>row.hero==='puck').buybackRemainingSec,null);
});
