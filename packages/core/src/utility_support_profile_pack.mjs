import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'riki', displayName: 'Riki', role: 'support', identity: 'Riki converts its distinct lane tools into low-economy team utility', signature: 'diffusal', variant: 0 },
  { id: 'rubick', displayName: 'Rubick', role: 'support', identity: 'Rubick converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 1 },
  { id: 'skywrath_mage', displayName: 'Skywrath Mage', role: 'support', identity: 'single-target magic burst chained to allied control', signature: 'atos', variant: 2 },
  { id: 'snapfire', displayName: 'Snapfire', role: 'support', identity: 'Snapfire converts its distinct lane tools into low-economy team utility', signature: 'solar_crest', variant: 3 },
  { id: 'techies', displayName: 'Techies', role: 'support', identity: 'area denial and setup-dependent burst', signature: 'aether_lens', variant: 4 },
  { id: 'venomancer', displayName: 'Venomancer', role: 'support', identity: 'Venomancer converts its distinct lane tools into low-economy team utility', signature: 'spirit_vessel', variant: 5 },
  { id: 'silencer', displayName: 'Silencer', role: 'support', identity: 'Silencer converts its distinct lane tools into low-economy team utility', signature: 'force_staff', variant: 6 },
  { id: 'witch_doctor', displayName: 'Witch Doctor', role: 'support', identity: 'Witch Doctor converts its distinct lane tools into low-economy team utility', signature: 'glimmer_cape', variant: 7 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
