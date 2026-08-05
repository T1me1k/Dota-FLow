export type EconomyQuality='EXACT'|'ESTIMATE'|'STALE'|'UNAVAILABLE';
export type EconomyOverlaySettings={
  showAllies?:boolean;
  showEnemies?:boolean;
  sort?:'TEAM'|'NET_WORTH';
  staleAfterSec?:number;
  nowMs?:number;
};
export type EconomyOverlayRow={
  id:string;
  hero:string;
  team:string;
  local:boolean;
  economy:{
    value:number|null;
    low?:number;
    high?:number;
    quality:EconomyQuality;
    originalQuality?:'EXACT'|'ESTIMATE';
    source:string;
    ageSec?:number|null;
  };
  buybackRemainingSec:number|null;
  buybackCost:number|null;
  buybackQuality:'EXACT'|'CONFIRMED'|'UNAVAILABLE';
};
export type EconomyOverlayModel={
  rows:EconomyOverlayRow[];
  localTeam:string;
  exactCount:number;
  estimatedCount:number;
  staleCount:number;
  unavailableCount:number;
  generatedAt:number;
};
export function buildEconomyOverlayModel(state?:Record<string,any>,settings?:EconomyOverlaySettings):EconomyOverlayModel;
