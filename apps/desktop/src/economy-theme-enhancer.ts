import './economy-theme-enhancer.css';
import { buildEconomyOverlayModel, type EconomyOverlayModel } from '../../../packages/core/src/economy-overlay-model.mjs';

type OverlaySide='LEFT'|'RIGHT';
type OverlayScale='SMALL'|'MEDIUM'|'LARGE';
type BuybackPlacement='ROW'|'TOP'|'OFF';
type EconomyMode='LOCAL_EXACT'|'ESTIMATED'|'SPECTATOR_EXACT';
type EconomySettings={
  economyEnabled:boolean;
  economyMode:EconomyMode;
  side:OverlaySide;
  scale:OverlayScale;
  opacity:number;
  sort:'TEAM'|'NET_WORTH';
  showAllies:boolean;
  showEnemies:boolean;
  buybackPlacement:BuybackPlacement;
};

type DotaFlowApi={
  getOverlaySettings:()=>Promise<unknown>;
  setOverlaySettings:(settings:unknown)=>Promise<unknown>;
  showOverlay:()=>Promise<unknown>;
  hideOverlay:()=>Promise<unknown>;
  onOverlaySettings:(listener:(settings:unknown)=>void)=>()=>void;
  onGepEnvelope:(listener:(envelope:unknown)=>void)=>()=>void;
};
declare global{interface Window{dotaFlow?:DotaFlowApi}}

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

const STORAGE_KEY='trust-economy-overlay-settings';
const LEDGER_KEY='trust-economy-live-ledger-v1';
const DEFAULT_BUYBACK_COOLDOWN_SEC=420;
const defaults:EconomySettings={
  economyEnabled:false,
  economyMode:'LOCAL_EXACT',
  side:'LEFT',
  scale:'MEDIUM',
  opacity:.9,
  sort:'TEAM',
  showAllies:true,
  showEnemies:true,
  buybackPlacement:'ROW'
};
let settings:EconomySettings=loadLocal();
let ledger:LiveLedger=loadLedger();
let latestSnapshot:any=null;
let settingsCard:HTMLElement|null=null;
let overlayPanel:HTMLElement|null=null;
let offRuntime:(()=>void)|null=null;
let offSettings:(()=>void)|null=null;
let offGep:(()=>void)|null=null;
let tickTimer:number|null=null;

function language(){return document.documentElement.lang==='en'?'en':'ru'}
const copy={
  ru:{
    kicker:'Оверлей матча',title:'Панель экономики',description:'Точный собственный нетворс и только явно помеченные оценки других игроков.',
    enabled:'Показывать панель',mode:'Режим данных',local:'Только точный собственный',estimated:'Оценочные данные',spectator:'Точные данные наблюдателя',
    side:'Сторона',left:'Слева',right:'Справа',scale:'Размер',small:'Маленький',medium:'Средний',large:'Большой',
    opacity:'Прозрачность',sort:'Сортировка',team:'По команде',networth:'По нетворсу',allies:'Показывать союзников',enemies:'Показывать врагов',
    buybacks:'Таймеры байбека',row:'Возле строки игрока',top:'В верхней ленте панели',off:'Выключены',
    exact:'ТОЧНО',estimate:'ОЦЕНКА',stale:'УСТАРЕЛО',unavailable:'НЕТ ДАННЫХ',networthLabel:'НЕТВОРС',buyback:'ББ',localHero:'Твой герой',
    buybackStrip:'ПОДТВЕРЖДЁННЫЕ БАЙБЕКИ',noBuybacks:'Нет активных подтверждённых таймеров',
    limitation:'Стандартный GEP не раскрывает точный нетворс врагов. Диапазон появляется только по реально полученным публичным предметам, уровню или ластхитам; неподтверждённый байбек не запускает таймер.'
  },
  en:{
    kicker:'Match overlay',title:'Economy panel',description:'Exact local net worth and clearly marked estimates for other players only.',
    enabled:'Show panel',mode:'Data mode',local:'Exact local only',estimated:'Estimated players',spectator:'Exact spectator data',
    side:'Side',left:'Left',right:'Right',scale:'Size',small:'Small',medium:'Medium',large:'Large',
    opacity:'Opacity',sort:'Sort',team:'Team order',networth:'Net worth',allies:'Show allies',enemies:'Show enemies',
    buybacks:'Buyback timers',row:'Beside player row',top:'Top hero strip',off:'Off',
    exact:'EXACT',estimate:'ESTIMATE',stale:'STALE',unavailable:'UNAVAILABLE',networthLabel:'NET WORTH',buyback:'BB',localHero:'Your hero',
    buybackStrip:'CONFIRMED BUYBACKS',noBuybacks:'No active confirmed timers',
    limitation:'Standard GEP does not expose exact enemy net worth. A range appears only from received public items, level or last-hit evidence, and an unconfirmed buyback never starts a timer.'
  }
}as const;
function c(){return copy[language()]}

function objectOf(value:unknown):Record<string,unknown>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}}
function finite(value:unknown):number|null{const number=Number(value);return Number.isFinite(number)?number:null}
function safeSettings(value:unknown):EconomySettings{
  const raw=objectOf(value);
  return{
    economyEnabled:raw.economyEnabled===true,
    economyMode:['LOCAL_EXACT','ESTIMATED','SPECTATOR_EXACT'].includes(String(raw.economyMode))?raw.economyMode as EconomyMode:defaults.economyMode,
    side:String(raw.side)==='RIGHT'?'RIGHT':'LEFT',
    scale:['SMALL','MEDIUM','LARGE'].includes(String(raw.scale))?raw.scale as OverlayScale:defaults.scale,
    opacity:Math.min(1,Math.max(.35,Number(raw.opacity)||defaults.opacity)),
    sort:String(raw.sort)==='NET_WORTH'?'NET_WORTH':'TEAM',
    showAllies:raw.showAllies!==false,
    showEnemies:raw.showEnemies!==false,
    buybackPlacement:['ROW','TOP','OFF'].includes(String(raw.buybackPlacement))?raw.buybackPlacement as BuybackPlacement:defaults.buybackPlacement
  };
}
function safeObservation(value:unknown):BuybackObservation|null{
  const raw=objectOf(value),remainingSec=finite(raw.remainingSec),observedAtWallMs=finite(raw.observedAtWallMs);
  if(remainingSec===null||observedAtWallMs===null||!String(raw.id??''))return null;
  return{id:String(raw.id),hero:raw.hero?String(raw.hero):undefined,team:raw.team?String(raw.team):undefined,steamId:raw.steamId?String(raw.steamId):undefined,remainingSec:Math.max(0,remainingSec),cost:finite(raw.cost),observedAtWallMs,confirmed:raw.confirmed===true};
}
function safeLedger(value:unknown):LiveLedger{
  const raw=objectOf(value),playersRaw=objectOf(raw.players),players:Record<string,BuybackObservation>={};
  for(const[key,entry]of Object.entries(playersRaw)){const observation=safeObservation(entry);if(observation)players[key]=observation}
  return{matchId:raw.matchId==null?null:String(raw.matchId),local:safeObservation(raw.local),players};
}
function loadLocal(){try{return safeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)??'{}'))}catch{return{...defaults}}}
function loadLedger(){try{return safeLedger(JSON.parse(localStorage.getItem(LEDGER_KEY)??'{}'))}catch{return{matchId:null,local:null,players:{}}}}
function persistLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(settings))}
function persistLedger(){localStorage.setItem(LEDGER_KEY,JSON.stringify(ledger))}
async function save(patch:Partial<EconomySettings>){
  settings=safeSettings({...settings,...patch});persistLocal();renderSettingsCard();renderOverlay();
  try{await window.dotaFlow?.setOverlaySettings(settings);if(settings.economyEnabled)await window.dotaFlow?.showOverlay();else await window.dotaFlow?.hideOverlay()}catch{/* browser preview */}
}

function field(label:string,control:HTMLElement){const wrap=document.createElement('label');wrap.className='economy-setting-field';const span=document.createElement('span');span.textContent=label;wrap.append(span,control);return wrap}
function select(value:string,options:Array<[string,string]>,onChange:(value:string)=>void){const node=document.createElement('select');for(const[o,label]of options){const option=document.createElement('option');option.value=o;option.textContent=label;node.append(option)}node.value=value;node.onchange=()=>onChange(node.value);return node}
function checkbox(label:string,checked:boolean,onChange:(checked:boolean)=>void){const wrap=document.createElement('label');wrap.className='economy-check';const input=document.createElement('input');input.type='checkbox';input.checked=checked;input.onchange=()=>onChange(input.checked);const span=document.createElement('span');span.textContent=label;wrap.append(input,span);return wrap}

function buildSettingsCard(){
  const card=document.createElement('section');card.className='card economy-settings-card';card.dataset.economySettings='true';
  const title=document.createElement('div');title.innerHTML='<p class="kicker"></p><h2></h2><p class="subtle"></p>';card.append(title);
  const controls=document.createElement('div');controls.className='economy-settings-controls';card.append(controls);
  const note=document.createElement('p');note.className='economy-limit';card.append(note);
  return card;
}
function renderSettingsCard(){
  if(location.pathname!=='/settings')return;
  const grid=document.querySelector<HTMLElement>('.settings-grid');if(!grid)return;
  if(!settingsCard||!settingsCard.isConnected){settingsCard=buildSettingsCard();grid.append(settingsCard)}
  const text=c();settingsCard.querySelector<HTMLElement>('.kicker')!.textContent=text.kicker;settingsCard.querySelector<HTMLElement>('h2')!.textContent=text.title;settingsCard.querySelector<HTMLElement>('.subtle')!.textContent=text.description;settingsCard.querySelector<HTMLElement>('.economy-limit')!.textContent=text.limitation;
  const controls=settingsCard.querySelector<HTMLElement>('.economy-settings-controls')!;controls.replaceChildren();
  controls.append(
    checkbox(text.enabled,settings.economyEnabled,value=>void save({economyEnabled:value})),
    field(text.mode,select(settings.economyMode,[["LOCAL_EXACT",text.local],["ESTIMATED",text.estimated],["SPECTATOR_EXACT",text.spectator]],value=>void save({economyMode:value as EconomyMode}))),
    field(text.side,select(settings.side,[["LEFT",text.left],["RIGHT",text.right]],value=>void save({side:value as OverlaySide}))),
    field(text.scale,select(settings.scale,[["SMALL",text.small],["MEDIUM",text.medium],["LARGE",text.large]],value=>void save({scale:value as OverlayScale}))),
    field(text.sort,select(settings.sort,[["TEAM",text.team],["NET_WORTH",text.networth]],value=>void save({sort:value as EconomySettings['sort']}))),
    field(text.buybacks,select(settings.buybackPlacement,[["ROW",text.row],["TOP",text.top],["OFF",text.off]],value=>void save({buybackPlacement:value as BuybackPlacement}))),
    checkbox(text.allies,settings.showAllies,value=>void save({showAllies:value})),
    checkbox(text.enemies,settings.showEnemies,value=>void save({showEnemies:value}))
  );
  const range=document.createElement('input');range.type='range';range.min='35';range.max='100';range.value=String(Math.round(settings.opacity*100));range.oninput=()=>void save({opacity:Number(range.value)/100});controls.append(field(`${text.opacity}: ${Math.round(settings.opacity*100)}%`,range));
}

function projectedState(snapshot:any){return snapshot?.state??snapshot?.diagnostics?.pipeline?.state??snapshot?.bridge?.pipeline?.state??{}}
function normalizeHero(value:unknown){return String(value??'').replace(/^npc_dota_hero_/,'').trim().toLowerCase()}
function heroName(hero:string){return hero.replace(/^npc_dota_hero_/,'').split('_').map(part=>part?part[0].toUpperCase()+part.slice(1):part).join(' ')}
function formatGold(value:number|null){return value==null?'?':Math.round(value).toLocaleString(language()==='ru'?'ru-RU':'en-US')}
function formatTimer(seconds:number|null){if(seconds==null)return'';const value=Math.max(0,Math.ceil(seconds));return`${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`}
function observationId(raw:Record<string,unknown>,fallback='local'){
  const steam=raw.steamId??raw.steam_id;if(steam!=null&&String(steam))return`steam:${String(steam)}`;
  const team=String(raw.team??raw.team_name??'unknown').toLowerCase(),hero=normalizeHero(raw.hero??raw.hero_name??raw.name);
  return hero?`${team}:${hero}`:fallback;
}
function remainingNow(observation:BuybackObservation|null){if(!observation)return null;const elapsed=Math.max(0,(Date.now()-observation.observedAtWallMs)/1000);return Math.max(0,Math.ceil(observation.remainingSec-elapsed))}
function syncLedgerMatch(state:any){
  const next=state?.matchId==null?null:String(state.matchId);
  if(next&&ledger.matchId&&next!==ledger.matchId){ledger={matchId:next,local:null,players:{}};persistLedger();return}
  if(next&&!ledger.matchId){ledger={...ledger,matchId:next};persistLedger()}
}
function storeObservation(raw:Record<string,unknown>,remainingSec:number,cost:number|null,confirmed:boolean,local:boolean){
  const state=projectedState(latestSnapshot),base={...raw,hero:raw.hero??state.hero,team:raw.team??state.team,steamId:raw.steamId??raw.steam_id??state.steamId};
  const id=observationId(base,local?'local':'unknown');
  const observation:BuybackObservation={id,hero:normalizeHero(base.hero),team:String(base.team??'unknown').toLowerCase(),steamId:base.steamId==null?undefined:String(base.steamId),remainingSec:Math.max(0,remainingSec),cost,observedAtWallMs:Date.now(),confirmed};
  if(local)ledger.local=observation;else ledger.players[id]=observation;
  persistLedger();renderOverlay();
}
function parseMaybeJson(value:unknown):unknown{if(typeof value!=='string')return value;try{return JSON.parse(value)}catch{return value}}
function eventCandidates(payload:unknown):Record<string,unknown>[] {
  if(Array.isArray(payload))return payload.flatMap(eventCandidates);
  const raw=objectOf(payload);
  if(Array.isArray(raw.events))return(raw.events as unknown[]).flatMap(eventCandidates);
  return Object.keys(raw).length?[raw]:[];
}
function handleRawEvent(raw:Record<string,unknown>){
  const name=String(raw.name??raw.feature??raw.event??'');
  const parsed=parseMaybeJson(raw.data??raw.value??raw),data=objectOf(parsed);
  if(name==='gsi_snapshot'){
    const cooldown=finite(data.buybackCooldownSec??data.buyback_cooldown),cost=finite(data.buybackCost??data.buyback_cost);
    if(cooldown!==null)storeObservation(data,cooldown,cost,true,true);
    return;
  }
  if(name==='hero_buyback_info_changed'){
    const cooldown=finite(data.buyback_cooldown??data.buybackCooldownSec??data.cooldown),cost=finite(data.buyback_cost??data.buybackCost);
    if(cooldown!==null)storeObservation(data,cooldown,cost,true,true);
    return;
  }
  if(name==='hero_boughtback'||name==='player_boughtback'){
    const state=projectedState(latestSnapshot),hero=normalizeHero(data.hero??data.hero_name),local=!hero||hero===normalizeHero(state.hero)||data.local===true||data.isLocalPlayer===true;
    storeObservation(data,finite(data.buyback_cooldown??data.cooldown)??DEFAULT_BUYBACK_COOLDOWN_SEC,finite(data.buyback_cost),true,local);
  }
}
function handleGepEnvelope(value:unknown){
  const envelope=objectOf(value);if(String(envelope.type)!=='game-event')return;
  for(const raw of eventCandidates(envelope.payload))handleRawEvent(raw);
}
function stateWithLedger(){
  const state={...projectedState(latestSnapshot)};syncLedgerMatch(state);
  const localRemaining=remainingNow(ledger.local);
  if(localRemaining!==null){state.buybackCooldownSec=localRemaining;state.buybackCost=ledger.local?.cost}
  const roster=Array.isArray(state.roster)?state.roster.map((entry:any)=>({...entry})):[];
  for(const player of roster){
    const id=observationId(objectOf(player));const observation=ledger.players[id];if(!observation)continue;
    player.buybackCooldownSec=remainingNow(observation);player.buybackCost=observation.cost;player.buybackConfirmed=true;
  }
  state.roster=roster;
  return state;
}
function qualityLabel(quality:string){const text=c();return quality==='EXACT'?text.exact:quality==='ESTIMATE'?text.estimate:quality==='STALE'?text.stale:text.unavailable}
function rowHtml(row:EconomyOverlayModel['rows'][number]){
  const text=c(),quality=row.economy.quality;
  const value=(quality==='ESTIMATE'||quality==='STALE')&&row.economy.low!=null&&row.economy.high!=null?`${formatGold(row.economy.low)}–${formatGold(row.economy.high)}`:formatGold(row.economy.value);
  const buyback=settings.buybackPlacement==='ROW'&&row.buybackRemainingSec!=null&&row.buybackRemainingSec>0?`<span class="economy-buyback">${text.buyback}${row.buybackCost!=null?` ${formatGold(row.buybackCost)} ·`:''} ${formatTimer(row.buybackRemainingSec)}</span>`:'';
  return`<div class="economy-row ${row.local?'local':''}" data-team="${row.team}"><span class="economy-hero-dot"></span><div class="economy-player"><b>${heroName(row.hero)}</b><small>${row.local?text.localHero:row.team}</small></div><div class="economy-value"><strong>${quality==='ESTIMATE'?'~':''}${value}</strong><small class="quality-${quality.toLowerCase()}">${qualityLabel(quality)}</small></div>${buyback}</div>`;
}
function topBuybackHtml(rows:EconomyOverlayModel['rows']){
  if(settings.buybackPlacement!=='TOP')return'';
  const text=c(),active=rows.filter(row=>row.buybackRemainingSec!=null&&row.buybackRemainingSec>0);
  return`<section class="economy-buyback-strip"><span>${text.buybackStrip}</span><div>${active.length?active.map(row=>`<article class="${row.local?'local':''}"><i>${heroName(row.hero).slice(0,2).toUpperCase()}</i><b>${heroName(row.hero)}</b><strong>${formatTimer(row.buybackRemainingSec)}</strong></article>`).join(''):`<small>${text.noBuybacks}</small>`}</div></section>`;
}
function renderOverlay(){
  if(location.pathname!=='/overlay')return;
  document.body.classList.toggle('economy-overlay-active',settings.economyEnabled);
  document.body.dataset.economySide=settings.side.toLowerCase();document.body.dataset.economyScale=settings.scale.toLowerCase();
  if(!overlayPanel||!overlayPanel.isConnected){overlayPanel=document.createElement('section');overlayPanel.className='economy-overlay-panel';document.querySelector('.overlay-root')?.append(overlayPanel)}
  overlayPanel.style.opacity=String(settings.opacity);
  if(!settings.economyEnabled){overlayPanel.hidden=true;return}overlayPanel.hidden=false;
  const state=stateWithLedger(),model=buildEconomyOverlayModel(state,{...settings,staleAfterSec:45});const text=c();
  const rows=settings.economyMode==='LOCAL_EXACT'?model.rows.filter(row=>row.local):model.rows;
  overlayPanel.innerHTML=`<header><div><span>${text.networthLabel}</span><b>TRUST ECONOMY</b></div><i class="economy-live-dot"></i></header>${topBuybackHtml(rows)}<div class="economy-rows">${rows.map(rowHtml).join('')}</div><footer><span>${model.exactCount} ${text.exact}</span><span>${model.estimatedCount} ${text.estimate}</span><span>${model.staleCount} ${text.stale}</span></footer>`;
}

async function loadElectronSettings(){try{const value=await window.dotaFlow?.getOverlaySettings();if(value){settings=safeSettings({...settings,...objectOf(value)});persistLocal()}}catch{/* browser preview */}renderSettingsCard();renderOverlay()}
async function loadInitialSnapshot(){try{const value=await window.dotaFlowRuntime?.invoke('runtime:get-snapshot');if(value){latestSnapshot=value;syncLedgerMatch(projectedState(value))}}catch{/* browser preview */}renderOverlay()}
function syncTheme(){const theme=localStorage.getItem('trust-theme');if(theme)document.documentElement.dataset.theme=theme;document.documentElement.lang=localStorage.getItem('trust-language')==='en'?'en':'ru';renderSettingsCard();renderOverlay()}
function boot(){
  syncTheme();void Promise.all([loadElectronSettings(),loadInitialSnapshot()]);
  const observer=new MutationObserver(()=>{renderSettingsCard();renderOverlay()});observer.observe(document.documentElement,{subtree:true,childList:true});
  addEventListener('popstate',()=>queueMicrotask(()=>{renderSettingsCard();renderOverlay()}));
  addEventListener('storage',event=>{if(event.key==='trust-theme'||event.key==='trust-language')syncTheme();if(event.key===STORAGE_KEY){settings=loadLocal();renderSettingsCard();renderOverlay()}if(event.key===LEDGER_KEY){ledger=loadLedger();renderOverlay()}});
  offRuntime=window.dotaFlowRuntime?.subscribe(snapshot=>{latestSnapshot=snapshot;syncLedgerMatch(projectedState(snapshot));renderOverlay()})??null;
  offSettings=window.dotaFlow?.onOverlaySettings(value=>{settings=safeSettings({...settings,...objectOf(value)});persistLocal();renderSettingsCard();renderOverlay()})??null;
  offGep=window.dotaFlow?.onGepEnvelope(handleGepEnvelope)??null;
  tickTimer=window.setInterval(()=>{if(settings.economyEnabled&&location.pathname==='/overlay')renderOverlay()},1000);
}

boot();
addEventListener('beforeunload',()=>{offRuntime?.();offSettings?.();offGep?.();if(tickTimer!==null)clearInterval(tickTimer)},{once:true});
