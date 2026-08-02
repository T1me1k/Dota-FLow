import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'lone_druid', displayName: 'Lone Druid', role: 'core', identity: 'Lone Druid converts its distinct lane tools into map tempo', signature: 'hand_of_midas', variant: 0 },
  { id: 'lycan', displayName: 'Lycan', role: 'core', identity: 'Lycan converts its distinct lane tools into map tempo', signature: 'helm_dominator', variant: 1 },
  { id: 'natures_prophet', displayName: "Nature's Prophet", role: 'core', identity: 'global lane allocation and teleport-driven map pressure', signature: 'orchid', variant: 2 },
  { id: 'visage', displayName: 'Visage', role: 'core', identity: 'Visage converts its distinct lane tools into map tempo', signature: 'solar_crest', variant: 3 },
  { id: 'kez', displayName: 'Kez', role: 'core', identity: 'prototype mobile flex-core calibration using only repository role signals', signature: 'diffusal', variant: 4 },
  { id: 'windranger', displayName: 'Windranger', role: 'core', identity: 'Windranger converts its distinct lane tools into map tempo', signature: 'maelstrom', variant: 5 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
