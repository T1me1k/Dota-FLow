import { getHeroCatalogEntry, resolveHeroId } from './hero-catalog.mjs';

const HERO_TAGS = {
  axe: ['hard_control', 'initiation', 'anti_carry', 'durable'],
  beastmaster: ['initiation', 'hard_control', 'push', 'aura'],
  crystal_maiden: ['hard_control', 'burst', 'fragile'],
  drow_ranger: ['ranged_core', 'kite', 'fragile', 'tower_damage'],
  lion: ['hard_control', 'burst', 'fragile'],
  necrophos: ['sustain', 'anti_carry', 'magic_damage'],
  natures_prophet: ['global', 'split_push', 'tower_damage'],
  omniknight: ['save', 'sustain', 'anti_burst'],
  puck: ['initiation', 'hard_control', 'mobility', 'burst'],
  pugna: ['save', 'push', 'magic_damage', 'fragile'],
  shadow_demon: ['save', 'hard_control', 'dispel'],
  shadow_shaman: ['hard_control', 'push', 'tower_damage', 'fragile'],
  sniper: ['ranged_core', 'kite', 'tower_damage', 'fragile'],
  storm_spirit: ['mobility', 'initiation', 'burst'],
  spirit_breaker: ['global', 'initiation', 'hard_control'],
  spectre: ['global', 'durable', 'late_game'],
  tidehunter: ['initiation', 'hard_control', 'durable'],
  treant_protector: ['save', 'sustain', 'hard_control'],
  tusk: ['initiation', 'save', 'hard_control'],
  underlord: ['aura', 'durable', 'hard_control'],
  vengeful_spirit: ['save', 'initiation', 'hard_control'],
  windranger: ['kite', 'mobility', 'hard_control'],
  zeus: ['global', 'burst', 'magic_damage'],
  anti_mage: ['mobility', 'split_push', 'late_game'],
  luna: ['flash_farm', 'push', 'tower_damage'],
  juggernaut: ['sustain', 'objective', 'tower_damage'],
  sven: ['burst', 'flash_farm', 'hard_control'],
  ursa: ['objective', 'burst', 'anti_carry'],
  phantom_assassin: ['burst', 'mobility', 'late_game']
};

function normalizeHero(hero) {
  return resolveHeroId(hero) ?? String(hero ?? '')
    .toLowerCase()
    .replace(/^npc_dota_hero_/, '')
    .replace(/[^a-z0-9]+/g, '_');
}

function tagCount(heroes, tag) {
  return heroes.reduce((sum, hero) => {
    const id = normalizeHero(hero);
    const tags = HERO_TAGS[id] ?? getHeroCatalogEntry(id)?.draftTags ?? [];
    return sum + (tags.includes(tag) ? 1 : 0);
  }, 0);
}

function saturate(count, perHero = 0.24) {
  return Math.max(0, Math.min(1, count * perHero));
}

export function analyzeDraft(state) {
  const ownTeam = state.team === 'dire' ? state.draft.dire : state.draft.radiant;
  const enemyTeam = state.team === 'dire' ? state.draft.radiant : state.draft.dire;

  const enemyControl = saturate(tagCount(enemyTeam, 'hard_control'), 0.23);
  const enemyBurst = saturate(tagCount(enemyTeam, 'burst'), 0.24);
  const enemyKite = saturate(
    tagCount(enemyTeam, 'kite') + tagCount(enemyTeam, 'ranged_core') * 0.65,
    0.22
  );
  const enemyGlobal = saturate(tagCount(enemyTeam, 'global'), 0.28);
  const enemySave = saturate(tagCount(enemyTeam, 'save') + tagCount(enemyTeam, 'anti_burst'), 0.24);
  const enemyDurability = saturate(tagCount(enemyTeam, 'durable') + tagCount(enemyTeam, 'sustain') * 0.65, 0.18);

  const allyInitiation = saturate(tagCount(ownTeam, 'initiation'), 0.3);
  const allyControl = saturate(tagCount(ownTeam, 'hard_control'), 0.22);
  const allySave = saturate(tagCount(ownTeam, 'save') + tagCount(ownTeam, 'sustain') * 0.55, 0.25);
  const allyPush = saturate(tagCount(ownTeam, 'push') + tagCount(ownTeam, 'tower_damage') * 0.5, 0.2);

  const DIMENSION_TAGS={physicalDamage:['physical_damage','tower_damage'],magicalDamage:['magic_damage'],pureDamage:['pure_damage'],burst:['burst'],sustainedDamage:['late_game','flash_farm'],hardDisable:['hard_control'],softDisable:['kite'],instantDisable:['instant_disable'],silence:['silence'],break:['break'],dispel:['dispel'],save:['save','anti_burst'],healing:['sustain'],antiHeal:['anti_heal'],mobility:['mobility','global'],catch:['initiation','hard_control'],waveClear:['flash_farm','push'],push:['push'],summons:['summons'],illusions:['illusions'],roshanPotential:['objective'],towerDamage:['tower_damage'],teamfight:['hard_control','aura'],pickoff:['burst','initiation'],highGroundAttack:['ranged_core','tower_damage'],highGroundDefense:['wave_clear','ranged_core'],scaling:['late_game'],tempo:['burst','mobility']};
  const dimensions=Object.fromEntries(Object.entries(DIMENSION_TAGS).map(([key,tags])=>[key,{ally:saturate(tags.reduce((n,t)=>n+tagCount(ownTeam,t),0),.18),enemy:saturate(tags.reduce((n,t)=>n+tagCount(enemyTeam,t),0),.18)}]));
  const laneMatchups=(state.draft?.roles&&ownTeam.length&&enemyTeam.length)?Object.keys(state.draft.roles).map((lane)=>({lane,expectedDifficulty:'EVEN',mainThreats:[],opportunities:[],lanePlan:'Play from confirmed resources and wave state',earlyItemConsiderations:[],confidence:.5,missingData:['Exact lane opponent economy and wave state']})):[];
  return {
    ownTeam: ownTeam.map(normalizeHero),
    enemyTeam: enemyTeam.map(normalizeHero),
    enemyControl,
    enemyBurst,
    enemyKite,
    enemyGlobal,
    enemySave,
    enemyDurability,
    allyInitiation,
    allyControl,
    allySave,
    allyPush,
    dimensions,
    laneMatchups,
    confidence: ownTeam.length + enemyTeam.length >= 8 ? 0.9 : ownTeam.length + enemyTeam.length >= 4 ? 0.65 : 0.35
  };
}

export function getHeroTags(hero) {
  const id = normalizeHero(hero);
  return HERO_TAGS[id] ?? getHeroCatalogEntry(id)?.draftTags ?? [];
}
