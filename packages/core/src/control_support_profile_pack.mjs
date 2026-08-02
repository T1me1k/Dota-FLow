import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'ancient_apparition', displayName: 'Ancient Apparition', role: 'support', identity: 'Ancient Apparition converts its distinct lane tools into low-economy team utility', signature: 'force_staff', variant: 0 },
  { id: 'bane', displayName: 'Bane', role: 'support', identity: 'Bane converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 1 },
  { id: 'crystal_maiden', displayName: 'Crystal Maiden', role: 'support', identity: 'lane mana enablement into fragile area control', signature: 'glimmer_cape', variant: 2 },
  { id: 'disruptor', displayName: 'Disruptor', role: 'support', identity: 'Disruptor converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 3 },
  { id: 'jakiro', displayName: 'Jakiro', role: 'support', identity: 'Jakiro converts its distinct lane tools into low-economy team utility', signature: 'force_staff', variant: 4 },
  { id: 'lich', displayName: 'Lich', role: 'support', identity: 'Lich converts its distinct lane tools into low-economy team utility', signature: 'glimmer_cape', variant: 5 },
  { id: 'lion', displayName: 'Lion', role: 'support', identity: 'pickoff economy built around instant disable', signature: 'blink', variant: 6 },
  { id: 'shadow_shaman', displayName: 'Shadow Shaman', role: 'support', identity: 'Shadow Shaman converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 7 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
