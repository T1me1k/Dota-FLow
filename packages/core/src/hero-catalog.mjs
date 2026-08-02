export const HERO_PROFILE_TIERS = Object.freeze({
  DETAILED: 'DETAILED',
  BASELINE: 'BASELINE'
});

const HERO_NAMES = [
  ['abaddon', 'Abaddon'],
  ['alchemist', 'Alchemist'],
  ['ancient_apparition', 'Ancient Apparition'],
  ['anti_mage', 'Anti-Mage'],
  ['arc_warden', 'Arc Warden'],
  ['axe', 'Axe'],
  ['bane', 'Bane'],
  ['batrider', 'Batrider'],
  ['beastmaster', 'Beastmaster'],
  ['bloodseeker', 'Bloodseeker'],
  ['bounty_hunter', 'Bounty Hunter'],
  ['brewmaster', 'Brewmaster'],
  ['bristleback', 'Bristleback'],
  ['broodmother', 'Broodmother'],
  ['centaur_warrunner', 'Centaur Warrunner'],
  ['chaos_knight', 'Chaos Knight'],
  ['chen', 'Chen'],
  ['clinkz', 'Clinkz'],
  ['clockwerk', 'Clockwerk'],
  ['crystal_maiden', 'Crystal Maiden'],
  ['dark_seer', 'Dark Seer'],
  ['dark_willow', 'Dark Willow'],
  ['dawnbreaker', 'Dawnbreaker'],
  ['dazzle', 'Dazzle'],
  ['death_prophet', 'Death Prophet'],
  ['disruptor', 'Disruptor'],
  ['doom', 'Doom'],
  ['dragon_knight', 'Dragon Knight'],
  ['drow_ranger', 'Drow Ranger'],
  ['earth_spirit', 'Earth Spirit'],
  ['earthshaker', 'Earthshaker'],
  ['elder_titan', 'Elder Titan'],
  ['ember_spirit', 'Ember Spirit'],
  ['enchantress', 'Enchantress'],
  ['enigma', 'Enigma'],
  ['faceless_void', 'Faceless Void'],
  ['grimstroke', 'Grimstroke'],
  ['gyrocopter', 'Gyrocopter'],
  ['hoodwink', 'Hoodwink'],
  ['huskar', 'Huskar'],
  ['invoker', 'Invoker'],
  ['io', 'Io'],
  ['jakiro', 'Jakiro'],
  ['juggernaut', 'Juggernaut'],
  ['keeper_of_the_light', 'Keeper of the Light'],
  ['kez', 'Kez'],
  ['kunkka', 'Kunkka'],
  ['largo', 'Largo'],
  ['legion_commander', 'Legion Commander'],
  ['leshrac', 'Leshrac'],
  ['lich', 'Lich'],
  ['lifestealer', 'Lifestealer'],
  ['lina', 'Lina'],
  ['lion', 'Lion'],
  ['lone_druid', 'Lone Druid'],
  ['luna', 'Luna'],
  ['lycan', 'Lycan'],
  ['magnus', 'Magnus'],
  ['marci', 'Marci'],
  ['mars', 'Mars'],
  ['medusa', 'Medusa'],
  ['meepo', 'Meepo'],
  ['mirana', 'Mirana'],
  ['monkey_king', 'Monkey King'],
  ['morphling', 'Morphling'],
  ['muerta', 'Muerta'],
  ['naga_siren', 'Naga Siren'],
  ['natures_prophet', "Nature's Prophet"],
  ['necrophos', 'Necrophos'],
  ['night_stalker', 'Night Stalker'],
  ['nyx_assassin', 'Nyx Assassin'],
  ['ogre_magi', 'Ogre Magi'],
  ['omniknight', 'Omniknight'],
  ['oracle', 'Oracle'],
  ['outworld_destroyer', 'Outworld Destroyer'],
  ['pangolier', 'Pangolier'],
  ['phantom_assassin', 'Phantom Assassin'],
  ['phantom_lancer', 'Phantom Lancer'],
  ['phoenix', 'Phoenix'],
  ['primal_beast', 'Primal Beast'],
  ['puck', 'Puck'],
  ['pudge', 'Pudge'],
  ['pugna', 'Pugna'],
  ['queen_of_pain', 'Queen of Pain'],
  ['razor', 'Razor'],
  ['riki', 'Riki'],
  ['ringmaster', 'Ringmaster'],
  ['rubick', 'Rubick'],
  ['sand_king', 'Sand King'],
  ['shadow_demon', 'Shadow Demon'],
  ['shadow_fiend', 'Shadow Fiend'],
  ['shadow_shaman', 'Shadow Shaman'],
  ['silencer', 'Silencer'],
  ['skywrath_mage', 'Skywrath Mage'],
  ['slardar', 'Slardar'],
  ['slark', 'Slark'],
  ['snapfire', 'Snapfire'],
  ['sniper', 'Sniper'],
  ['spectre', 'Spectre'],
  ['spirit_breaker', 'Spirit Breaker'],
  ['storm_spirit', 'Storm Spirit'],
  ['sven', 'Sven'],
  ['techies', 'Techies'],
  ['templar_assassin', 'Templar Assassin'],
  ['terrorblade', 'Terrorblade'],
  ['tidehunter', 'Tidehunter'],
  ['timbersaw', 'Timbersaw'],
  ['tinker', 'Tinker'],
  ['tiny', 'Tiny'],
  ['treant_protector', 'Treant Protector'],
  ['troll_warlord', 'Troll Warlord'],
  ['tusk', 'Tusk'],
  ['underlord', 'Underlord'],
  ['undying', 'Undying'],
  ['ursa', 'Ursa'],
  ['vengeful_spirit', 'Vengeful Spirit'],
  ['venomancer', 'Venomancer'],
  ['viper', 'Viper'],
  ['visage', 'Visage'],
  ['void_spirit', 'Void Spirit'],
  ['warlock', 'Warlock'],
  ['weaver', 'Weaver'],
  ['windranger', 'Windranger'],
  ['winter_wyvern', 'Winter Wyvern'],
  ['witch_doctor', 'Witch Doctor'],
  ['wraith_king', 'Wraith King'],
  ['zeus', 'Zeus']
];

const TEMPLATE_MEMBERS = {
  support: new Set('ancient_apparition bane bounty_hunter chen crystal_maiden dark_willow dazzle disruptor enchantress grimstroke hoodwink io jakiro keeper_of_the_light largo lich lion mirana ogre_magi omniknight oracle phoenix ringmaster rubick shadow_demon shadow_shaman silencer skywrath_mage snapfire techies treant_protector undying vengeful_spirit venomancer warlock winter_wyvern witch_doctor'.split(' ')),
  initiator: new Set('axe batrider beastmaster brewmaster centaur_warrunner clockwerk dark_seer earth_spirit earthshaker elder_titan enigma magnus mars nyx_assassin primal_beast pudge sand_king spirit_breaker tidehunter tusk underlord'.split(' ')),
  caster_core: new Set('death_prophet invoker leshrac lina necrophos outworld_destroyer puck pugna queen_of_pain storm_spirit tinker zeus'.split(' ')),
  pusher: new Set('broodmother lycan meepo natures_prophet visage'.split(' ')),
  durable: new Set('abaddon bristleback dawnbreaker doom dragon_knight huskar kunkka legion_commander night_stalker slardar timbersaw'.split(' ')),
  hard_carry: new Set('alchemist anti_mage arc_warden chaos_knight drow_ranger faceless_void gyrocopter juggernaut lifestealer lone_druid luna medusa morphling muerta naga_siren phantom_assassin phantom_lancer slark sniper spectre sven terrorblade troll_warlord ursa weaver wraith_king'.split(' '))
};

const DETAILED_HEROES = new Set([
  'alchemist', 'anti_mage', 'arc_warden', 'bloodseeker', 'chaos_knight', 'clinkz',
  'dawnbreaker', 'dragon_knight', 'drow_ranger', 'ember_spirit', 'faceless_void', 'gyrocopter',
  'invoker', 'juggernaut', 'lifestealer', 'lina', 'luna', 'marci',
  'medusa', 'monkey_king', 'morphling', 'muerta', 'naga_siren', 'phantom_assassin',
  'phantom_lancer', 'puck', 'queen_of_pain', 'razor', 'slark', 'spectre',
  'storm_spirit', 'sven', 'terrorblade', 'tiny', 'troll_warlord', 'ursa',
  'void_spirit', 'weaver', 'wraith_king', 'zeus'
]);

const INTERNAL_ALIASES = {
  antimage: 'anti_mage',
  centaur: 'centaur_warrunner',
  rattletrap: 'clockwerk',
  doom_bringer: 'doom',
  wisp: 'io',
  life_stealer: 'lifestealer',
  magnataur: 'magnus',
  furion: 'natures_prophet',
  nature_prophet: 'natures_prophet',
  necrolyte: 'necrophos',
  obsidian_destroyer: 'outworld_destroyer',
  queenofpain: 'queen_of_pain',
  nevermore: 'shadow_fiend',
  shredder: 'timbersaw',
  treant: 'treant_protector',
  abyssal_underlord: 'underlord',
  vengefulspirit: 'vengeful_spirit',
  windrunner: 'windranger',
  skeleton_king: 'wraith_king',
  zuus: 'zeus'
};

const TAG_SETS = {
  global: new Set('dawnbreaker io natures_prophet spectre spirit_breaker zeus'.split(' ')),
  save: new Set('abaddon dazzle io keeper_of_the_light omniknight oracle phoenix pugna shadow_demon treant_protector tusk vengeful_spirit winter_wyvern'.split(' ')),
  hard_control: new Set('axe bane beastmaster centaur_warrunner clockwerk crystal_maiden dark_willow disruptor earthshaker elder_titan enigma faceless_void kunkka legion_commander lion magnus mars nyx_assassin primal_beast puck pudge sand_king shadow_shaman slardar spirit_breaker tidehunter treant_protector tusk underlord vengeful_spirit'.split(' ')),
  burst: new Set('ancient_apparition clinkz ember_spirit invoker kez lina lion morphling nyx_assassin phantom_assassin queen_of_pain shadow_fiend skywrath_mage storm_spirit sven templar_assassin tiny zeus'.split(' ')),
  kite: new Set('drow_ranger hoodwink mirana puck queen_of_pain razor sniper venomancer viper weaver windranger'.split(' ')),
  push: new Set('beastmaster broodmother chen death_prophet dragon_knight lone_druid luna lycan meepo natures_prophet pugna shadow_shaman terrorblade visage'.split(' ')),
  durable: new Set('abaddon axe bristleback centaur_warrunner chaos_knight dawnbreaker doom dragon_knight huskar kunkka mars medusa night_stalker ogre_magi primal_beast pudge slardar spectre tidehunter timbersaw underlord undying wraith_king'.split(' ')),
  sustain: new Set('abaddon alchemist bristleback dazzle enchantress huskar juggernaut lifestealer necrophos omniknight oracle timbersaw treant_protector undying'.split(' ')),
  fragile: new Set('ancient_apparition crystal_maiden dark_willow dazzle disruptor hoodwink lich lion oracle pugna ringmaster shadow_demon shadow_shaman skywrath_mage sniper warlock witch_doctor'.split(' ')),
  ranged_core: new Set('arc_warden drow_ranger gyrocopter lina lone_druid luna medusa morphling muerta razor shadow_fiend sniper templar_assassin troll_warlord viper windranger'.split(' ')),
  late_game: new Set('anti_mage arc_warden chaos_knight drow_ranger faceless_void medusa morphling naga_siren phantom_assassin phantom_lancer spectre terrorblade'.split(' ')),
  objective: new Set('alchemist beastmaster chen juggernaut lone_druid lycan meepo shadow_shaman troll_warlord ursa visage'.split(' '))
};

const TEMPLATE_METADATA = {
  support: { primaryRole: 'support', roles: ['Support'], draftTags: ['fragile'] },
  initiator: { primaryRole: 'offlane', roles: ['Initiator', 'Disabler'], draftTags: ['initiation', 'hard_control'] },
  caster_core: { primaryRole: 'core', roles: ['Core', 'Nuker'], draftTags: ['magic_damage', 'burst'] },
  pusher: { primaryRole: 'core', roles: ['Core', 'Pusher'], draftTags: ['push', 'tower_damage', 'split_push'] },
  durable: { primaryRole: 'core', roles: ['Core', 'Durable'], draftTags: ['durable', 'sustain'] },
  hard_carry: { primaryRole: 'carry', roles: ['Carry'], draftTags: ['late_game', 'tower_damage'] },
  tempo_core: { primaryRole: 'core', roles: ['Core'], draftTags: ['burst', 'mobility'] }
};

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^npc_dota_hero_/, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function profileTemplateFor(id) {
  for (const [template, members] of Object.entries(TEMPLATE_MEMBERS)) {
    if (members.has(id)) return template;
  }
  return 'tempo_core';
}

function draftTagsFor(id, template) {
  const tags = new Set(TEMPLATE_METADATA[template].draftTags);
  for (const [tag, members] of Object.entries(TAG_SETS)) {
    if (members.has(id)) tags.add(tag);
  }
  return [...tags];
}

export const HERO_CATALOG = Object.freeze(HERO_NAMES.map(([id, displayName]) => {
  const profileTemplate = profileTemplateFor(id);
  const metadata = TEMPLATE_METADATA[profileTemplate];
  return Object.freeze({
    id,
    displayName,
    profileTemplate,
    primaryRole: metadata.primaryRole,
    roles: [...metadata.roles],
    draftTags: draftTagsFor(id, profileTemplate),
    calibrationTier: DETAILED_HEROES.has(id) ? HERO_PROFILE_TIERS.DETAILED : HERO_PROFILE_TIERS.BASELINE
  });
}));

const catalogById = new Map(HERO_CATALOG.map((hero) => [hero.id, hero]));
const aliasMap = new Map();

for (const hero of HERO_CATALOG) {
  aliasMap.set(hero.id, hero.id);
  aliasMap.set(normalizeKey(hero.displayName), hero.id);
}
for (const [alias, id] of Object.entries(INTERNAL_ALIASES)) aliasMap.set(alias, id);

export function resolveHeroId(value) {
  const normalized = normalizeKey(value);
  return aliasMap.get(normalized) ?? null;
}

export function getHeroCatalogEntry(value) {
  const id = resolveHeroId(value);
  return id ? catalogById.get(id) ?? null : null;
}

export function isKnownHero(value) {
  return resolveHeroId(value) !== null;
}

export function listHeroCatalog() {
  return [...HERO_CATALOG];
}
