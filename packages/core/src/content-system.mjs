import { HERO_CATALOG } from './hero-catalog.mjs';
import { listHeroProfiles } from './hero-profiles.mjs';

export const PATCH_METADATA=Object.freeze({patchId:'prototype-2026-08',releasedAt:'2026-08-01',source:'Dota Flow prototype calibration',status:'PROTOTYPE',notes:'Strategic structures require review against the active Dota patch.',contentVersion:'0.20.0'});
const SEEDED_ITEMS=[
  {id:'item_black_king_bar',name:'Black King Bar',tags:['defense','dispel_immunity']},{id:'item_manta',name:'Manta Style',tags:['dispel','illusions']},{id:'item_sphere',name:"Linken's Sphere",tags:['defense','spell_block']},{id:'item_blink',name:'Blink Dagger',tags:['mobility','initiation']},{id:'item_pipe',name:'Pipe of Insight',tags:['magic_defense']},{id:'item_monkey_king_bar',name:'Monkey King Bar',tags:['accuracy']},{id:'item_nullifier',name:'Nullifier',tags:['dispel']},{id:'item_skadi',name:'Eye of Skadi',tags:['anti_heal']}];
const authoredItems=listHeroProfiles().flatMap(p=>(p.buildPlans??[]).flatMap(plan=>plan.items??[]));
export const ITEM_CATALOG=Object.freeze([...new Map([...SEEDED_ITEMS,...authoredItems.map(x=>({id:x.id,name:x.name,tags:[]}))].map(x=>[x.id,x])).values()]);
export const OBJECTIVE_TIMINGS=Object.freeze({POWER_RUNE:{firstSec:360,intervalSec:120},WISDOM_RUNE:{firstSec:420,intervalSec:420},TORMENTOR:{firstSec:1200},ROSHAN:{respawnMinSec:480,respawnMaxSec:660}});

export function validateContent({heroes=HERO_CATALOG,profiles=Object.fromEntries(listHeroProfiles().map(p=>[p.id,p])),items=ITEM_CATALOG,patch=PATCH_METADATA}={}){
  const errors=[]; const warnings=[]; const unique=(values,label)=>{const seen=new Set();for(const id of values){if(seen.has(id))errors.push(`Duplicate ${label}: ${id}`);seen.add(id);}};
  unique(heroes.map(x=>x.id),'hero id'); unique(items.map(x=>x.id),'item id');
  const heroIds=new Set(heroes.map(x=>x.id)); const itemIds=new Set(items.map(x=>x.id));
  for(const [id,p] of Object.entries(profiles)){if(!heroIds.has(id))errors.push(`Unknown profile hero: ${id}`);if(!Array.isArray(p.buildPlans)||!p.buildPlans.length)errors.push(`${id}: missing default build plan`);if(p.profileTier==='DETAILED'&&(p.powerSpikes?.length??0)<3)errors.push(`${id}: DETAILED requires 3 spikes`);for(const plan of p.buildPlans??[]){unique((plan.items??[]).map(x=>x.id),`${id}/${plan.id} item`);for(const item of plan.items??[])if(!itemIds.has(item.id))warnings.push(`${id}: catalog lacks ${item.id}`);}for(const spike of p.powerSpikes??[]){if((spike.expectedMinute??0)<0)errors.push(`${id}: invalid spike timing`);}}
  if(!patch.patchId||!patch.contentVersion)errors.push('Patch metadata is incomplete');
  return {valid:errors.length===0,errors,warnings,summary:{heroes:heroes.length,profiles:Object.keys(profiles).length,items:items.length}};
}
export function contentCoverage(){const profiles=listHeroProfiles();const validation=validateContent();return {totalHeroes:HERO_CATALOG.length,detailed:profiles.filter(x=>x.profileTier==='DETAILED'||x.calibrationTier==='DETAILED').length,baseline:profiles.filter(x=>x.profileTier==='BASELINE'||x.calibrationTier==='BASELINE').length,withoutBuildPlan:profiles.filter(x=>!(x.buildPlans?.some(p=>(p.items?.length??0)>0))).length,staleProfiles:profiles.filter(x=>x.contentVersion&&x.contentVersion!==PATCH_METADATA.contentVersion).length,missingItemReferences:validation.warnings.length,testCoverage:'Reported by npm test; content tooling does not fabricate a percentage',patch:PATCH_METADATA};}
export function migratePersistedRecord(kind,value={}){const versions={settings:2,matchReport:2,progressHistory:2,recordingMetadata:2,heroProfileOverride:2};if(!versions[kind])throw new Error(`Unknown migration kind: ${kind}`);return {...value,schemaVersion:versions[kind],migratedAt:new Date(0).toISOString()};}
