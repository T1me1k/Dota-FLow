export const URGENCY_LEVELS = Object.freeze(['CRITICAL','HIGH','MEDIUM','LOW','INFORMATIONAL']);
export const COACH_CALL_HISTORY_LIMIT = 120;

const urgencyWeight={CRITICAL:1,HIGH:.82,MEDIUM:.62,LOW:.42,INFORMATIONAL:.2};
const domainWeight={SAFETY:1,OBJECTIVE:.83,ROLE:.72,LANE:.68,MACRO:.58,BUILD:.32};
const qualityWeight={LIVE:1,MANUAL:.88,INFERRED:.72,STALE:.38,UNAVAILABLE:.18,UNKNOWN:.55};
const OBJECTIVES=new Set(['TAKE_ROSHAN','TAKE_TORMENTOR','DEFEND_TOWER','TRADE_OBJECTIVE','HIGH_GROUND']);
const CONFLICT_PAIRS=[['FARM','FIGHT'],['FARM','OBJECTIVE'],['RESET','FIGHT'],['RESET','OBJECTIVE'],['HOLD_LANE','ROTATE'],['PROTECT_CORE','MOVE_TO_WISDOM'],['PROTECT_CARRY','MOVE_TO_WISDOM'],['TAKE_ROSHAN','DEFEND_TOWER'],['PRESSURE','CONNECT'],['BUILD','URGENT_GAMEPLAY'],['STACK','PROTECT_CARRY'],['PULL','PROTECT_CARRY']];
export const DECISION_CONFLICT_MATRIX=Object.freeze(CONFLICT_PAIRS.map(Object.freeze));

const actionOf=d=>d?.action??d?.primaryAction??d?.recommendation?.action??null;
const confidenceOf=d=>Math.max(0,Math.min(1,Number(d?.confidence??d?.score??.5)));
const reasonsOf=d=>[...(d?.reasons??d?.reasoning??[])].filter(Boolean).slice(0,6);
const qualityOf=(d,fallback='UNKNOWN')=>d?.dataQuality?.status??d?.dataQuality??fallback;
const group=action=>OBJECTIVES.has(action)?'OBJECTIVE':action?.startsWith('BUY_')?'BUILD':action;

export function actionsConflict(a,b){
  if(CONFLICT_PAIRS.some(([p,q])=>(a===p&&b===q)||(a===q&&b===p)))return true;
  const x=group(a),y=group(b);
  return CONFLICT_PAIRS.some(([p,q])=>(x===p&&y===q)||(x===q&&y===p))||((a?.startsWith('BUY_')||b?.startsWith('BUY_'))&&[a,b].some(v=>['CRITICAL','RESET'].includes(v)));
}

function urgencyFor(action,domain,decision){
  if(decision?.urgency&&urgencyWeight[decision.urgency]!=null)return decision.urgency;
  if(['RESET','RESET_BEFORE_OBJECTIVE','PROTECT_CORE','PROTECT_CARRY'].includes(action))return 'CRITICAL';
  if(OBJECTIVES.has(action)||['MOVE_TO_WISDOM','CONTROL_POWER_RUNE','DEFEND_TOWER'].includes(action))return 'HIGH';
  if(domain==='BUILD')return 'LOW';
  return 'MEDIUM';
}

function scoreCandidate({domain,urgency,confidence,quality,windowSec,blockers}){
  let score=(domainWeight[domain]??.5)*.42+urgencyWeight[urgency]*.32+confidence*.21+(qualityWeight[quality]??.5)*.05;
  if(windowSec<=45)score+=.09;
  if(blockers.length)score-=.12;
  return Math.max(0,Math.min(1,score));
}

function candidate(domain,d,fallbackQuality){
  const action=actionOf(d);
  if(!action||action==='NEUTRAL'||action==='WAIT')return null;
  let urgency=urgencyFor(action,domain,d);
  const rawConfidence=confidenceOf(d),quality=qualityOf(d,fallbackQuality),reasons=reasonsOf(d);
  const lateBreakpoint=d?.powerState?.permanentSpikes?.some?.(spike=>spike.id?.endsWith('_late_role_breakpoint'));
  const prototype=d?.profile?.calibrationVersion?.startsWith('prototype');
  if(domain==='MACRO'&&action==='RESET'&&['UNKNOWN','UNAVAILABLE'].includes(quality)&&(prototype||lateBreakpoint)&&(!reasons.some(reason=>/здоров|health|мана|mana/i.test(reason))||lateBreakpoint))urgency='MEDIUM';
  const reviewedReset=domain==='MACRO'&&action==='RESET'&&urgency==='CRITICAL'&&d?.profile?.calibrationVersion?.startsWith('review-required');
  const confidence=reviewedReset?Math.max(rawConfidence,.54):rawConfidence;
  const windowSec=Number(d?.windowSec??d?.remainingSec??90);
  const base={domain,action,confidence,urgency,quality,reasons,blockers:[...(d?.blockers??[])],missingSignals:[...(d?.missingSignals??d?.limitations??[])],windowSec,raw:d};
  return {...base,score:scoreCandidate(base)};
}

function prepared(c,patch){const next={...c,...patch};return {...next,score:scoreCandidate(next)};}
function prepare(c){
  const missing=new Set(c.missingSignals.map(String));
  if(c.action==='TAKE_ROSHAN'&&[...missing].some(x=>/vision|readiness/i.test(x)))return prepared(c,{action:'PREPARE_ROSHAN',confidence:Math.min(c.confidence,.68),reasons:[...c.reasons,'Roshan requires confirmed pit vision'],urgency:'MEDIUM'});
  if(/ROTATE/.test(c.action)&&[...missing].some(x=>/wave|lane/i.test(x)))return prepared(c,{action:'PREPARE_ROTATION',confidence:Math.min(c.confidence,.68),reasons:[...c.reasons,'Check and push the lane before rotating'],urgency:'MEDIUM'});
  if(c.action==='MOVE_TO_WISDOM'&&[...missing].some(x=>/route|safety/i.test(x)))return prepared(c,{action:'PREPARE_WISDOM',confidence:Math.min(c.confidence,.68),reasons:[...c.reasons,'Confirm a safe route before moving'],urgency:'MEDIUM'});
  if(c.action==='HIGH_GROUND'&&[...missing].some(x=>/buyback|cooldown/i.test(x)))return prepared(c,{action:'HOLD_HIGH_GROUND_SETUP',confidence:Math.min(c.confidence,.68),reasons:[...c.reasons,'Confirm buybacks and key cooldowns'],urgency:'HIGH'});
  return c;
}
const nowOf=s=>Number(s?.gameTimeSec??0);
const hpOf=s=>s?.maxHealth>0?s.health/s.maxHealth:Number(s?.healthPct??1);

function inactiveCoachCall(state,now){
  const pregame=state?.phase==='pregame';
  const action=pregame?'WAIT_FOR_HORN':'WAIT_FOR_MATCH';
  const reason=pregame
    ? 'Матч ещё не начался; активные макро-команды отключены до 0:00.'
    : 'Нет активного матча для безопасной игровой рекомендации.';
  return {
    primaryAction:action,
    primaryDomain:'SAFETY',
    title:action.replaceAll('_',' '),
    instruction:reason,
    confidence:1,
    urgency:'INFORMATIONAL',
    reasons:[reason],
    steps:[],
    secondaryActions:[],
    suppressedActions:[],
    conflicts:[],
    blockers:[],
    missingSignals:pregame?[]:['active match'],
    cancellationConditions:[pregame?'GAME_STARTED':'NEW_MATCH'],
    expiresAtSec:now+1,
    nextEvaluationSec:now+1,
    dataQuality:state?.source==='gsi'?'LIVE':'UNAVAILABLE',
    phase:state?.phase??'idle',
    strategyTrace:{
      considered:[{action,domain:'SAFETY',confidence:1}],
      selected:{action,domain:'SAFETY',confidence:1},
      suppressed:[],
      selectionReasons:[reason],
      safetyRules:[action],
      missingSignals:pregame?[]:['active match']
    },
    generatedAtSec:now
  };
}

export function orchestrateDecision(input={}){
  const state=input.state??{},now=nowOf(state),globalQuality=input.dataQuality?.status??input.dataQuality?.overall??'UNKNOWN';
  if(typeof state.phase==='string'&&state.phase!=='playing')return inactiveCoachCall(state,now);
  const candidates=[],hp=hpOf(state),alive=state.alive!==false;
  if(alive&&hp<=.22)candidates.push(candidate('SAFETY',{action:input.objectiveDecision&&actionOf(input.objectiveDecision)!=='NEUTRAL'?'RESET_BEFORE_OBJECTIVE':'RESET',confidence:.96,urgency:'CRITICAL',reasons:[`Health is critically low (${Math.round(hp*100)}%)`]},globalQuality));
  if(!alive)candidates.push(candidate('SAFETY',{action:'WAIT_RESPAWN',confidence:1,urgency:'INFORMATIONAL',reasons:['Hero is dead; re-evaluate after respawn']},globalQuality));
  for(const [domain,value] of [['OBJECTIVE',input.objectiveDecision],['ROLE',input.roleDecision],['LANE',input.laneDecision],['MACRO',input.macroDecision],['BUILD',input.adaptiveBuild]]){
    const c=candidate(domain,value,input.dataQuality?.[domain.toLowerCase()]??globalQuality);if(c)candidates.push(prepare(c));
  }
  if(!candidates.length)candidates.push(candidate('SAFETY',{action:'HOLD_SAFE_POSITION',confidence:.45,urgency:'LOW',reasons:['No actionable decision is sufficiently confirmed'],missingSignals:['decision inputs']},globalQuality));
  candidates.sort((a,b)=>b.score-a.score||b.confidence-a.confidence||a.action.localeCompare(b.action));
  const winner=candidates[0];
  const suppressed=candidates.slice(1).map(c=>({action:c.action,domain:c.domain,confidence:c.confidence,score:+c.score.toFixed(3),reason:actionsConflict(winner.action,c.action)?'Conflicts with selected call':'Lower priority or longer window'}));
  const conflicts=suppressed.filter(s=>actionsConflict(winner.action,s.action)).map(s=>({selected:winner.action,suppressed:s.action}));
  const secondaryActions=suppressed.filter(s=>!actionsConflict(winner.action,s.action)).slice(0,3).map(s=>({action:s.action,domain:s.domain,after:winner.action,confidence:s.confidence}));
  const missingSignals=[...new Set(candidates.flatMap(c=>c.missingSignals))].slice(0,12);
  const ttl=winner.urgency==='CRITICAL'?12:winner.windowSec<=45?Math.max(8,winner.windowSec):45;
  return {primaryAction:winner.action,primaryDomain:winner.domain,title:winner.action.replaceAll('_',' '),instruction:winner.raw?.message??winner.raw?.instruction??winner.reasons[0]??'Maintain the selected safe plan.',confidence:winner.confidence,urgency:winner.urgency,reasons:winner.reasons.slice(0,6),steps:[...(winner.raw?.steps??[])].slice(0,5),secondaryActions,suppressedActions:suppressed,conflicts,blockers:winner.blockers,missingSignals,cancellationConditions:['NEW_MATCH','HERO_DIED','TTL_EXPIRED',...(winner.domain==='OBJECTIVE'?['OBJECTIVE_WINDOW_CLOSED','HP_BELOW_SAFE_THRESHOLD','KEY_COOLDOWN_UNAVAILABLE']:[]),...(winner.domain==='BUILD'?['TARGET_ITEM_PURCHASED']:[])],expiresAtSec:now+ttl,nextEvaluationSec:now+(winner.urgency==='CRITICAL'?1:5),dataQuality:winner.quality,phase:state.phase,strategyTrace:{considered:candidates.map(c=>({action:c.action,domain:c.domain,confidence:c.confidence})),selected:{action:winner.action,domain:winner.domain,confidence:winner.confidence},suppressed:suppressed.map(({action,domain,reason})=>({action,domain,reason})),selectionReasons:[...winner.reasons,winner.windowSec<=45?'This opportunity has the shortest confirmed window':'Highest safe calibrated priority'].slice(0,6),safetyRules:candidates.filter(c=>c.domain==='SAFETY').map(c=>c.action),missingSignals},generatedAtSec:now};
}

export function meaningfulCoachCallChange(a,b){return !a||!b||a.primaryAction!==b.primaryAction||a.urgency!==b.urgency||a.dataQuality!==b.dataQuality;}
export class DecisionOrchestratorCoordinator{
  constructor({minScoreMargin=.06,minHoldSec=8,historyLimit=COACH_CALL_HISTORY_LIMIT}={}){this.options={minScoreMargin,minHoldSec,historyLimit};this.current=null;this.history=[];}
  reset(){this.current=null;this.history=[];}
  update(input,reason='EVENT'){
    const proposed=orchestrateDecision(input),now=proposed.generatedAtSec,current=this.current;
    const emergency=proposed.urgency==='CRITICAL'&&current?.urgency!=='CRITICAL';
    const phaseChanged=current?.phase!==undefined&&current.phase!==input.state?.phase;
    const cancelled=current&&(phaseChanged||now>=current.expiresAtSec||input.state?.alive===false&&current.primaryAction!=='WAIT_RESPAWN');
    const margin=(proposed.strategyTrace.considered[0]?.confidence??0)-(current?.confidence??0);
    if(current&&proposed.primaryAction!==current.primaryAction&&!emergency&&!cancelled&&now-current.generatedAtSec<this.options.minHoldSec&&margin<this.options.minScoreMargin)return current;
    if(meaningfulCoachCallChange(current,proposed)){
      this.history.push({gameTimeSec:now,previousAction:current?.primaryAction??null,action:proposed.primaryAction,urgency:proposed.urgency,confidence:proposed.confidence,reason:emergency?'EMERGENCY_OVERRIDE':cancelled?'CANCELLATION_OR_EXPIRY':reason,dataQuality:proposed.dataQuality});
      if(this.history.length>this.options.historyLimit)this.history.splice(0,this.history.length-this.options.historyLimit);
    }
    this.current=proposed;return proposed;
  }
}

export function formatCoachCall(call,mode='STANDARD'){
  if(!call)return null;
  const pct=Math.round(call.confidence*100),next=call.secondaryActions?.[0]?.action?.replaceAll('_',' ');
  if(mode==='EXPERT')return `${call.primaryAction}${next?` → ${next}`:''}`;
  if(mode==='BEGINNER')return `Главная задача: ${call.instruction}\n\nПочему:\n${call.reasons.map(x=>`- ${x}`).join('\n')}${next?`\n\nПосле: ${next}.`:''}`;
  return `${call.primaryAction} · ${pct}%\n${call.instruction}${next?`\nПосле — ${next}.`:''}`;
}
