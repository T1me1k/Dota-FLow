import { BrowserWindow, screen } from 'electron';

export type EconomyOverlaySettings={
  enabled?:boolean;
  economyEnabled:boolean;
  economyMode:'LOCAL_EXACT'|'ESTIMATED'|'SPECTATOR_EXACT';
  side:'LEFT'|'RIGHT';
  scale:'SMALL'|'MEDIUM'|'LARGE';
  opacity:number;
  sort:'TEAM'|'NET_WORTH';
  showAllies:boolean;
  showEnemies:boolean;
  buybackPlacement:'ROW'|'TOP'|'OFF';
  mode?:string;
  reasonLimit?:number;
  minConfidence?:number;
  hideLowConfidence?:boolean;
  showStaleDecision?:boolean;
};

export const DEFAULT_ECONOMY_OVERLAY_SETTINGS:EconomyOverlaySettings={
  enabled:true,
  economyEnabled:false,
  economyMode:'LOCAL_EXACT',
  side:'LEFT',
  scale:'MEDIUM',
  opacity:.9,
  sort:'TEAM',
  showAllies:true,
  showEnemies:true,
  buybackPlacement:'ROW',
  mode:'COMPACT',
  reasonLimit:2,
  minConfidence:.42,
  hideLowConfidence:false,
  showStaleDecision:false
};

export function normalizeEconomyOverlaySettings(value:unknown):EconomyOverlaySettings{
  const raw=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const scale=['SMALL','MEDIUM','LARGE'].includes(String(raw.scale))?String(raw.scale) as EconomyOverlaySettings['scale']:'MEDIUM';
  const economyMode=['LOCAL_EXACT','ESTIMATED','SPECTATOR_EXACT'].includes(String(raw.economyMode))?String(raw.economyMode) as EconomyOverlaySettings['economyMode']:'LOCAL_EXACT';
  const buybackPlacement=['ROW','TOP','OFF'].includes(String(raw.buybackPlacement))?String(raw.buybackPlacement) as EconomyOverlaySettings['buybackPlacement']:'ROW';
  return{
    ...DEFAULT_ECONOMY_OVERLAY_SETTINGS,
    ...raw,
    economyEnabled:raw.economyEnabled===true,
    economyMode,
    side:String(raw.side)==='RIGHT'?'RIGHT':'LEFT',
    scale,
    opacity:Math.min(1,Math.max(.35,Number(raw.opacity)||.9)),
    sort:String(raw.sort)==='NET_WORTH'?'NET_WORTH':'TEAM',
    showAllies:raw.showAllies!==false,
    showEnemies:raw.showEnemies!==false,
    buybackPlacement
  };
}

export function economyOverlayBounds(settings:EconomyOverlaySettings){
  const workArea=screen.getPrimaryDisplay().workArea;
  const dimensions=settings.scale==='SMALL'?{width:300,height:500}:settings.scale==='LARGE'?{width:420,height:650}:{width:360,height:580};
  const margin=20;
  const x=settings.side==='RIGHT'?workArea.x+workArea.width-dimensions.width-margin:workArea.x+margin;
  const y=Math.round(workArea.y+(workArea.height-dimensions.height)/2);
  return{...dimensions,x,y};
}

export function applyEconomyOverlayWindow(window:BrowserWindow|null,rawSettings:unknown):EconomyOverlaySettings{
  const settings=normalizeEconomyOverlaySettings(rawSettings);
  if(!window||window.isDestroyed())return settings;
  window.setBounds(economyOverlayBounds(settings),true);
  window.setOpacity(settings.opacity);
  if(settings.economyEnabled)window.showInactive();else window.hide();
  return settings;
}
