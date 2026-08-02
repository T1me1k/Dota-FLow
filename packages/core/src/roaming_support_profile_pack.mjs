import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'bounty_hunter', displayName: 'Bounty Hunter', role: 'support', identity: 'Bounty Hunter converts its distinct lane tools into low-economy team utility', signature: 'spirit_vessel', variant: 0 },
  { id: 'clockwerk', displayName: 'Clockwerk', role: 'support', identity: 'Clockwerk converts its distinct lane tools into low-economy team utility', signature: 'force_staff', variant: 1 },
  { id: 'earth_spirit', displayName: 'Earth Spirit', role: 'support', identity: 'Earth Spirit converts its distinct lane tools into low-economy team utility', signature: 'spirit_vessel', variant: 2 },
  { id: 'earthshaker', displayName: 'Earthshaker', role: 'support', identity: 'Earthshaker converts its distinct lane tools into low-economy team utility', signature: 'blink', variant: 3 },
  { id: 'hoodwink', displayName: 'Hoodwink', role: 'support', identity: 'Hoodwink converts its distinct lane tools into low-economy team utility', signature: 'atos', variant: 4 },
  { id: 'mirana', displayName: 'Mirana', role: 'support', identity: 'Mirana converts its distinct lane tools into low-economy team utility', signature: 'euls', variant: 5 },
  { id: 'nyx_assassin', displayName: 'Nyx Assassin', role: 'support', identity: 'Nyx Assassin converts its distinct lane tools into low-economy team utility', signature: 'dagon', variant: 6 },
  { id: 'pudge', displayName: 'Pudge', role: 'support', identity: 'Pudge converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 7 },
  { id: 'spirit_breaker', displayName: 'Spirit Breaker', role: 'support', identity: 'Spirit Breaker converts its distinct lane tools into low-economy team utility', signature: 'shadow_blade', variant: 8 },
  { id: 'tusk', displayName: 'Tusk', role: 'support', identity: 'Tusk converts its distinct lane tools into low-economy team utility', signature: 'blink', variant: 9 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
