import { CARRY_PROFILE_PACK_IDS, createCarryProfilePack } from './carry-profile-pack.mjs';
import { MID_PROFILE_IDS, createMidProfilePack } from './mid-profile-pack.mjs';
import { HERO_IDS as LEGACY_CARRY_PACK_IDS, createProfilePack as createLegacyCarryPack } from './legacy_carry_profile_compat.mjs';
import { HERO_IDS as LEGACY_CARRY_PACK_2_IDS, createProfilePack as createLegacyCarryPack2 } from './legacy_carry_profile_pack_2.mjs';
import { HERO_IDS as LEGACY_CARRY_PACK_3_IDS, createProfilePack as createLegacyCarryPack3 } from './legacy_carry_profile_pack_3.mjs';
import { HERO_IDS as LEGACY_CARRY_PACK_4_IDS, createProfilePack as createLegacyCarryPack4 } from './legacy_carry_profile_pack_4.mjs';
import { HERO_IDS as MID_TEMPO_IDS, createProfilePack as createMidTempoPack } from './mid_tempo_core_profile_pack.mjs';

import { HERO_IDS as FLEX_CORE_IDS, createProfilePack as create_flex_core } from './flex_core_profile_pack.mjs';
import { HERO_IDS as FRONTLINE_INITIATOR_IDS, createProfilePack as create_frontline_initiator } from './frontline_initiator_profile_pack.mjs';
import { HERO_IDS as MACRO_OFFLANE_IDS, createProfilePack as create_macro_offlane } from './macro_offlane_profile_pack.mjs';
import { HERO_IDS as ROAMING_SUPPORT_IDS, createProfilePack as create_roaming_support } from './roaming_support_profile_pack.mjs';
import { HERO_IDS as UTILITY_SUPPORT_IDS, createProfilePack as create_utility_support } from './utility_support_profile_pack.mjs';
import { HERO_IDS as SAVE_SUPPORT_IDS, createProfilePack as create_save_support } from './save_support_profile_pack.mjs';
import { HERO_IDS as CONTROL_SUPPORT_IDS, createProfilePack as create_control_support } from './control-support-profile-calibration.mjs';
import { HERO_IDS as MACRO_SUPPORT_A_IDS, createProfilePack as create_macro_support_a } from './macro_support_a_profile_pack.mjs';
import { HERO_IDS as MACRO_SUPPORT_B_IDS, createProfilePack as create_macro_support_b } from './macro_support_b_profile_pack.mjs';

/** Canonical registry: catalog tiers and runtime profiles are both derived from this list. */
const BUILTIN_PROFILE_IDS = Object.freeze(['sven']);
const REMEDIATED_CARRY_ID_SET = new Set([
  ...LEGACY_CARRY_PACK_IDS,
  ...LEGACY_CARRY_PACK_2_IDS,
  ...LEGACY_CARRY_PACK_3_IDS,
  ...LEGACY_CARRY_PACK_4_IDS
]);
const ACTIVE_CARRY_PROFILE_PACK_IDS = Object.freeze(
  CARRY_PROFILE_PACK_IDS.filter((id) => !REMEDIATED_CARRY_ID_SET.has(id))
);

function createActiveCarryProfilePack(dependencies) {
  const profiles = createCarryProfilePack(dependencies);
  return Object.fromEntries(ACTIVE_CARRY_PROFILE_PACK_IDS.map((id) => [id, profiles[id]]));
}

const PACKS = [
  { id: 'builtin', ids: BUILTIN_PROFILE_IDS, create: ({ builtinProfiles }) => Object.fromEntries(BUILTIN_PROFILE_IDS.map((id) => [id, builtinProfiles[id]])) },
  { id: 'carry', ids: ACTIVE_CARRY_PROFILE_PACK_IDS, create: createActiveCarryProfilePack },
  { id: 'mid', ids: MID_PROFILE_IDS, create: createMidProfilePack },
  { id: 'legacy-carry-remediation-1', ids: LEGACY_CARRY_PACK_IDS, create: createLegacyCarryPack },
  { id: 'legacy-carry-remediation-2', ids: LEGACY_CARRY_PACK_2_IDS, create: createLegacyCarryPack2 },
  { id: 'legacy-carry-remediation-3', ids: LEGACY_CARRY_PACK_3_IDS, create: createLegacyCarryPack3 },
  { id: 'legacy-carry-remediation-4', ids: LEGACY_CARRY_PACK_4_IDS, create: createLegacyCarryPack4 },
  { id: 'mid-tempo-core', ids: MID_TEMPO_IDS, create: createMidTempoPack },
  { id: 'flex-core', ids: FLEX_CORE_IDS, create: create_flex_core },
  { id: 'frontline-initiator', ids: FRONTLINE_INITIATOR_IDS, create: create_frontline_initiator },
  { id: 'macro-offlane', ids: MACRO_OFFLANE_IDS, create: create_macro_offlane },
  { id: 'roaming-support', ids: ROAMING_SUPPORT_IDS, create: create_roaming_support },
  { id: 'utility-support', ids: UTILITY_SUPPORT_IDS, create: create_utility_support },
  { id: 'save-support', ids: SAVE_SUPPORT_IDS, create: create_save_support },
  { id: 'control-support', ids: CONTROL_SUPPORT_IDS, create: create_control_support },
  { id: 'macro-support-a', ids: MACRO_SUPPORT_A_IDS, create: create_macro_support_a },
  { id: 'macro-support-b', ids: MACRO_SUPPORT_B_IDS, create: create_macro_support_b }
];

export const DETAILED_HERO_IDS = Object.freeze([...new Set(PACKS.flatMap((pack) => pack.ids))]);
export const DETAILED_HERO_ID_SET = new Set(DETAILED_HERO_IDS);

export function createDetailedHeroRegistry(dependencies) {
  const entries = new Map();
  for (const pack of PACKS) {
    const profiles = pack.create(dependencies);
    for (const id of pack.ids) {
      if (!profiles[id]) throw new Error(`Profile pack ${pack.id} declares ${id} without a profile`);
      if (entries.has(id)) throw new Error(`Duplicate detailed hero profile: ${id}`);
      entries.set(id, profiles[id]);
    }
    for (const id of Object.keys(profiles)) {
      if (!pack.ids.includes(id)) throw new Error(`Profile pack ${pack.id} registered undeclared hero ${id}`);
    }
  }
  return Object.fromEntries(entries);
}

export function listDetailedProfilePacks() {
  return PACKS.map(({ id, ids }) => ({ id, heroIds: [...ids] }));
}
