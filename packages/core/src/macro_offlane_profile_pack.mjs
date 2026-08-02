import { createStrategicProfilePack } from './strategic-profile-factory.mjs';

const CONFIGS = [
  { id: 'beastmaster', displayName: 'Beastmaster', role: 'offlane', identity: 'summon vision converted into tower and Roshan pressure', signature: 'helm_dominator', variant: 0 },
  { id: 'brewmaster', displayName: 'Brewmaster', role: 'offlane', identity: 'Brewmaster converts its distinct lane tools into map tempo', signature: 'vladmir', variant: 1 },
  { id: 'bristleback', displayName: 'Bristleback', role: 'offlane', identity: 'Bristleback converts its distinct lane tools into map tempo', signature: 'bloodstone', variant: 2 },
  { id: 'dark_seer', displayName: 'Dark Seer', role: 'offlane', identity: 'Dark Seer converts its distinct lane tools into map tempo', signature: 'guardian_greaves', variant: 3 },
  { id: 'doom', displayName: 'Doom', role: 'offlane', identity: 'Doom converts its distinct lane tools into map tempo', signature: 'hand_of_midas', variant: 4 },
  { id: 'enigma', displayName: 'Enigma', role: 'offlane', identity: 'Enigma converts its distinct lane tools into map tempo', signature: 'blink', variant: 5 },
  { id: 'night_stalker', displayName: 'Night Stalker', role: 'offlane', identity: 'Night Stalker converts its distinct lane tools into map tempo', signature: 'echo_sabre', variant: 6 },
  { id: 'timbersaw', displayName: 'Timbersaw', role: 'offlane', identity: 'Timbersaw converts its distinct lane tools into map tempo', signature: 'bloodstone', variant: 7 },
  { id: 'underlord', displayName: 'Underlord', role: 'offlane', identity: 'Underlord converts its distinct lane tools into map tempo', signature: 'pipe', variant: 8 },
];

export const HERO_IDS = Object.freeze(CONFIGS.map((entry) => entry.id));
export function createProfilePack(dependencies) { return createStrategicProfilePack(CONFIGS, dependencies); }
