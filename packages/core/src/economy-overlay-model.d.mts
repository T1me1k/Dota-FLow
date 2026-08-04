export type EconomyQuality='EXACT'|'ESTIMATE'|'UNAVAILABLE';
export type EconomyOverlaySettings={showAllies?:boolean;showEnemies?:boolean;sort?:'TEAM'|'NET_WORTH'};
export type EconomyOverlayRow={
  id:string;
  hero:string;
  team:string;
  local:boolean;
  economy:{value:number|null;low?:number;high?:number;quality:EconomyQuality;source:string};
  buybackRemainingSec:number|null;
  buybackQuality:'EXACT'|'CONFIRMED'|'UNAVAILABLE';
};
export type EconomyOverlayModel={rows:EconomyOverlayRow[];localTeam:string;exactCount:number;estimatedCount:number;unavailableCount:number;generatedAt:number};
export function buildEconomyOverlayModel(state?:Record<string,any>,settings?:EconomyOverlaySettings):EconomyOverlayModel;
