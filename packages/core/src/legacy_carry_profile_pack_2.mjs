import { createProfileGroup as createGroupA } from './legacy_carry_profile_pack_2_a.mjs';
import { createProfileGroup as createGroupB } from './legacy_carry_profile_pack_2_b.mjs';
import { createProfileGroup as createGroupC } from './legacy_carry_profile_pack_2_c.mjs';

export const HERO_IDS = Object.freeze([
  'drow_ranger',
  'lifestealer',
  'wraith_king',
  'chaos_knight',
  'gyrocopter',
  'bloodseeker'
]);

export function createProfilePack(dependencies) {
  return {
    ...createGroupA(dependencies),
    ...createGroupB(dependencies),
    ...createGroupC(dependencies)
  };
}
