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
};
type RuntimeApi={subscribe:(listener:(snapshot:unknown)=>void)=>()=>void};
declare global{interface Window{dotaFlow?:DotaFlowApi;dotaFlowRuntime?:RuntimeApi}}

const STORAGE_KEY='trust-economy-overlay-settings';
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
let latestSnapshot:any=null;
let settingsCard:HTMLElement|null=null;
let overlayPanel:HTMLElement|null=null;
let offRuntime:(()=>void)|null=null;
let offSettings:(()=>void)|null=null;

function language(){return document.documentElement.lang==='en'?'en':'ru'}
const copy={
  ru:{
    kicker:'Оверлей матча',title:'Панель экономики',description:'Точный собственный нетворс и только явно помеченные оценки других игроков.',
    enabled:'Показывать панель',mode:'Режим данных',local:'Только точный собственный',estimated:'Оценочные данные',spectator:'Точные данные наблюдателя',
    side:'Сторона',left:'Слева',right:'Справа',scale:'Размер',small:'Маленький',medium:'Средний',large:'Большой',
    opacity:'Прозрачность',sort:'Сортировка',team:'По команде',networth:'По нетворсу',allies:'Показывать союзников',enemies:'Показывать врагов',
    buybacks:'Таймеры байбека',row:'Возле нетворса',top:'Под верхней иконкой (после подключения сигнала)',off:'Выключены',
    exact:'ТОЧНО',estimate:'ОЦЕНКА',unavailable:'НЕТ ДАННЫХ',networthLabel:'НЕТВОРС',buyback:'ББ',localHero:'Твой герой',
    limitation:'Вражеская цифра появляется только как диапазон по публичным сигналам. Скрытые значения не используются.'
  },
  en:{
    kicker:'Match overlay',title:'Economy panel',description:'Exact local net worth and clearly marked estimates for other players only.',
    enabled:'Show panel',mode:'Data mode',local:'Exact local only',estimated:'Estimated players',spectator:'Exact spectator data',
    side:'Side',left:'Left',right:'Right',scale:'Size',small:'Small',medium:'Medium',large:'Large',
    opacity:'Opacity',sort:'Sort',team:'Team order',networth:'Net worth',allies:'Show allies',enemies:'Show enemies',
    buybacks:'Buyback timers',row:'Beside economy row',top:'Below top hero icon (when signal exists)',off:'Off',
    exact:'EXACT',estimate:'ESTIMATE',unavailable:'UNAVAILABLE',networthLabel:'NET WORTH',buyback:'BB',localHero:'Your hero',
    limitation:'Enemy values appear only as ranges from public signals. Hidden values are never used.'
  }
}as const;
function c(){return copy[language()]}

function safeSettings(value:unknown):EconomySettings{
  const raw=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
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
function loadLocal(){try{return safeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)??'{}'))}catch{return{...defaults}}}
function persistLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(settings))}
async function save(patch:Partial<EconomySettings>){
  settings=safeSettings({...settings,...patch});persistLocal();renderSettingsCard();renderOverlay();
  try{await window.dotaFlow?.setOverlaySettings(settings);if(settings.economyEnabled)await window.dotaFlow?.showOverlay();else await window.dotaFlow?.hideOverlay()}catch{/* browser preview */}
}

function field(label:string,control:HTMLElement){const wrap=document.createElement('label');wrap.className='economy-setting-field';const span=document.createElement('span');span.textContent=label;wrap.append(span,control);return wrap}
function select(value:string,options:Array<[string,string]>,onChange:(value:string)=>void){const node=document.createElement('select');for(const[o,label]of options){const option=document.createElement('option');option.value=o;option.textContent=label;node.append(option)}node.value=value;node.onchange=()=>onChange(node.value);return node}
function checkbox(label:string,checked:boolean,onChange:(checked:boolean)=>void){const wrap=document.createElement('label');wrap.className='economy-check';const input=document.createElement('input');input.type='checkbox';input.checked=checked;input.onchange=()=>onChange(input.checked);const span=document.createElement('span');span.textContent=label;wrap.append(input,span);return wrap}

function buildSettingsCard(){
  const card=document.createElement('section');card.className='card economy-settings-card';card.dataset.economySettings='true';
  const title=document.createElement('div');title.innerHTML=`<p class="kicker"></p><h2></h2><p class="subtle"></p>`;card.append(title);
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
function heroName(hero:string){return hero.replace(/^npc_dota_hero_/,'').split('_').map(part=>part?part[0].toUpperCase()+part.slice(1):part).join(' ')}
function formatGold(value:number|null){return value==null?'?':Math.round(value).toLocaleString(language()==='ru'?'ru-RU':'en-US')}
function formatTimer(seconds:number|null){if(seconds==null)return'';const value=Math.max(0,Math.ceil(seconds));return`${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`}
function rowHtml(row:EconomyOverlayModel['rows'][number]){
  const text=c();const quality=row.economy.quality;const value=quality==='ESTIMATE'&&row.economy.low!=null&&row.economy.high!=null?`${formatGold(row.economy.low)}–${formatGold(row.economy.high)}`:formatGold(row.economy.value);
  const buyback=settings.buybackPlacement==='ROW'&&row.buybackRemainingSec!=null?`<span class="economy-buyback">${text.buyback} ${formatTimer(row.buybackRemainingSec)}</span>`:'';
  return`<div class="economy-row ${row.local?'local':''}" data-team="${row.team}"><span class="economy-hero-dot"></span><div class="economy-player"><b>${heroName(row.hero)}</b><small>${row.local?text.localHero:row.team}</small></div><div class="economy-value"><strong>${quality==='ESTIMATE'?'~':''}${value}</strong><small class="quality-${quality.toLowerCase()}">${quality==='EXACT'?text.exact:quality==='ESTIMATE'?text.estimate:text.unavailable}</small></div>${buyback}</div>`;
}
function renderOverlay(){
  if(location.pathname!=='/overlay')return;
  document.body.classList.toggle('economy-overlay-active',settings.economyEnabled);
  document.body.dataset.economySide=settings.side.toLowerCase();document.body.dataset.economyScale=settings.scale.toLowerCase();
  if(!overlayPanel||!overlayPanel.isConnected){overlayPanel=document.createElement('section');overlayPanel.className='economy-overlay-panel';document.querySelector('.overlay-root')?.append(overlayPanel)}
  overlayPanel.style.opacity=String(settings.opacity);
  if(!settings.economyEnabled){overlayPanel.hidden=true;return}overlayPanel.hidden=false;
  const state=projectedState(latestSnapshot);const model=buildEconomyOverlayModel(state,settings);const text=c();
  const rows=settings.economyMode==='LOCAL_EXACT'?model.rows.filter(row=>row.local):model.rows;
  overlayPanel.innerHTML=`<header><div><span>${text.networthLabel}</span><b>TRUST ECONOMY</b></div><i class="economy-live-dot"></i></header><div class="economy-rows">${rows.map(rowHtml).join('')}</div><footer><span>${model.exactCount} ${text.exact}</span><span>${model.estimatedCount} ${text.estimate}</span></footer>`;
}

async function loadElectronSettings(){try{const value=await window.dotaFlow?.getOverlaySettings();if(value){settings=safeSettings({...settings,...value});persistLocal()}}catch{/* browser preview */}renderSettingsCard();renderOverlay()}
function syncTheme(){const theme=localStorage.getItem('trust-theme');if(theme)document.documentElement.dataset.theme=theme;document.documentElement.lang=localStorage.getItem('trust-language')==='en'?'en':'ru';renderSettingsCard();renderOverlay()}
function boot(){
  syncTheme();void loadElectronSettings();
  const observer=new MutationObserver(()=>{renderSettingsCard();renderOverlay()});observer.observe(document.documentElement,{subtree:true,childList:true});
  addEventListener('popstate',()=>queueMicrotask(()=>{renderSettingsCard();renderOverlay()}));
  addEventListener('storage',event=>{if(event.key==='trust-theme'||event.key==='trust-language')syncTheme();if(event.key===STORAGE_KEY){settings=loadLocal();renderSettingsCard();renderOverlay()}});
  offRuntime=window.dotaFlowRuntime?.subscribe(snapshot=>{latestSnapshot=snapshot;renderOverlay()})??null;
  offSettings=window.dotaFlow?.onOverlaySettings(value=>{settings=safeSettings({...settings,...value});persistLocal();renderSettingsCard();renderOverlay()})??null;
}

boot();
addEventListener('beforeunload',()=>{offRuntime?.();offSettings?.()},{once:true});
