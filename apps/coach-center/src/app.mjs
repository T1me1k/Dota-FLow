import {
  GAME_EVENT_TYPES,
  GameEventPipeline,
  OpenDotaScoutingProvider,
  aggregateFlowPerformance,
  createCoachEventEnvelope
} from '/packages/core/src/index.mjs';

const $ = (id) => document.getElementById(id);
const elements = Object.fromEntries([
  'pregameButton','liveButton','postButton','voiceToggle','phaseLabel','heroTitle','primaryTip','macroBox',
  'draftBriefing','counterItems','timerList','roshanButton','aegisButton','clearTimersButton','voiceCue',
  'performancePanel','performanceScore','performanceGrade','performanceConfidence','progressSummary','performanceDimensions','performanceTips','scoutingStatus','steamIdInput','scoutButton'
].map((id) => [id,$(id)]));

let pipeline;
let lastSpokenKey = null;
const PERFORMANCE_STORAGE_KEY='dota-flow.performance-history.v1';
const scoutingProvider=new OpenDotaScoutingProvider();

function escapeHtml(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function clock(seconds){const v=Math.max(0,Number(seconds)||0);return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(Math.floor(v%60)).padStart(2,'0')}`;}
function row(title,text,badge=''){return `<div class="row"><div>${badge?`<span class="pill">${escapeHtml(badge)}</span>`:''}<strong>${escapeHtml(title)}</strong></div><span>${escapeHtml(text)}</span></div>`;}

function readPerformanceHistory(){try{const value=JSON.parse(localStorage.getItem(PERFORMANCE_STORAGE_KEY)??'[]');return Array.isArray(value)?value:[];}catch{return [];}}
function savePerformanceReport(report){if(!report)return readPerformanceHistory();const history=readPerformanceHistory();const signature=`${report.score}:${pipeline.state.hero}:${Math.round(pipeline.state.gameTimeSec)}`;if(!history.some((entry)=>entry.signature===signature)){history.push({...report,signature,recordedAt:new Date().toISOString()});localStorage.setItem(PERFORMANCE_STORAGE_KEY,JSON.stringify(history.slice(-50)));}return history;}

function makePipeline(phase='pregame'){
  pipeline=new GameEventPipeline({
    initialState:{phase,hero:'anti_mage',role:'carry',team:'radiant',gameTimeSec:phase==='pregame'?-30:410,level:8,gpm:510,gold:1200,lastHits:63,
      draft:{radiant:['anti_mage','tidehunter','lion','puck','crystal_maiden'],dire:['axe','drow_ranger','zeus','omniknight','spirit_breaker']},
      damage:{heroTotal:0,towerTotal:0},teamScore:{radiant:0,dire:0}}
  });
}

function ingestCoach(eventType,payload,label){
  const envelope=createCoachEventEnvelope(eventType,payload,{gameTimeSec:pipeline.state.gameTimeSec,label});
  const event={type:envelope.payload.eventType,gameTimeSec:envelope.payload.gameTimeSec,payload:envelope.payload.payload};
  return pipeline.dispatch(event);
}

function speak(cue){
  if(!elements.voiceToggle.checked||!cue||cue.key===lastSpokenKey||!('speechSynthesis' in window))return;
  lastSpokenKey=cue.key;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(cue.text);utterance.lang='ru-RU';utterance.rate=1.05;window.speechSynthesis.speak(utterance);
}

function render(snapshot=pipeline.snapshot()){
  const {state,decision,coach}=snapshot;const pre=coach.pregame;
  elements.phaseLabel.textContent=state.phase.toUpperCase();elements.heroTitle.textContent=`${pre.displayName} · ${state.role}`;
  elements.primaryTip.textContent=pre.tips[0]??'Собери информацию перед первым действием.';elements.macroBox.textContent=state.phase==='pregame'?'PREGAME':decision.action;
  const build=coach.adaptiveBuild;
  const buildRows=build?.recommendedPlan?[row('Adaptive build',build.recommendedPlan.name,'BUILD'),...build.recommendedPlan.reasons.map((reason,i)=>row(`Build reason ${i+1}`,reason))]:[row('Adaptive build','NOT CALIBRATED','LIMITED')];
  elements.draftBriefing.innerHTML=[...buildRows,...pre.threats.map(x=>row(x.label,`${Math.round(x.value*100)}%`,'THREAT')),...pre.strengths.map(x=>row(x.label,`${Math.round(x.value*100)}%`,'ALLY')),...pre.tips.map((tip,i)=>row(`Plan ${i+1}`,tip))].join('');
  elements.counterItems.innerHTML=coach.counterItems.recommendations.length?coach.counterItems.recommendations.map(item=>row(item.name,item.reasons.join(' · '),`#${item.priority}`)).join(''):row('Нет рекомендации','Добавь полный draft или актуальные enemy items.');
  const timers=[...coach.timers.periodic,...coach.timers.tracked];elements.timerList.innerHTML=timers.map(timer=>row(timer.label,timer.status==='WINDOW'?`Respawn window · до ${clock(timer.maxReadyAtSec)}`:timer.status==='READY'?'READY':`${Math.ceil(timer.remainingSec)} сек. · ${clock(timer.nextAtSec??timer.readyAtSec)}`,timer.status)).join('');
  elements.voiceCue.textContent=coach.voiceCue?.text??'Критичной голосовой подсказки нет.';speak(coach.voiceCue);
  const publicPlayers=pre.scouting.players?.filter((player)=>player.status==='PUBLIC')??[];
  elements.scoutingStatus.textContent=publicPlayers.length?publicPlayers.map((player)=>`${player.profile?.personaname??player.steamId}: ${Math.round((player.recent?.winRate??0)*100)}% recent WR · ${player.recent?.matches??0} matches`).join(' · '):`Scouting ${pre.scouting.status}: ${(pre.scouting.limitations??[]).join(' · ')||'public data not loaded'}`;
  const perf=coach.performance;elements.performancePanel.classList.toggle('hidden',!perf);if(perf){const history=savePerformanceReport(perf);const progress=aggregateFlowPerformance(history);elements.performanceScore.textContent=perf.score;elements.performanceGrade.textContent=perf.grade;elements.performanceConfidence.textContent=`Confidence ${Math.round(perf.confidence*100)}% · GPM ${perf.benchmark.actualGpm}/${perf.benchmark.expectedGpm}`;elements.progressSummary.textContent=`${progress.matchCount} matches · avg ${progress.averageScore} · recent ${progress.recentAverage} · trend ${progress.trend.direction} ${progress.trend.delta>=0?'+':''}${progress.trend.delta}`;elements.performanceDimensions.innerHTML=Object.entries(perf.dimensions).map(([k,v])=>`<div class="dimension"><span>${escapeHtml(k)}</span><strong>${v}</strong></div>`).join('');elements.performanceTips.innerHTML=perf.improvements.map(x=>row(x.dimension,x.message,`${x.value}`)).join('');}
}

function showPregame(){makePipeline('pregame');lastSpokenKey=null;render();}
function showLive(){makePipeline('playing');pipeline.dispatch({type:GAME_EVENT_TYPES.CLOCK_UPDATED,gameTimeSec:410,payload:{gameTimeSec:410}});render();}
function showPost(){makePipeline('playing');pipeline.dispatchMany([
  {type:GAME_EVENT_TYPES.CLOCK_UPDATED,gameTimeSec:1980,payload:{gameTimeSec:1980}},
  {type:GAME_EVENT_TYPES.GAME_SNAPSHOT,gameTimeSec:1980,payload:{level:23,gpm:612,lastHits:286,kills:8,deaths:5,assists:12,damage:{heroTotal:28600,towerTotal:5200},teamScore:{radiant:42,dire:36}}},
  {type:GAME_EVENT_TYPES.MATCH_ENDED,gameTimeSec:1980,payload:{}}
]);render();}

elements.pregameButton.addEventListener('click',showPregame);elements.liveButton.addEventListener('click',showLive);elements.postButton.addEventListener('click',showPost);
elements.roshanButton.addEventListener('click',()=>render(ingestCoach(GAME_EVENT_TYPES.COACH_TIMER_STARTED,{kind:'ROSHAN',startedAtSec:pipeline.state.gameTimeSec,label:'Roshan respawn'},'Roshan killed')));
elements.aegisButton.addEventListener('click',()=>render(ingestCoach(GAME_EVENT_TYPES.COACH_TIMER_STARTED,{kind:'AEGIS',startedAtSec:pipeline.state.gameTimeSec,label:'Aegis expires'},'Aegis picked')));
elements.clearTimersButton.addEventListener('click',()=>{for(const timer of [...pipeline.state.coachContext.timers])pipeline.dispatch({type:GAME_EVENT_TYPES.COACH_TIMER_CLEARED,payload:{id:timer.id}});render();});
elements.voiceToggle.addEventListener('change',()=>{if(!elements.voiceToggle.checked&&'speechSynthesis'in window)window.speechSynthesis.cancel();render();});

elements.scoutButton.addEventListener('click',async()=>{const steamId=elements.steamIdInput.value.trim();if(!steamId)return;elements.scoutButton.disabled=true;elements.scoutingStatus.textContent='Loading public OpenDota data…';const player=await scoutingProvider.getPlayer(steamId);pipeline.dispatch({type:GAME_EVENT_TYPES.SCOUTING_UPDATED,payload:{status:player.status==='PUBLIC'?'PARTIAL':'UNAVAILABLE',source:'OpenDota',players:[player],limitations:player.limitations??[]}});elements.scoutButton.disabled=false;render();});
showPregame();
