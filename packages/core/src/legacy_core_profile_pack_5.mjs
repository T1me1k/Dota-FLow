import { createProfileGroup as createGroupA } from './legacy_core_profile_pack_5_a.mjs';
import { createProfileGroup as createGroupB } from './legacy_core_profile_pack_5_b.mjs';
import { createProfileGroup as createGroupC } from './legacy_core_profile_pack_5_c.mjs';

export { LEGACY_SPIKE_ALIASES } from './legacy_core_profile_pack_5_shared.mjs';

export const HERO_IDS = Object.freeze([
  'muerta',
  'templar_assassin',
  'weaver',
  'sven',
  'marci',
  'dawnbreaker'
]);

export function createProfilePack(dependencies) {
  return {
    ...createGroupA(dependencies),
    ...createGroupB(dependencies),
    ...createGroupC(dependencies)
  };
}
