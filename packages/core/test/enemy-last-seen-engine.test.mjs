import test from 'node:test';
import assert from 'node:assert/strict';
import { EnemyLastSeenTracker } from '../src/enemy-last-seen-engine.mjs';
import { createGameEventPipeline } from '../src/live-pipeline.mjs';

const enemy={steamId:'enemy-1',hero:'axe',team:'dire',alive:true,connected:true};
function state({gameTimeSec=100,visible,observedAtMs=1_000,matchId='match-1',alive=true,connected=true,sourceStatus='LIVE'}={}){
  const observation=visible===undefined?[]:[{...enemy,alive,connected,visible,gameTimeSec,observedAtMs,confidence:.96,source:'MINIMAP_CV'}];
  return{matchId,phase:'playing',gameTimeSec,team:'radiant',roster:[{...enemy,alive,connected}],roleContext:{enemyVisibilitySource:{status:sourceStatus,source:'MINIMAP_CV',observedAtMs},enemyVisibilityObservations:observation}};
}

test('visible enemy never shows a timer',()=>{
  const tracker=new EnemyLastSeenTracker();
  const result=tracker.update(state({visible:true}),1_000);
  assert.equal(result.status,'READY');
  assert.equal(result.rows[0].status,'VISIBLE');
  assert.equal(result.rows[0].timerVisible,false);
  assert.equal(result.rows[0].elapsedSec,null);
});

test('confirmed disappearance starts only after the jitter grace window',()=>{
  const tracker=new EnemyLastSeenTracker({graceSec:.75});
  tracker.update(state({visible:true,gameTimeSec:100,observedAtMs:1_000}),1_000);
  const pending=tracker.update(state({visible:false,gameTimeSec:100.2,observedAtMs:1_200}),1_200);
  assert.equal(pending.rows[0].status,'UNKNOWN');
  assert.equal(pending.rows[0].timerVisible,false);
  assert.equal(pending.rows[0].pending,true);
  const missing=tracker.update(state({visible:false,gameTimeSec:101.1,observedAtMs:2_100}),2_100);
  assert.equal(missing.rows[0].status,'MISSING');
  assert.equal(missing.rows[0].timerVisible,true);
  assert.equal(missing.rows[0].elapsedSec,0);
  const later=tracker.update(state({visible:false,gameTimeSec:105.4,observedAtMs:2_400}),2_400);
  assert.equal(later.rows[0].elapsedSec,5);
});

test('a visible frame during jitter cancels the pending timer',()=>{
  const tracker=new EnemyLastSeenTracker({graceSec:1});
  tracker.update(state({visible:true,gameTimeSec:40,observedAtMs:1_000}),1_000);
  tracker.update(state({visible:false,gameTimeSec:40.2,observedAtMs:1_200}),1_200);
  const visible=tracker.update(state({visible:true,gameTimeSec:40.6,observedAtMs:1_600}),1_600);
  assert.equal(visible.rows[0].status,'VISIBLE');
  assert.equal(visible.rows[0].pending,false);
  const nextMissing=tracker.update(state({visible:false,gameTimeSec:41,observedAtMs:2_000}),2_000);
  assert.equal(nextMissing.rows[0].status,'UNKNOWN');
});

test('reappearing enemy immediately hides and resets the timer',()=>{
  const tracker=new EnemyLastSeenTracker({graceSec:0});
  tracker.update(state({visible:true,gameTimeSec:10,observedAtMs:1_000}),1_000);
  const missing=tracker.update(state({visible:false,gameTimeSec:12,observedAtMs:1_200}),1_200);
  assert.equal(missing.rows[0].status,'MISSING');
  const visible=tracker.update(state({visible:true,gameTimeSec:15,observedAtMs:1_500}),1_500);
  assert.equal(visible.rows[0].status,'VISIBLE');
  assert.equal(visible.rows[0].elapsedSec,null);
  assert.equal(visible.rows[0].missingSinceGameTimeSec,null);
});

test('dead and disconnected enemies never display missing timers',()=>{
  const deadTracker=new EnemyLastSeenTracker({graceSec:0});
  const dead=deadTracker.update(state({visible:false,alive:false}),1_000);
  assert.equal(dead.rows[0].status,'DEAD');
  assert.equal(dead.rows[0].timerVisible,false);
  const disconnectedTracker=new EnemyLastSeenTracker({graceSec:0});
  const disconnected=disconnectedTracker.update(state({visible:false,connected:false}),1_000);
  assert.equal(disconnected.rows[0].status,'DISCONNECTED');
  assert.equal(disconnected.rows[0].timerVisible,false);
});

test('missing or stale visibility source fails closed',()=>{
  const tracker=new EnemyLastSeenTracker({staleAfterMs:500});
  const unavailable=tracker.update(state({visible:undefined,sourceStatus:'UNAVAILABLE',observedAtMs:0}),1_000);
  assert.equal(unavailable.status,'UNAVAILABLE');
  assert.equal(unavailable.rows[0].status,'UNKNOWN');
  const stale=tracker.update(state({visible:true,observedAtMs:1_000}),2_000);
  assert.equal(stale.sourceStatus,'STALE');
  assert.equal(stale.rows[0].status,'UNKNOWN');
});

test('new match clears all previous last-seen state',()=>{
  const tracker=new EnemyLastSeenTracker({graceSec:0});
  tracker.update(state({visible:true,gameTimeSec:10,matchId:'a'}),1_000);
  assert.equal(tracker.update(state({visible:false,gameTimeSec:12,matchId:'a'}),1_200).rows[0].status,'MISSING');
  const next=tracker.update(state({visible:false,gameTimeSec:1,matchId:'b'}),1_300);
  assert.equal(next.rows[0].status,'UNKNOWN');
  assert.equal(next.rows[0].timerVisible,false);
});

test('live pipeline exposes last-seen data and independent quality',()=>{
  const pipeline=createGameEventPipeline({initialState:state({visible:true})});
  const snapshot=pipeline.snapshot();
  assert.equal(snapshot.enemyLastSeen.rows[0].status,'VISIBLE');
  assert.equal(snapshot.dataQuality.enemyVisibility,'LIVE');
  assert.deepEqual(snapshot.enemyLastSeen.limitations,['No hidden location is inferred','Visible enemies never show a missing timer']);
});
