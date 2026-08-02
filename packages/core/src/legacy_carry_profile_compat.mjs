import {
  HERO_IDS,
  createProfilePack as createBaseProfilePack
} from './legacy_carry_profile_pack.mjs';

export { HERO_IDS };

/** Preserve lifecycle identifiers while the old carry definitions are migrated. */
export function createProfilePack(dependencies) {
  const profiles = createBaseProfilePack(dependencies);

  profiles.faceless_void = {
    ...profiles.faceless_void,
    calibrationVersion: 'review-required-7.41-faceless-void-conservative-v2',
    spikes: profiles.faceless_void.spikes.map((spike) =>
      spike.id === 'faceless_void_chrono_1'
        ? { ...spike, id: 'faceless_void_level_6' }
        : spike
    )
  };

  return profiles;
}
