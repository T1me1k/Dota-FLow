import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'axe', displayName: 'Axe', role: 'offlane', identity: 'frequent short-cooldown counter-initiation', signature: 'blink', variant: 0 },
  { id: 'batrider', displayName: 'Batrider', role: 'offlane', identity: 'Batrider converts its distinct lane tools into map tempo', signature: 'blink', variant: 1 },
  { id: 'centaur_warrunner', displayName: 'Centaur Warrunner', role: 'offlane', identity: 'Centaur Warrunner converts its distinct lane tools into map tempo', signature: 'blink', variant: 2 },
  { id: 'legion_commander', displayName: 'Legion Commander', role: 'offlane', identity: 'Legion Commander converts its distinct lane tools into map tempo', signature: 'blink', variant: 3 },
  { id: 'magnus', displayName: 'Magnus', role: 'offlane', identity: 'Magnus converts its distinct lane tools into map tempo', signature: 'blink', variant: 4 },
  { id: 'mars', displayName: 'Mars', role: 'offlane', identity: 'Mars converts its distinct lane tools into map tempo', signature: 'blink', variant: 5 },
  { id: 'sand_king', displayName: 'Sand King', role: 'offlane', identity: 'Sand King converts its distinct lane tools into map tempo', signature: 'blink', variant: 6 },
  { id: 'slardar', displayName: 'Slardar', role: 'offlane', identity: 'Slardar converts its distinct lane tools into map tempo', signature: 'blink', variant: 7 },
  { id: 'tidehunter', displayName: 'Tidehunter', role: 'offlane', identity: 'teamfight commitment around major ultimate readiness', signature: 'pipe', variant: 8 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
