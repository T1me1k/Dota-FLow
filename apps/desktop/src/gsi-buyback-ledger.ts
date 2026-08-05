type DotaFlowApi={onGepEnvelope:(listener:(envelope:unknown)=>void)=>()=>void};
type JsonObject=Record<string,unknown>;
type BuybackObservation={
  id:string;
  hero?:string;
  team?:string;
  steamId?:string;
  remainingSec:number;
  cost:number|null;
  observedAtWallMs:number;
  confirmed:boolean;
};
type LiveLedger={matchId:string|null;local:BuybackObservation|null;players:Record<string,BuybackObservation>};
type GsiState={matchId:string|null;available:boolean|null};

const LEDGER_KEY='trust-economy-live-ledger-v1';
const GSI_STATE_KEY='trust-economy-gsi-buyback-state-v1';
const BUYBACK_COOLDOWN_SEC=420;

function objectOf(value:unknown):JsonObject{return value&&typeof value==='object'&&!Array.isArray(value)?value as JsonObject:{}}
function finite(value:unknown):number|null{const number=Number(value);return Number.isFinite(number)?number:null}
function parse(value:unknown):unknown{if(typeof value!=='string')return value;try{return JSON.parse(value)}catch{return value}}
function heroId(value:unknown){return String(value??'').replace(/^npc_dota_hero_/,'').trim().toLowerCase()}
function readJson(key:string):unknown{try{return JSON.parse(localStorage.getItem(key)??'{}')}catch{return{}}}
function readLedger():LiveLedger{
  const raw=objectOf(readJson(LEDGER_KEY)),players=objectOf(raw.players);
  return{
    matchId:raw.matchId==null?null:String(raw.matchId),
    local:raw.local&&typeof raw.local==='object'?raw.local as BuybackObservation:null,
    players:players as Record<string,BuybackObservation>
  };
}
function readState():GsiState{
  const raw=objectOf(readJson(GSI_STATE_KEY));
  return{matchId:raw.matchId==null?null:String(raw.matchId),available:typeof raw.available==='boolean'?raw.available:null};
}
function announceLedger(){
  dispatchEvent(new StorageEvent('storage',{key:LEDGER_KEY,newValue:localStorage.getItem(LEDGER_KEY)}));
}
function writeLedger(ledger:LiveLedger){localStorage.setItem(LEDGER_KEY,JSON.stringify(ledger));announceLedger()}
function writeState(state:GsiState){localStorage.setItem(GSI_STATE_KEY,JSON.stringify(state))}
function payloadEvents(payload:unknown):JsonObject[]{
  if(Array.isArray(payload))return payload.flatMap(payloadEvents);
  const raw=objectOf(payload);
  if(Array.isArray(raw.events))return(raw.events as unknown[]).flatMap(payloadEvents);
  return Object.keys(raw).length?[raw]:[];
}
function gsiSnapshot(raw:JsonObject):JsonObject|null{
  if(String(raw.name??raw.feature??raw.event??'')!=='gsi_snapshot')return null;
  return objectOf(parse(raw.data??raw.value));
}
function observe(snapshot:JsonObject){
  const available=typeof snapshot.buybackAvailable==='boolean'?snapshot.buybackAvailable:null;
  const exactCooldown=finite(snapshot.buybackCooldownSec??snapshot.buyback_cooldown);
  if(available===null&&exactCooldown===null)return;

  const matchId=snapshot.matchId==null?null:String(snapshot.matchId);
  let state=readState(),ledger=readLedger();
  if(matchId&&state.matchId&&matchId!==state.matchId)state={matchId,available:null};
  if(matchId&&ledger.matchId&&matchId!==ledger.matchId)ledger={matchId,local:null,players:{}};
  if(matchId&&!state.matchId)state={...state,matchId};
  if(matchId&&!ledger.matchId)ledger={...ledger,matchId};

  const remaining=exactCooldown===null?null:Math.max(0,Math.ceil(exactCooldown));
  const confirmedStart=remaining!==null&&remaining>0||state.available===true&&available===false;
  if(confirmedStart){
    ledger.local={
      id:'local',hero:heroId(snapshot.hero),team:String(snapshot.team??'unknown').toLowerCase(),
      steamId:snapshot.steamId==null?undefined:String(snapshot.steamId),
      remainingSec:remaining??BUYBACK_COOLDOWN_SEC,cost:finite(snapshot.buybackCost??snapshot.buyback_cost),
      observedAtWallMs:Date.now(),confirmed:true
    };
    writeLedger(ledger);
  }else if((remaining===0||available===true)&&ledger.local){
    ledger.local=null;writeLedger(ledger);
  }else if(matchId&&ledger.matchId===matchId){
    writeLedger(ledger);
  }

  state={matchId:matchId??state.matchId,available:available??(remaining===null?state.available:remaining<=0)};
  writeState(state);
}

const api=(window as unknown as{dotaFlow?:DotaFlowApi}).dotaFlow;
const off=api?.onGepEnvelope(value=>{
  const envelope=objectOf(value);if(String(envelope.type)!=='game-event')return;
  for(const raw of payloadEvents(envelope.payload)){const snapshot=gsiSnapshot(raw);if(snapshot)observe(snapshot)}
});
addEventListener('beforeunload',()=>off?.(),{once:true});
