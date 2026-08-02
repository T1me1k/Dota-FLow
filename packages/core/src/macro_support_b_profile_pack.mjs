import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'elder_titan', displayName: 'Elder Titan', role: 'support', identity: 'Elder Titan converts its distinct lane tools into low-economy team utility', signature: 'echo_sabre', variant: 0 },
  { id: 'largo', displayName: 'Largo', role: 'support', identity: 'prototype teamfight support calibration using only repository role signals', signature: 'guardian_greaves', variant: 1 },
  { id: 'ogre_magi', displayName: 'Ogre Magi', role: 'support', identity: 'Ogre Magi converts its distinct lane tools into low-economy team utility', signature: 'hand_of_midas', variant: 2 },
  { id: 'undying', displayName: 'Undying', role: 'support', identity: 'Undying converts its distinct lane tools into low-economy team utility', signature: 'guardian_greaves', variant: 3 },
  { id: 'warlock', displayName: 'Warlock', role: 'support', identity: 'Warlock converts its distinct lane tools into low-economy team utility', signature: 'refresher', variant: 4 },
  { id: 'winter_wyvern', displayName: 'Winter Wyvern', role: 'support', identity: 'Winter Wyvern converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 5 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
