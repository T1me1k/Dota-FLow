import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'broodmother', displayName: 'Broodmother', role: 'core', identity: 'lane occupation and web-network pressure', signature: 'orchid', variant: 0 },
  { id: 'huskar', displayName: 'Huskar', role: 'core', identity: 'early health-threshold fighting and objective conversion', signature: 'armlet', variant: 1 },
  { id: 'meepo', displayName: 'Meepo', role: 'core', identity: 'level and net-worth lead conversion across multiple units', signature: 'blink', variant: 2 },
  { id: 'pugna', displayName: 'Pugna', role: 'core', identity: 'Pugna converts its distinct lane tools into map tempo', signature: 'aether_lens', variant: 3 },
  { id: 'shadow_fiend', displayName: 'Shadow Fiend', role: 'core', identity: 'Shadow Fiend converts its distinct lane tools into map tempo', signature: 'shadow_blade', variant: 4 },
  { id: 'sniper', displayName: 'Sniper', role: 'core', identity: 'long-range damage protected by disciplined positioning', signature: 'dragon_lance', variant: 5 },
  { id: 'tinker', displayName: 'Tinker', role: 'core', identity: 'Tinker converts its distinct lane tools into map tempo', signature: 'travel_boots', variant: 6 },
  { id: 'viper', displayName: 'Viper', role: 'core', identity: 'Viper converts its distinct lane tools into map tempo', signature: 'hurricane_pike', variant: 7 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
