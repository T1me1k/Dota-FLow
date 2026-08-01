import { parseJsonl } from './recording.mjs';
import { GameEventPipeline } from './live-pipeline.mjs';
import { toCanonicalGameEvents, toCanonicalInfoEvents } from './gep-normalizer.mjs';

export const OUTCOMES = Object.freeze(['SUCCESS','PARTIAL_SUCCESS','NEUTRAL','FAILURE','UNRESOLVED','INSUFFICIENT_DATA']);
const compact = (s = {}) => ({ gameTimeSec:s.gameTimeSec, gold:s.gold, gpm:s.gpm, level:s.level, alive:s.alive, healthPct:s.maxHealth ? s.health/s.maxHealth : null, kills:s.kills, deaths:s.deaths, teamScore:s.teamScore, targetItemId:s.targetItem?.id ?? null });

function entry(raw, i, category, state = {}) { return { id:`${category.toLowerCase()}-${i}-${raw.gameTimeSec ?? state.gameTimeSec ?? 0}`, gameTimeSec:raw.gameTimeSec ?? state.gameTimeSec ?? 0, category, action:raw.action ?? raw.type ?? raw.powerStatus ?? 'UPDATE', previousAction:raw.previousAction ?? null, confidence:raw.confidence ?? null, reasons:[...(raw.reasons ?? [])], triggerEvent:raw.triggerEventType ?? raw.triggerEvent ?? null, dataQuality:raw.dataQuality ?? state.dataQuality ?? 'INFERRED', heroId:raw.heroId ?? state.hero ?? null, role:raw.role ?? state.role ?? null, stateSnapshot:raw.stateSnapshot ?? compact(state) }; }

export function buildDecisionTimeline(snapshot, extras = []) {
  const rows = [];
  snapshot.decisionHistory?.forEach((x,i)=>rows.push(entry(x,i,'MACRO',snapshot.state)));
  snapshot.roleDecisionHistory?.forEach((x,i)=>rows.push(entry(x,i,'ROLE',snapshot.state)));
  snapshot.laneDecisionHistory?.forEach((x,i)=>rows.push(entry(x,i,'LANE',snapshot.state)));
  snapshot.objectiveDecisionHistory?.forEach((x,i)=>rows.push(entry(x,i,'OBJECTIVE',snapshot.state)));
  snapshot.buildPlanHistory?.forEach((x,i)=>rows.push(entry({...x,action:x.nextTarget,previousAction:x.previousTarget},i,'BUILD',snapshot.state)));
  extras.forEach((x,i)=>rows.push(entry(x,i,x.category ?? 'EVENT',snapshot.state)));
  return rows.sort((a,b)=>a.gameTimeSec-b.gameTimeSec || a.id.localeCompare(b.id));
}

function delta(a,b,key) { return Number.isFinite(a?.[key]) && Number.isFinite(b?.[key]) ? b[key]-a[key] : null; }
export function evaluateOutcome(decision, states, windowSec) {
  const before = decision.stateSnapshot; const after = states.find((s)=>s.gameTimeSec >= decision.gameTimeSec + windowSec);
  if (!after) return { windowSec, outcome:'UNRESOLVED', evidence:[] };
  if (['STALE','UNAVAILABLE'].includes(decision.dataQuality)) return { windowSec, outcome:'INSUFFICIENT_DATA', evidence:['Decision context was not current'] };
  const deaths = delta(before,after,'deaths'); const gold = delta(before,after,'gold');
  if (deaths == null) return { windowSec,outcome:'INSUFFICIENT_DATA',evidence:['Death progression unavailable'] };
  if (decision.action === 'FARM') return { windowSec,outcome:deaths > 0 ? 'FAILURE' : gold != null && gold > windowSec * 4 ? 'SUCCESS' : gold == null ? 'INSUFFICIENT_DATA' : 'PARTIAL_SUCCESS',evidence:[`gold ${gold ?? 'unknown'}`,`deaths ${deaths}`] };
  if (['FIGHT','CONNECT'].includes(decision.action)) return { windowSec,outcome:deaths > 0 ? 'FAILURE' : delta(before,after,'kills') > 0 ? 'SUCCESS' : 'NEUTRAL',evidence:[`kills ${delta(before,after,'kills') ?? 'unknown'}`,`deaths ${deaths}`] };
  if (decision.action === 'RESET') return { windowSec,outcome:deaths === 0 ? 'SUCCESS' : 'FAILURE',evidence:[`deaths ${deaths}`] };
  return { windowSec,outcome:'NEUTRAL',evidence:[] };
}

const rate = (n,d) => d ? Math.round(n/d*1000)/10 : null;
export function calculateDecisionMetrics(timeline, outcomes = []) {
  const macro = timeline.filter((x)=>x.category==='MACRO'); const resolved = outcomes.filter((x)=>!['UNRESOLVED','INSUFFICIENT_DATA'].includes(x.outcome));
  const failures = (action)=>outcomes.filter((x)=>x.action===action && x.windowSec===60 && x.outcome==='FAILURE').length;
  const duration = Math.max(1,(macro.at(-1)?.gameTimeSec ?? 0)-(macro[0]?.gameTimeSec ?? 0));
  const quality = timeline.length ? timeline.reduce((s,x)=>s+({LIVE:1,MANUAL:.78,INFERRED:.58,STALE:.25,UNAVAILABLE:0}[x.dataQuality] ?? .5),0)/timeline.length : 0;
  return { decisionSuccessRate:rate(resolved.filter(x=>['SUCCESS','PARTIAL_SUCCESS'].includes(x.outcome)).length,resolved.length), falseFightRate:rate(failures('FIGHT'),macro.filter(x=>x.action==='FIGHT').length), lateConnectRate:null, unnecessaryResetRate:rate(failures('RESET'),macro.filter(x=>x.action==='RESET').length), decisionStability:Math.max(0,Math.round((1-Math.min(1,macro.length/(duration/30)))*1000)/10), decisionChurn:Math.round(macro.length/(duration/60)*10)/10, powerSpikeConversion:null, roleTaskCompletion:null, objectiveConversion:null, survivalAfterWarning:null, economyGrowthAfterFarm:null, pressureValue:null, dataQualityScore:Math.round(quality*1000)/10 };
}

export function createMatchReview(snapshot, { states = [], extras = [], outcome = null } = {}) {
  const timeline = buildDecisionTimeline(snapshot,extras); const important = timeline.filter(x=>['MACRO','ROLE','LANE','OBJECTIVE'].includes(x.category));
  const outcomes = important.flatMap(d=>[30,60,90].map(w=>({...evaluateOutcome(d,states,w),decisionId:d.id,action:d.action})));
  const metrics = calculateDecisionMetrics(timeline,outcomes); const fpi = Math.round(((metrics.decisionSuccessRate ?? 50)*.45)+(metrics.decisionStability*.2)+(metrics.dataQualityScore*.35));
  return { schemaVersion:2, matchId:snapshot.state?.matchId ?? null, outcome, heroId:snapshot.state?.hero ?? null, role:snapshot.state?.role ?? null, flowPerformanceIndex:fpi, metrics, timeline, outcomes, goodDecisions:outcomes.filter(x=>x.windowSec===60&&x.outcome==='SUCCESS').slice(0,5), mistakes:outcomes.filter(x=>x.windowSec===60&&x.outcome==='FAILURE').slice(0,5), missedPowerSpikes:timeline.filter(x=>x.category==='POWER_SPIKE'&&x.action==='MISSED'), disputedDecisions:outcomes.filter(x=>x.windowSec===60&&['NEUTRAL','INSUFFICIENT_DATA'].includes(x.outcome)).slice(0,5), analysisConfidence:metrics.dataQualityScore/100, nextMatchRecommendations:metrics.decisionChurn>2?['Сократи переключения: удерживай безопасный план минимум 30 секунд.']:['Продолжай конвертировать подтверждённые окна.'] };
}
export function exportReviewReport(review) { return JSON.stringify(review,null,2); }
export function importReviewJsonl(text) { const parsed=parseJsonl(text); const pipeline=new GameEventPipeline(); const states=[]; for(const envelope of parsed.records){ const events=[...toCanonicalInfoEvents(envelope.payload),...toCanonicalGameEvents(envelope.payload)]; for(const event of events){ states.push(compact(pipeline.dispatch(event).state)); } } return { review:createMatchReview(pipeline.snapshot(),{states}),errors:parsed.errors }; }
