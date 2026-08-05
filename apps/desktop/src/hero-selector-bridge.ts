type HeroCatalogEntry={id:string;displayName:string};

const HERO_LABEL='hero';
let catalogPromise:Promise<readonly HeroCatalogEntry[]>|null=null;
let activeSelect:HTMLSelectElement|null=null;

function findHeroSelect():HTMLSelectElement|null{
  for(const label of document.querySelectorAll('label')){
    const text=label.childNodes[0]?.textContent?.trim().toLowerCase();
    if(text===HERO_LABEL)return label.querySelector('select');
  }
  return null;
}

function loadHeroCatalog():Promise<readonly HeroCatalogEntry[]>{
  catalogPromise??=import('../../../packages/core/src/hero-catalog.mjs').then(module=>module.HERO_CATALOG as readonly HeroCatalogEntry[]);
  return catalogPromise;
}

export async function populateHeroSelector(select:HTMLSelectElement):Promise<void>{
  if(select.dataset.heroCatalogLoading==='true')return;
  select.dataset.heroCatalogLoading='true';
  try{
    const catalog=await loadHeroCatalog();
    if(!select.isConnected)return;
    const selected=select.value||'luna';
    const expectedIds=catalog.map(hero=>hero.id);
    const currentIds=Array.from(select.options,option=>option.value);
    if(currentIds.length!==expectedIds.length||!currentIds.every((id,index)=>id===expectedIds[index])){
      const fragment=document.createDocumentFragment();
      for(const hero of catalog){
        const option=document.createElement('option');
        option.value=hero.id;
        option.textContent=hero.displayName;
        fragment.append(option);
      }
      select.replaceChildren(fragment);
    }
    select.value=expectedIds.includes(selected)?selected:'luna';
    select.dataset.heroCatalog=String(catalog.length);
  }catch(error){
    console.error('[Dota Flow] Hero catalog failed to load',error);
  }finally{
    delete select.dataset.heroCatalogLoading;
  }
}

function syncHeroSelector():void{
  const select=findHeroSelect();
  if(!select||select===activeSelect&&select.dataset.heroCatalog)return;
  activeSelect=select;
  void populateHeroSelector(select);
}

const observer=new MutationObserver(syncHeroSelector);
observer.observe(document.documentElement,{childList:true,subtree:true});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncHeroSelector,{once:true});
else syncHeroSelector();
