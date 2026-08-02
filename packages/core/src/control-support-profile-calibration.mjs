import {
  HERO_IDS,
  createProfilePack as createBaseControlSupportPack
} from './control_support_profile_pack.mjs';

export { HERO_IDS };

const withUnique = (values, value) => values.includes(value) ? values : [...values, value];

function calibrateBane(profile) {
  return {
    ...profile,
    buildPlans: profile.buildPlans.map((plan, index) => index === 0
      ? { ...plan, id: 'bane_balanced' }
      : plan)
  };
}

function calibrateCrystalMaiden(profile) {
  return {
    ...profile,
    basePower: { ...profile.basePower, objective: 43 },
    stageCurves: {
      ...profile.stageCurves,
      early: { ...profile.stageCurves.early, objective: 2 },
      mid: { ...profile.stageCurves.mid, objective: 5 },
      late: { ...profile.stageCurves.late, objective: 0 }
    },
    buildPlans: profile.buildPlans.map((plan) => plan.id === 'crystal_maiden_glimmer_channel'
      ? {
          ...plan,
          scenarioTags: withUnique(plan.scenarioTags, 'enemy_control_high'),
          reasons: withUnique(plan.reasons, 'enemy_control_high')
        }
      : plan),
    spikes: profile.spikes.map((spike) => {
      if (spike.id === 'crystal_maiden_level_6') {
        return {
          ...spike,
          permanent: { fight: 12 },
          window: { fight: 22, connect: 8 },
          actions: { FIGHT: 23, CONNECT: 9 }
        };
      }
      if (spike.id === 'crystal_maiden_blink_bkb') {
        return {
          ...spike,
          permanent: { ...spike.permanent, objective: 5 },
          window: { ...spike.window, objective: 8 },
          actions: { ...spike.actions, OBJECTIVE: 9 }
        };
      }
      return spike;
    })
  };
}

/**
 * Small compatibility and safety calibration layer.
 * The source pack remains fully explicit; this layer keeps legacy public IDs stable
 * and prevents a fragile support profile from overpowering a confirmed safety reset.
 */
export function createProfilePack(dependencies) {
  const profiles = createBaseControlSupportPack(dependencies);
  return {
    ...profiles,
    bane: calibrateBane(profiles.bane),
    crystal_maiden: calibrateCrystalMaiden(profiles.crystal_maiden)
  };
}
