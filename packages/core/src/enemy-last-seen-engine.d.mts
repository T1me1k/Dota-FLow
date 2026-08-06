export type EnemyVisibilityStatus='VISIBLE'|'MISSING'|'DEAD'|'DISCONNECTED'|'UNKNOWN';
export type EnemyVisibilityObservation={
  steamId?:string|number;
  playerId?:string|number;
  slot?:string|number;
  hero?:string;
  team?:'radiant'|'dire'|2|3;
  enemy?:boolean;
  visible?:boolean;
  alive?:boolean;
  connected?:boolean;
  gameTimeSec?:number;
  observedAtMs?:number;
  confidence?:number;
  source?:string;
};
export type EnemyLastSeenRow={
  id:string;
  hero:string;
  team:string|null;
  steamId:string|number|null;
  status:EnemyVisibilityStatus;
  elapsedSec:number|null;
  timerVisible:boolean;
  lastVisibleGameTimeSec:number|null;
  missingSinceGameTimeSec:number|null;
  lastObservedAtMs:number|null;
  confidence:number;
  source:string;
  pending:boolean;
};
export type EnemyLastSeenSnapshot={
  status:'READY'|'UNAVAILABLE';
  sourceStatus:string;
  source:string;
  rows:EnemyLastSeenRow[];
  missingCount:number;
  visibleCount:number;
  confidence:number;
  dataQuality:'LIVE'|'STALE'|'UNAVAILABLE';
  reasons:string[];
  missingSignals:string[];
  limitations:string[];
};
export class EnemyLastSeenTracker{
  constructor(options?:{graceSec?:number;staleAfterMs?:number});
  reset(matchId?:string|null):void;
  update(state:Record<string,any>,nowMs?:number):EnemyLastSeenSnapshot;
}
export function createEnemyLastSeenTracker(options?:{graceSec?:number;staleAfterMs?:number}):EnemyLastSeenTracker;
export const ENEMY_VISIBILITY_STATUS:Readonly<Record<string,EnemyVisibilityStatus>>;
