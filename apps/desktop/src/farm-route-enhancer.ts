import type { RuntimeSnapshot } from './runtime/provider';
import './farm-route-enhancer.css';

const SNAPSHOT_EVENT='dota-flow:runtime-snapshot';
type FarmRouteNode={id:string;label:string;type:string;expectedGold:number;travelSec:number;clearSec:number;safety:string;risk:number};
type FarmRoute={status?:string;route?:FarmRouteNode[];nextNode?:FarmRouteNode|null;instructionRu?:string;instructionEn?:string;confidence?:number;reasons?:string[];blockers?:string[];missingSignals?:string[];dataQuality?:string;totalExpectedGold?:number;totalTravelSec?:number;totalClearSec?:number};
type SnapshotWithRoute=RuntimeSnapshot&{farmRoute?:FarmRoute};
let latest:SnapshotWithRoute|null=null;
let queued=false;

const copy={
  ru:{kicker:'Безопасный маршрут фарма',title:'Маршрут недоступен',details:'Полный маршрут',confidence:'уверенность',quality:'качество',gold:'золото',travel:'переход',clear:'зачистка',seconds:'с',missing:'Не хватает сигналов',blocked:'Маршрут заблокирован',noLive:'Нет подтверждённого безопасного маршрута.'},
  en:{kicker:'Safe farm route',title:'Route unavailable',details:'Full route',confidence:'confidence',quality:'quality',gold:'gold',travel:'travel',clear:'clear',seconds:'s',missing:'Missing signals',blocked:'Route blocked',noLive:'No confirmed safe route is available.'}
}as const;

function language(){return document.documentElement.lang.toLowerCase().startsWith('en')?'en':'ru'}
function c(){return copy[language()]}
function escapeText(value:unknown){return String(value??'').trim()}
function formatConfidence(value:unknown){const number=Number(value);return Number.isFinite(number)?`${Math.round(number*100)}%`:'—'}
function routeInstruction(route:FarmRoute){return escapeText(language()==='ru'?route.instructionRu:route.instructionEn)||c().title}

function ensureCard():HTMLElement|null{
  const host=document.querySelector<HTMLElement>('.live-layout .stack')??document.querySelector<HTMLElement>('.live-layout');
  if(!host)return null;
  let card=host.querySelector<HTMLElement>('[data-farm-route-card]');
  if(card)return card;
  card=document.createElement('section');
  card.className='card farm-route-card';
  card.dataset.farmRouteCard='true';
  card.innerHTML='<div class="farm-route-head"><div><small class="kicker" data-farm-route-kicker></small><h3 data-farm-route-title></h3></div><span class="badge muted" data-farm-route-status></span></div><p class="farm-route-summary" data-farm-route-summary></p><div class="farm-route-meta" data-farm-route-meta></div><details data-farm-route-details><summary></summary><ol data-farm-route-list></ol></details><p class="farm-route-limit" data-farm-route-limit></p>';
  host.append(card);
  return card;
}

function setText(root:ParentNode,selector:string,value:unknown){const element=root.querySelector<HTMLElement>(selector);const next=escapeText(value);if(element&&element.textContent!==next)element.textContent=next}
function statusClass(status:string){return status==='READY'?'green':status==='BLOCKED'?'orange':'muted'}

function renderList(list:HTMLOListElement,route:FarmRouteNode[]){
  const signature=JSON.stringify([language(),route.map(node=>[node.id,node.travelSec,node.clearSec,node.safety,node.expectedGold])]);
  if(list.dataset.signature===signature)return;
  list.dataset.signature=signature;
  list.replaceChildren(...route.map((node,index)=>{
    const item=document.createElement('li');
    item.innerHTML='<span class="farm-route-index"></span><span class="farm-route-node"><b></b><small></small></span><span class="farm-route-value"></span>';
    setText(item,'.farm-route-index',index+1);
    setText(item,'.farm-route-node b',node.label);
    setText(item,'.farm-route-node small',`${node.type} · ${node.safety}`);
    setText(item,'.farm-route-value',`${node.expectedGold} ${c().gold} · ${node.travelSec}${c().seconds}+${node.clearSec}${c().seconds}`);
    return item;
  }));
}

function render(){
  queued=false;
  const card=ensureCard();
  if(!card||!latest)return;
  const route=latest.farmRoute??{};
  const status=escapeText(route.status||'UNAVAILABLE').toUpperCase();
  const nodes=Array.isArray(route.route)?route.route:[];
  setText(card,'[data-farm-route-kicker]',c().kicker);
  setText(card,'[data-farm-route-title]',routeInstruction(route));
  const badge=card.querySelector<HTMLElement>('[data-farm-route-status]');
  if(badge){const nextClass=`badge ${statusClass(status)}`;if(badge.className!==nextClass)badge.className=nextClass;if(badge.textContent!==status)badge.textContent=status}
  const summary=status==='READY'&&route.nextNode
    ? `${route.nextNode.label} · ${route.nextNode.expectedGold} ${c().gold}`
    : c().noLive;
  setText(card,'[data-farm-route-summary]',summary);
  const meta=[`${c().confidence}: ${formatConfidence(route.confidence)}`,`${c().quality}: ${escapeText(route.dataQuality||'UNAVAILABLE')}`];
  if(Number.isFinite(Number(route.totalExpectedGold)))meta.push(`${c().gold}: ${Math.round(Number(route.totalExpectedGold))}`);
  if(Number.isFinite(Number(route.totalTravelSec)))meta.push(`${c().travel}: ${Math.round(Number(route.totalTravelSec))}${c().seconds}`);
  setText(card,'[data-farm-route-meta]',meta.join(' · '));
  const details=card.querySelector<HTMLDetailsElement>('[data-farm-route-details]');
  if(details){details.hidden=nodes.length===0;setText(details,'summary',c().details)}
  const list=card.querySelector<HTMLOListElement>('[data-farm-route-list]');if(list)renderList(list,nodes);
  const limitations=status==='BLOCKED'
    ? [c().blocked,...(route.blockers??[])].join(': ')
    : status!=='READY'?[c().missing,...(route.missingSignals??[])].join(': '):'';
  setText(card,'[data-farm-route-limit]',limitations);
  const limit=card.querySelector<HTMLElement>('[data-farm-route-limit]');if(limit)limit.hidden=!limitations;
}

function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
window.addEventListener(SNAPSHOT_EVENT,event=>{latest=(event as CustomEvent<SnapshotWithRoute>).detail;schedule()});
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang'],childList:true,subtree:true});
