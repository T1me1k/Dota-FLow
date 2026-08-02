import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'abaddon', displayName: 'Abaddon', role: 'support', identity: 'Abaddon converts its distinct lane tools into low-economy team utility', signature: 'pavise', variant: 0 },
  { id: 'dazzle', displayName: 'Dazzle', role: 'support', identity: 'sustained armor swing and repeated low-cooldown saves', signature: 'guardian_greaves', variant: 1 },
  { id: 'io', displayName: 'Io', role: 'support', identity: 'Io converts its distinct lane tools into low-economy team utility', signature: 'mekansm', variant: 2 },
  { id: 'omniknight', displayName: 'Omniknight', role: 'support', identity: 'Omniknight converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 3 },
  { id: 'oracle', displayName: 'Oracle', role: 'support', identity: 'reactive dispel and delayed save positioning', signature: 'aether_lens', variant: 4 },
  { id: 'phoenix', displayName: 'Phoenix', role: 'support', identity: 'Phoenix converts its distinct lane tools into low-economy team utility', signature: 'shivas_guard', variant: 5 },
  { id: 'treant_protector', displayName: 'Treant Protector', role: 'support', identity: 'Treant Protector converts its distinct lane tools into low-economy team utility', signature: 'meteor_hammer', variant: 6 },
  { id: 'vengeful_spirit', displayName: 'Vengeful Spirit', role: 'support', identity: 'Vengeful Spirit converts its distinct lane tools into low-economy team utility', signature: 'solar_crest', variant: 7 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
