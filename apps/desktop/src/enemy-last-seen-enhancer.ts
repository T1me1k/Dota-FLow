import type { RuntimeSnapshot } from './runtime/provider';
import './enemy-last-seen-enhancer.css';

type LastSeenStatus='VISIBLE'|'MISSING'|'DEAD'|'DISCONNECTED'|'UNKNOWN';
type LastSeenRow={id:string;hero?:string;status:LastSeenStatus;elapsedSec?:number|null;timerVisible?:boolean;confidence?:number;source?:string;pending?:boolean};
type LastSeenModel={status?:string;sourceStatus?:string;source?:string;rows?:LastSeenRow[];missingCount?:number;visibleCount?:number;confidence?:number;dataQuality?:string;missingSignals?:string[];limitations?:string[]};
type LastSeenSettings={lastSeenEnabled:boolean;lastSeenOverlayEnabled:boolean;lastSeenShowVisible:boolean;lastSeenSampleHz:2|4|6};
type DotaFlowApi={getOverlaySettings:()=>Promise<unknown>;setOverlaySettings:(settings:unknown)=>Promise<unknown>;showOverlay:()=>Promise<unknown>;hideOverlay:()=>Promise<unknown>};

const SNAPSHOT_EVENT='dota-flow:runtime-snapshot';
const STORAGE_KEY='trust-enemy-last-seen-settings-v1';
const defaults:LastSeenSettings={lastSeenEnabled:false,lastSeenOverlayEnabled:true,lastSeenShowVisible:true,lastSeenSampleHz:4};
let settings=loadLocal();
let latest:RuntimeSnapshot&{enemyLastSeen?:LastSeenModel}|null=null;
let settingsCard:HTMLElement|null=null;
let liveCard:HTMLElement|null=null;
let overlayPanel:HTMLElement|null=null;
let queued=false;

const copy={
  ru:{kicker:'Информация с миникарты',title:'Таймеры пропавших врагов',description:'Отсчёт появляется только после подтверждённого исчезновения видимого врага.',enabled:'Включить таймеры',overlay:'Показывать поверх игры',showVisible:'Показывать видимых врагов без таймера',sample:'Частота проверки миникарты',hz:'кадра/с',seconds:'с',source:'Источник',missing:'Не виден',visible:'Виден',dead:'Мёртв',disconnected:'Отключён',unknown:'Нет сигнала',unavailable:'Сигнал видимости пока не подключён',noEnemies:'Нет подтверждённых врагов',privacy:'Таймер не содержит скрытую позицию. При появлении врага он сразу сбрасывается.',quality:'Качество',missingCount:'Пропали'},
  en:{kicker:'Minimap information',title:'Enemy missing timers',description:'A timer starts only after a visible enemy is confirmed to have disappeared.',enabled:'Enable timers',overlay:'Show over the game',showVisible:'Show visible enemies without a timer',sample:'Minimap sampling rate',hz:'frames/s',seconds:'s',source:'Source',missing:'Missing',visible:'Visible',dead:'Dead',disconnected:'Disconnected',unknown:'No signal',unavailable:'Visibility source is not connected yet',noEnemies:'No confirmed enemies',privacy:'The timer never contains a hidden location and resets immediately when the enemy reappears.',quality:'Quality',missingCount:'Missing'}
}as const;

function language(){return document.documentElement.lang.toLowerCase().startsWith('en')?'en':'ru'}
function c(){return copy[language()]}
function objectOf(value:unknown):Record<string,unknown>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{} }
function api():DotaFlowApi|undefined{return(window as unknown as{dotaFlow?:DotaFlowApi}).dotaFlow}
function setText(element:Element|null,value:unknown){if(!element)return;const next=String(value??'');if(element.textContent!==next)element.textContent=next}
function safeSettings(value:unknown):LastSeenSettings{
  const raw=objectOf(value),sample=Number(raw.lastSeenSampleHz);
  return{lastSeenEnabled:raw.lastSeenEnabled===true,lastSeenOverlayEnabled:raw.lastSeenOverlayEnabled!==false,lastSeenShowVisible:raw.lastSeenShowVisible!==false,lastSeenSampleHz:(sample===2||sample===6?sample:4)as 2|4|6};
}
function loadLocal(){try{return safeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)??'{}'))}catch{return{...defaults}}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(settings))}
async function save(patch:Partial<LastSeenSettings>){
  settings=safeSettings({...settings,...patch});persist();renderAll();
  const bridge=api();if(!bridge)return;
  try{
    const remote=objectOf(await bridge.getOverlaySettings());
    await bridge.setOverlaySettings({...settings});
    const shouldShow=(settings.lastSeenEnabled&&settings.lastSeenOverlayEnabled)||remote.economyEnabled===true;
    if(shouldShow)await bridge.showOverlay();else await bridge.hideOverlay();
  }catch{/* browser preview */}
}
async function loadRemote(){
  const bridge=api();if(!bridge)return;
  try{const remote=objectOf(await bridge.getOverlaySettings());settings=safeSettings({...settings,...remote});persist();renderAll()}catch{/* startup race */}
}
function checkbox(label:string,checked:boolean,onChange:(value:boolean)=>void){const wrap=document.createElement('label');wrap.className='enemy-last-seen-check';const input=document.createElement('input');input.type='checkbox';input.checked=checked;input.onchange=()=>onChange(input.checked);const span=document.createElement('span');span.textContent=label;wrap.append(input,span);return wrap}
function field(label:string,control:HTMLElement){const wrap=document.createElement('label');wrap.className='enemy-last-seen-field';const span=document.createElement('span');span.textContent=label;wrap.append(span,control);return wrap}
function select(value:string,options:Array<[string,string]>,onChange:(value:string)=>void){const node=document.createElement('select');for(const[item,label]of options){const option=document.createElement('option');option.value=item;option.textContent=label;node.append(option)}node.value=value;node.onchange=()=>onChange(node.value);return node}
function buildSettingsCard(){const card=document.createElement('section');card.className='card enemy-last-seen-settings-card';card.dataset.enemyLastSeenSettings='true';card.innerHTML='<p class="kicker"></p><h2></h2><p class="subtle"></p><div class="enemy-last-seen-settings-controls"></div><p class="enemy-last-seen-limit"></p>';return card}
function renderSettings(){
  if(location.pathname!=='/settings')return;
  const grid=document.querySelector<HTMLElement>('.settings-grid');if(!grid)return;
  if(!settingsCard||!settingsCard.isConnected){settingsCard=buildSettingsCard();grid.append(settingsCard)}
  const signature=JSON.stringify([language(),settings]);if(settingsCard.dataset.signature===signature)return;settingsCard.dataset.signature=signature;
  const text=c();setText(settingsCard.querySelector('.kicker'),text.kicker);setText(settingsCard.querySelector('h2'),text.title);setText(settingsCard.querySelector('.subtle'),text.description);setText(settingsCard.querySelector('.enemy-last-seen-limit'),text.privacy);
  const controls=settingsCard.querySelector<HTMLElement>('.enemy-last-seen-settings-controls')!;controls.replaceChildren(
    checkbox(text.enabled,settings.lastSeenEnabled,value=>void save({lastSeenEnabled:value})),
    checkbox(text.overlay,settings.lastSeenOverlayEnabled,value=>void save({lastSeenOverlayEnabled:value})),
    checkbox(text.showVisible,settings.lastSeenShowVisible,value=>void save({lastSeenShowVisible:value})),
    field(text.sample,select(String(settings.lastSeenSampleHz),[['2',`2 ${text.hz}`],['4',`4 ${text.hz}`],['6',`6 ${text.hz}`]],value=>void save({lastSeenSampleHz:Number(value)as 2|4|6})))
  )
}
function model():LastSeenModel{
  const direct=latest?.enemyLastSeen;
  if(direct)return direct;
  const raw=latest as unknown as{diagnostics?:{pipeline?:{enemyLastSeen?:LastSeenModel}},bridge?:{pipeline?:{enemyLastSeen?:LastSeenModel}}};
  return raw?.diagnostics?.pipeline?.enemyLastSeen??raw?.bridge?.pipeline?.enemyLastSeen??{};
}
function heroName(value:unknown){const id=String(value??'').replace(/^npc_dota_hero_/,'');return id?id.split('_').map(part=>part?part[0].toUpperCase()+part.slice(1):part).join(' '):'Enemy'}
function statusText(status:LastSeenStatus){const text=c();if(status==='MISSING')return text.missing;if(status==='VISIBLE')return text.visible;if(status==='DEAD')return text.dead;if(status==='DISCONNECTED')return text.disconnected;return text.unknown}
function statusClass(status:LastSeenStatus){if(status==='MISSING')return'missing';if(status==='VISIBLE')return'visible';if(status==='DEAD')return'dead';if(status==='DISCONNECTED')return'disconnected';return'unknown'}
function visibleRows(data:LastSeenModel){const rows=Array.isArray(data.rows)?data.rows:[];return settings.lastSeenShowVisible?rows:rows.filter(row=>row.status!=='VISIBLE')}
function renderRows(container:HTMLElement,data:LastSeenModel){
  const rows=visibleRows(data),signature=JSON.stringify([language(),rows.map(row=>[row.id,row.status,row.elapsedSec,row.pending])]);if(container.dataset.signature===signature)return;container.dataset.signature=signature;
  if(!rows.length){const empty=document.createElement('p');empty.className='enemy-last-seen-empty';empty.textContent=data.sourceStatus==='LIVE'?c().noEnemies:c().unavailable;container.replaceChildren(empty);return}
  container.replaceChildren(...rows.map(row=>{const article=document.createElement('article');article.className=`enemy-last-seen-row ${statusClass(row.status)}`;article.innerHTML='<i></i><span><b></b><small></small></span><strong></strong>';setText(article.querySelector('i'),heroName(row.hero).slice(0,2).toUpperCase());setText(article.querySelector('b'),heroName(row.hero));setText(article.querySelector('small'),statusText(row.status));const value=article.querySelector<HTMLElement>('strong')!;value.textContent=row.status==='MISSING'&&row.timerVisible?`${Math.max(0,Math.floor(Number(row.elapsedSec)||0))}${c().seconds}`:'';value.hidden=!value.textContent;return article}))
}
function buildPanel(kind:'live'|'overlay'){const panel=document.createElement('section');panel.className=kind==='live'?'card enemy-last-seen-card':'enemy-last-seen-overlay-panel';panel.dataset.enemyLastSeenPanel=kind;panel.innerHTML='<header><div><small class="kicker"></small><h3></h3></div><span class="enemy-last-seen-source"></span></header><div class="enemy-last-seen-summary"></div><div class="enemy-last-seen-rows"></div><footer></footer>';return panel}
function renderPanel(panel:HTMLElement,data:LastSeenModel){const text=c();setText(panel.querySelector('.kicker'),text.kicker);setText(panel.querySelector('h3'),text.title);setText(panel.querySelector('.enemy-last-seen-source'),`${text.source}: ${String(data.sourceStatus??'UNAVAILABLE')}`);setText(panel.querySelector('.enemy-last-seen-summary'),`${text.missingCount}: ${Number(data.missingCount)||0} · ${text.quality}: ${String(data.dataQuality??'UNAVAILABLE')}`);setText(panel.querySelector('footer'),text.privacy);renderRows(panel.querySelector<HTMLElement>('.enemy-last-seen-rows')!,data)}
function renderLive(){
  if(location.pathname!=='/live')return;
  if(!settings.lastSeenEnabled){liveCard?.remove();liveCard=null;return}
  const host=document.querySelector<HTMLElement>('.live-layout .stack')??document.querySelector<HTMLElement>('.live-layout');if(!host)return;
  if(!liveCard||!liveCard.isConnected){liveCard=buildPanel('live');host.append(liveCard)}renderPanel(liveCard,model())
}
function renderOverlay(){
  if(location.pathname!=='/overlay')return;
  const active=settings.lastSeenEnabled&&settings.lastSeenOverlayEnabled;document.body.classList.toggle('enemy-last-seen-overlay-active',active);
  if(!active){overlayPanel?.remove();overlayPanel=null;return}
  const host=document.querySelector<HTMLElement>('.overlay-root')??document.body;if(!overlayPanel||!overlayPanel.isConnected){overlayPanel=buildPanel('overlay');host.prepend(overlayPanel)}renderPanel(overlayPanel,model())
}
function renderAll(){queued=false;renderSettings();renderLive();renderOverlay()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(renderAll)}
window.addEventListener(SNAPSHOT_EVENT,event=>{latest=(event as CustomEvent<RuntimeSnapshot&{enemyLastSeen?:LastSeenModel}>).detail;schedule()});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY){settings=loadLocal();schedule()}});
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang'],childList:true,subtree:true});
void loadRemote();schedule();
