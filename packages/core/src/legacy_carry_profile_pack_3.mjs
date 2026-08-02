import { createProfileGroup as createGroupA } from './legacy_carry_profile_pack_3_a.mjs';
import { createProfileGroup as createGroupB } from './legacy_carry_profile_pack_3_b.mjs';
import { createProfileGroup as createGroupC } from './legacy_carry_profile_pack_3_c.mjs';

export const HERO_IDS = Object.freeze([
  'arc_warden',
  'morphling',
  'naga_siren',
  'phantom_lancer',
  'spectre',
  'terrorblade'
]);

export function createProfilePack(dependencies) {
  return {
    ...createGroupA(dependencies),
    ...createGroupB(dependencies),
    ...createGroupC(dependencies)
  };
}
