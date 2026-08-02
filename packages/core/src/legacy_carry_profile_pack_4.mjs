import { createProfileGroup as createGroupA } from './legacy_carry_profile_pack_4_a.mjs';
import { createProfileGroup as createGroupB } from './legacy_carry_profile_pack_4_b.mjs';
import { createProfileGroup as createGroupC } from './legacy_carry_profile_pack_4_c.mjs';

export const HERO_IDS = Object.freeze([
  'alchemist',
  'clinkz',
  'juggernaut',
  'monkey_king',
  'slark',
  'troll_warlord'
]);

export function createProfilePack(dependencies) {
  return {
    ...createGroupA(dependencies),
    ...createGroupB(dependencies),
    ...createGroupC(dependencies)
  };
}
