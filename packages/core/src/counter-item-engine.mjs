import { analyzeDraft, getHeroTags } from './draft-analyzer.mjs';

const ITEM_LIBRARY = Object.freeze({
  bkb: { id: 'item_black_king_bar', name: 'Black King Bar', roles: ['carry', 'mid', 'offlane'] },
  linken: { id: 'item_sphere', name: "Linken's Sphere", roles: ['carry', 'mid', 'offlane'] },
  manta: { id: 'item_manta', name: 'Manta Style', roles: ['carry', 'mid'] },
  lotus: { id: 'item_lotus_orb', name: 'Lotus Orb', roles: ['offlane', 'soft_support', 'hard_support'] },
  pipe: { id: 'item_pipe', name: 'Pipe of Insight', roles: ['offlane', 'soft_support', 'hard_support'] },
  force: { id: 'item_force_staff', name: 'Force Staff', roles: ['mid', 'offlane', 'soft_support', 'hard_support'] },
  glimmer: { id: 'item_glimmer_cape', name: 'Glimmer Cape', roles: ['soft_support', 'hard_support'] },
  nullifier: { id: 'item_nullifier', name: 'Nullifier', roles: ['carry', 'mid'] },
  skadi: { id: 'item_skadi', name: 'Eye of Skadi', roles: ['carry', 'mid'] },
  vessel: { id: 'item_spirit_vessel', name: 'Spirit Vessel', roles: ['mid', 'offlane', 'soft_support'] },
  shivas: { id: 'item_shivas_guard', name: "Shiva's Guard", roles: ['mid', 'offlane'] },
  mkb: { id: 'item_monkey_king_bar', name: 'Monkey King Bar', roles: ['carry', 'mid'] },
  pike: { id: 'item_hurricane_pike', name: 'Hurricane Pike', roles: ['carry', 'mid'] },
  blink: { id: 'item_blink', name: 'Blink Dagger', roles: ['carry', 'mid', 'offlane', 'soft_support'] },
  sheep: { id: 'item_sheepstick', name: 'Scythe of Vyse', roles: ['mid', 'soft_support', 'hard_support'] },
  dust: { id: 'item_dust', name: 'Dust of Appearance', roles: ['carry', 'mid', 'offlane', 'soft_support', 'hard_support'] },
  sentry: { id: 'item_ward_sentry', name: 'Sentry Ward', roles: ['soft_support', 'hard_support'] }
});

const RULES = Object.freeze([
  { tag: 'hard_control', itemKeys: ['bkb', 'linken', 'lotus'], weight: 22, reason: 'У противника много надёжного контроля' },
  { tag: 'burst', itemKeys: ['bkb', 'glimmer', 'pipe'], weight: 18, reason: 'Нужно пережить вражеский burst' },
  { tag: 'magic_damage', itemKeys: ['bkb', 'pipe', 'glimmer'], weight: 17, reason: 'Высокая доля магического урона' },
  { tag: 'save', itemKeys: ['nullifier', 'sheep'], weight: 18, reason: 'Вражеские save-эффекты мешают завершать цели' },
  { tag: 'anti_burst', itemKeys: ['nullifier', 'sheep'], weight: 15, reason: 'Нужно снимать защитные эффекты и удерживать цель' },
  { tag: 'sustain', itemKeys: ['skadi', 'vessel', 'shivas'], weight: 17, reason: 'У противника сильное лечение и восстановление' },
  { tag: 'durable', itemKeys: ['skadi', 'vessel', 'shivas'], weight: 13, reason: 'Нужны anti-heal и длительный урон по плотным героям' },
  { tag: 'kite', itemKeys: ['pike', 'blink', 'bkb'], weight: 15, reason: 'Противник может держать тебя на дистанции' },
  { tag: 'ranged_core', itemKeys: ['blink', 'pike'], weight: 12, reason: 'Нужен способ сокращать дистанцию или менять позицию' },
  { tag: 'mobility', itemKeys: ['sheep', 'linken'], weight: 12, reason: 'Мобильные цели требуют мгновенного контроля' },
  { tag: 'global', itemKeys: ['linken', 'lotus', 'force'], weight: 10, reason: 'Глобальная и дальняя инициация повышает ценность защиты' },
  { tag: 'fragile', itemKeys: ['blink', 'sheep'], weight: 7, reason: 'Можно ускорить убийство уязвимой задней линии' }
]);

function itemAllowed(item, role) {
  return item.roles.includes(role);
}

function ownedIds(state) {
  return new Set((state.inventory ?? []).map((item) => item.id));
}

export function recommendCounterItems(state, { limit = 5 } = {}) {
  const draft = analyzeDraft(state);
  const enemyTeam = draft.enemyTeam;
  const role = state.role ?? 'carry';
  const owned = ownedIds(state);
  const scores = new Map();

  for (const hero of enemyTeam) {
    for (const tag of getHeroTags(hero)) {
      for (const rule of RULES) {
        if (rule.tag !== tag) continue;
        for (const itemKey of rule.itemKeys) {
          const item = ITEM_LIBRARY[itemKey];
          if (!item || !itemAllowed(item, role) || owned.has(item.id)) continue;
          const current = scores.get(item.id) ?? { ...item, score: 0, reasons: new Set(), counters: new Set() };
          current.score += rule.weight;
          current.reasons.add(rule.reason);
          current.counters.add(hero);
          scores.set(item.id, current);
        }
      }
    }
  }

  const recommendations = [...scores.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((entry, index) => ({
      id: entry.id,
      name: entry.name,
      priority: index + 1,
      score: entry.score,
      reasons: [...entry.reasons].slice(0, 3),
      counters: [...entry.counters].slice(0, 4),
      source: 'draft_rules'
    }));

  return {
    recommendations,
    enemyTeam,
    role,
    confidence: Math.max(0.25, Math.min(0.95, draft.confidence * (enemyTeam.length / 5))),
    limitations: enemyTeam.length < 5 ? ['Неполный вражеский draft'] : []
  };
}

export { ITEM_LIBRARY as COUNTER_ITEM_LIBRARY };
