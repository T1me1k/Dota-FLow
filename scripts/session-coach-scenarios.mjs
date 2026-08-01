import assert from'node:assert/strict';
import{SessionCoachEngine,SessionBoundaryPolicy,PersonalPatternAnalyzer,MemorySessionCoachRepository,createDemoSession,SESSION_COACH_COPY}from'../packages/core/src/session-coach.mjs';
const user=x=>structuredClone(x).map((r,i)=>({...r,id:`user-${r.id}-${i}`,source:'USER'}));
const healthy=user(createDemoSession('HEALTHY')),revenge=user(createDemoSession('REVENGE')),fatigue=user(createDemoSession('FATIGUE'));
const evaluate=(checkIns,extra={})=>SessionCoachEngine.evaluate({checkIns,historyCount:20,...extra});
const scenarios=[
 ['First check-in',()=>assert.equal(evaluate([healthy[0]],{historyCount:1}).recommendation.type,'NOT_ENOUGH_DATA')],
 ['Check-in skipped',()=>assert.equal(SessionCoachEngine.evaluate({checkIns:[{...healthy[0],skipped:true,primaryState:null}]}).readinessLevel,'UNKNOWN')],
 ['Calm after loss',()=>assert.equal(evaluate(healthy.slice(0,2)).tiltRisk,0)],
 ['Tilted after win',()=>assert.ok(evaluate([{...revenge[0],primaryState:'TILTED',matchContext:{...revenge[0].matchContext,won:true}}]).tiltRisk>0)],
 ['Revenge queue motivation',()=>assert.ok(evaluate(revenge).ruleTrace.some(x=>x.ruleId==='tilt.revenge-motivation'))],
 ['Two consecutive losses without tilt',()=>assert.equal(evaluate(healthy.slice(0,2).map(x=>({...x,matchContext:{...x.matchContext,won:false}})),{consecutiveLosses:2}).tiltRisk,0)],
 ['Two consecutive losses with revenge queue',()=>assert.ok(evaluate(revenge,{consecutiveLosses:2}).tiltRisk>0)],
 ['Long match but high energy',()=>assert.ok(evaluate([{...healthy[0],matchContext:{...healthy[0].matchContext,durationSec:5000}}],{longMatchCount:1}).fatigueRisk<50)],
 ['Four-match fatigue',()=>assert.ok(evaluate(fatigue,{matchCount:4,totalDurationSec:160*60,longMatchCount:4}).fatigueRisk>=80)],
 ['Declining focus',()=>assert.ok(evaluate(fatigue).ruleTrace.some(x=>x.ruleId==='fatigue.focus-trend'))],
 ['High desire plus low focus',()=>assert.ok(evaluate(revenge).requeueImpulse>=30)],
 ['Session inactivity boundary',()=>assert.equal(new SessionBoundaryPolicy().shouldStartNew({activeSession:{id:'s'},previousMatchEndedAt:'2026-01-01T10:00:00Z',nextMatchStartedAt:'2026-01-01T11:30:00Z'}),true)],
 ['Manual session close',()=>assert.equal(new SessionBoundaryPolicy().shouldStartNew({activeSession:{id:'s'},manuallyClosed:true}),true)],
 ['Unknown match result',()=>assert.ok(evaluate([{...healthy[0],matchContext:{resultKnown:false}}]).recommendation.type)],
 ['Missing hero and role',()=>assert.ok(evaluate([{...healthy[0],matchContext:{resultKnown:true,won:true}}]).recommendation.type)],
 ['Partial Match Review data',()=>assert.ok(evaluate([{...healthy[0],matchContext:{decisionSuccess:0.7}}]).confidence.score>0)],
 ['Established time-window pattern',()=>{const xs=Array.from({length:20},(_,i)=>({...healthy[0],id:`late-${i}`,matchContext:{...healthy[0].matchContext,startedAt:`2026-02-${String(i+1).padStart(2,'0')}T23:45:00Z`}}));assert.equal(new PersonalPatternAnalyzer().analyze(xs)[0].status,'ESTABLISHED_PATTERN')}],
 ['Insufficient hero sample',()=>assert.notEqual(new PersonalPatternAnalyzer().analyze(healthy).find(x=>x.type==='HERO_HIGH_ENERGY_FIT').status,'ESTABLISHED_PATTERN')],
 ['Established role pattern',()=>{const xs=user(createDemoSession('HERO_ROLE')).map(x=>({...x,matchContext:{...x.matchContext,role:'hard support'},energy:5}));assert.ok(new PersonalPatternAnalyzer().analyze(xs).some(x=>x.type.startsWith('ROLE_')&&x.status==='ESTABLISHED_PATTERN'))}],
 ['Delete one check-in',async()=>{const r=new MemorySessionCoachRepository();await r.saveCheckIn(healthy[0]);assert.equal(await r.deleteCheckIn(healthy[0].id),true)}],
 ['Delete all history',async()=>{const r=new MemorySessionCoachRepository();await r.saveCheckIn(healthy[0]);await r.deleteAll();assert.equal((await r.listCheckIns()).length,0)}],
 ['Export data',async()=>{const r=new MemorySessionCoachRepository();assert.equal((await r.exportAll()).schemaVersion,1)}],
 ['Disabled Session Coach',async()=>{const r=new MemorySessionCoachRepository();assert.equal((await r.savePrivacySettings({enabled:false})).enabled,false)}],
 ['Daily reflection skipped',async()=>{const r=new MemorySessionCoachRepository(),x={schemaVersion:1,id:'reflection-skip',skipped:true};await r.saveDailyReflection(x);assert.equal((await r.listDailyReflections())[0].skipped,true)}],
 ['Reflection suggests earlier stop point',async()=>{const r=new MemorySessionCoachRepository(),x={schemaVersion:1,id:'reflection-stop',skipped:false,shouldHaveStoppedAfterMatch:2};await r.saveDailyReflection(x);assert.equal((await r.listDailyReflections())[0].shouldHaveStoppedAfterMatch,2)}],
 ['Replay fixture does not mutate',()=>{const before=JSON.stringify(createDemoSession('HEALTHY'));evaluate(user(createDemoSession('HEALTHY')));assert.equal(JSON.stringify(createDemoSession('HEALTHY')),before)}],
 ['Demo data stays isolated',async()=>{const userRepo=new MemorySessionCoachRepository(),demoRepo=new MemorySessionCoachRepository({namespace:'DEMO'});await demoRepo.saveCheckIn(createDemoSession('HEALTHY')[0]);assert.equal((await userRepo.listCheckIns()).length,0)}],
 ['Current recommendation is deterministic',()=>assert.deepEqual(evaluate(fatigue),evaluate(fatigue))],
 ['Rule trace explains score',()=>assert.ok(evaluate(revenge).ruleTrace.every(x=>x.ruleId&&x.category&&x.explanation&&x.evidence))],
 ['No diagnosis wording',()=>assert.doesNotMatch(JSON.stringify(SESSION_COACH_COPY),/diagnos|addiction|unstable/i)],
 ['No recommendation blocks user action',()=>assert.equal(evaluate(fatigue).recommendation.blocksUserAction,false)]
];
let failed=0;for(const[name,run]of scenarios){try{await run();console.log(`PASS ${name}`)}catch(error){failed++;console.error(`FAIL ${name}: ${error.message}`)}}console.log(`Session Coach scenarios ${scenarios.length-failed}/${scenarios.length}`);if(failed)process.exitCode=1;
