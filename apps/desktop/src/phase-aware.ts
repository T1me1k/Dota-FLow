import type{RuntimeSnapshot}from'./runtime/provider';
import{evaluateLaningStance,presentLaningStance}from'../../../packages/core/src/laning-stance-engine.mjs';

export type MatchStage='PREGAME'|'LANING'|'MID_GAME'|'LATE_GAME'|'ULTRA_LATE';
export type PresentedCoachCall={
  primaryAction:string;
  confidence:number;
  instruction?:string;
  instructionKey?:string;
  reasons:string[];
  reasonKeys?:string[];
  cancellationConditions:string[];
  cancellationKey?:string;
  missingSignals:string[];
  phaseGuarded:boolean;
  stanceCode?:string;
  evidence?:Record<string,unknown>;
};

const LANING_END_SEC=12*60;
const MID_GAME_END_SEC=30*60;
const LATE_GAME_END_SEC=45*60;
const LANING_ALLOWED=new Set([
  'RESET','HOLD_POSITION','STABILIZE_LANE','PLAY_LANE','LAST_HIT','DENY','PULL','STACK',
  'SECURE_RUNE','TAKE_POWER_RUNE','PREPARE_POWER_RUNE','FARM','FARM_SAFE','HOLD_SAFE_LANE',
  'TRADE','HARASS','PROTECT_CARRY','CONTEST_WISDOM','WAIT'
]);
void LANING_ALLOWED;

export function deriveMatchStage(snapshot:RuntimeSnapshot):MatchStage{
  const phase=String(snapshot.state?.phase??'').toLowerCase();
  const seconds=Number(snapshot.state?.gameTimeSec);
  if(phase==='pregame'||phase==='strategy'||phase==='draft'||(Number.isFinite(seconds)&&seconds<0))return'PREGAME';
  if(!Number.isFinite(seconds)||seconds<LANING_END_SEC)return'LANING';
  if(seconds<MID_GAME_END_SEC)return'MID_GAME';
  if(seconds<LATE_GAME_END_SEC)return'LATE_GAME';
  return'ULTRA_LATE';
}

function interfaceLanguage():'ru'|'en'{
  if(typeof document==='undefined')return'ru';
  return document.documentElement.lang==='en'?'en':'ru';
}

function laningCall(snapshot:RuntimeSnapshot):PresentedCoachCall{
  const stance=evaluateLaningStance(snapshot.state??{});
  const copy=presentLaningStance(stance,interfaceLanguage());
  return{
    primaryAction:stance.action==='RESET'?'RESET':copy.title,
    confidence:stance.confidence,
    instruction:copy.instruction,
    reasons:copy.reasons,
    cancellationConditions:[copy.cancellation],
    missingSignals:stance.missingSignals,
    phaseGuarded:true,
    stanceCode:stance.action,
    evidence:{
      healthPct:stance.healthPct,
      manaPct:stance.manaPct,
      level:stance.level,
      ability:stance.ability,
      economy:stance.economy,
      lane:stance.evidence
    }
  };
}

function fallback(stage:MatchStage,existing:any):PresentedCoachCall{
  if(stage==='PREGAME')return{
    primaryAction:'PREPARE_LANE',confidence:.98,instructionKey:'phase.pregameInstruction',
    reasons:[],reasonKeys:['phase.pregameReason'],cancellationConditions:[],cancellationKey:'phase.pregameNext',
    missingSignals:[],phaseGuarded:true
  };
  if(stage==='LANING')return{
    primaryAction:'STABILIZE_LANE',confidence:Math.min(Number(existing?.confidence)||.72,.78),instructionKey:'phase.laningInstruction',
    reasons:[],reasonKeys:['phase.laningReason'],cancellationConditions:[],cancellationKey:'phase.laningNext',
    missingSignals:Array.isArray(existing?.missingSignals)?existing.missingSignals:[],phaseGuarded:true
  };
  return{
    primaryAction:String(existing?.primaryAction??existing?.action??'HOLD_POSITION'),
    confidence:Number(existing?.confidence)||.55,
    instruction:String(existing?.instruction??''),
    reasons:Array.isArray(existing?.reasons)?existing.reasons:[],
    cancellationConditions:Array.isArray(existing?.cancellationConditions)?existing.cancellationConditions:[],
    missingSignals:Array.isArray(existing?.missingSignals)?existing.missingSignals:[],
    phaseGuarded:false
  };
}

export function selectPresentedCoachCall(snapshot:RuntimeSnapshot):PresentedCoachCall{
  const stage=deriveMatchStage(snapshot);
  const existing=snapshot.coachCall as any;
  if(stage==='PREGAME')return fallback(stage,existing);
  if(stage==='LANING'){
    const action=String(existing?.primaryAction??existing?.action??'').toUpperCase();
    const criticalReset=action==='RESET'&&Number(existing?.confidence)>=.85;
    if(criticalReset)return{
      primaryAction:'RESET',
      confidence:Number(existing.confidence)||.85,
      instruction:String(existing.instruction??''),
      reasons:Array.isArray(existing.reasons)?existing.reasons:[],
      cancellationConditions:Array.isArray(existing.cancellationConditions)?existing.cancellationConditions:[],
      missingSignals:Array.isArray(existing.missingSignals)?existing.missingSignals:[],
      phaseGuarded:false,
      stanceCode:'RESET'
    };
    return laningCall(snapshot);
  }
  if(!existing)return fallback(stage,existing);
  return{
    primaryAction:String(existing.primaryAction??existing.action??'HOLD_POSITION'),
    confidence:Number(existing.confidence)||.55,
    instruction:String(existing.instruction??''),
    reasons:Array.isArray(existing.reasons)?existing.reasons:[],
    cancellationConditions:Array.isArray(existing.cancellationConditions)?existing.cancellationConditions:[],
    missingSignals:Array.isArray(existing.missingSignals)?existing.missingSignals:[],
    phaseGuarded:false
  };
}

export function stageTranslationKey(stage:MatchStage):string{
  return stage==='PREGAME'?'phase.pregame':stage==='LANING'?'phase.laning':stage==='MID_GAME'?'phase.mid':stage==='LATE_GAME'?'phase.late':'phase.ultra';
}
