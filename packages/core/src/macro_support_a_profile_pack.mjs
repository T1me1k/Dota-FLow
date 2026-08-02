import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'chen', displayName: 'Chen', role: 'support', identity: 'early controlled-unit objective pressure', signature: 'mekansm', variant: 0 },
  { id: 'dark_willow', displayName: 'Dark Willow', role: 'support', identity: 'Dark Willow converts its distinct lane tools into low-economy team utility', signature: 'euls', variant: 1 },
  { id: 'enchantress', displayName: 'Enchantress', role: 'support', identity: 'lane domination that transitions into ranged scaling', signature: 'hurricane_pike', variant: 2 },
  { id: 'grimstroke', displayName: 'Grimstroke', role: 'support', identity: 'Grimstroke converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 3 },
  { id: 'keeper_of_the_light', displayName: 'Keeper of the Light', role: 'support', identity: 'Keeper of the Light converts its distinct lane tools into low-economy team utility', signature: 'force_staff', variant: 4 },
  { id: 'ringmaster', displayName: 'Ringmaster', role: 'support', identity: 'prototype control and save support calibration using only repository role signals', signature: 'force_staff', variant: 5 },
  { id: 'shadow_demon', displayName: 'Shadow Demon', role: 'support', identity: 'Shadow Demon converts its distinct lane tools into low-economy team utility', signature: 'aether_lens', variant: 6 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
