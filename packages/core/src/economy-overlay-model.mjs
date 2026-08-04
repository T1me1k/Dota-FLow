const DEFAULT_BUYBACK_COOLDOWN_SEC = 420;

const ITEM_COSTS = Object.freeze({
  item_tango: 90, item_flask: 100, item_clarity: 50, item_faerie_fire: 65,
  item_branches: 50, item_magic_stick: 200, item_magic_wand: 450,
  item_boots: 500, item_power_treads: 1400, item_phase_boots: 1500,
  item_wraith_band: 505, item_bracer: 505, item_null_talisman: 505,
  item_bottle: 675, item_ring_of_health: 700, item_morbid_mask: 900,
  item_mask_of_madness: 1900, item_dragon_lance: 1900,
  item_diffusal_blade: 2500, item_maelstrom: 2950,
  item_black_king_bar: 4050, item_manta: 4650, item_sphere: 4800,
  item_skadi: 5300, item_satanic: 5050, item_butterfly: 5450,
  item_daedalus: 5100, item_hurricane_pike: 4450, item_blink: 2250
});

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeHero(value) {
  return String(value ?? '').replace(/^npc_dota_hero_/, '').trim().toLowerCase();
}

function normalizeItemId(value) {
  const id = String(value ?? '').trim().toLowerCase();
  if (!id) return '';
  return id.startsWith('item_') ? id : `item_${id}`;
}

function itemValue(items) {
  let known = 0;
  let unknown = 0;
  for (const raw of Array.isArray(items) ? items : []) {
    const id = normalizeItemId(typeof raw === 'string' ? raw : raw?.id ?? raw?.name);
    if (!id) continue;
    const explicit = finite(typeof raw === 'object' && raw ? raw.cost : null);
    const cost = explicit ?? ITEM_COSTS[id];
    if (cost === undefined || cost === null) unknown += 1;
    else known += Math.max(0, cost);
  }
  return { known, unknown };
}

function localNetWorth(state) {
  const direct = finite(state?.netWorth);
  if (direct !== null && direct >= 0) return { value: Math.round(direct), quality: 'EXACT', source: 'player.net_worth' };
  const roleContext = finite(state?.roleContext?.playerNetWorth);
  const roleQuality = String(state?.roleContext?.meta?.signals?.playerNetWorth?.quality ?? '').toUpperCase();
  if (roleContext !== null && roleContext >= 0 && ['LIVE', 'OBSERVED'].includes(roleQuality)) {
    return { value: Math.round(roleContext), quality: 'EXACT', source: 'role_context' };
  }
  const inventory = itemValue(state?.inventory);
  const gold = finite(state?.gold);
  if (gold !== null && inventory.known > 0 && inventory.unknown === 0) {
    return { value: Math.round(gold + inventory.known), quality: 'ESTIMATE', source: 'gold_plus_known_items' };
  }
  return { value: null, quality: 'UNAVAILABLE', source: 'missing_local_economy' };
}

function sameLocalPlayer(player, state) {
  const steam = state?.steamId == null ? null : String(state.steamId);
  if (steam && String(player?.steamId ?? player?.steam_id ?? '') === steam) return true;
  if (player?.isLocalPlayer === true || player?.local === true) return true;
  return normalizeHero(player?.hero ?? player?.heroId) === normalizeHero(state?.hero)
    && (player?.team == null || state?.team == null || String(player.team).toLowerCase() === String(state.team).toLowerCase());
}

function teamOf(player) {
  const team = player?.team ?? player?.teamId;
  if (Number(team) === 2 || String(team).toLowerCase() === 'radiant') return 'radiant';
  if (Number(team) === 3 || String(team).toLowerCase() === 'dire') return 'dire';
  return 'unknown';
}

function confirmedBuybackRemaining(player, state, gameTimeSec) {
  const explicit = finite(player?.buybackCooldownSec ?? player?.buyback_cooldown);
  if (explicit !== null) return Math.max(0, Math.ceil(explicit));
  const usedAt = finite(player?.buybackUsedAtSec ?? player?.lastBuybackAtSec ?? player?.buyback_used_at);
  if (usedAt === null) return null;
  const duration = finite(player?.buybackCooldownDurationSec) ?? DEFAULT_BUYBACK_COOLDOWN_SEC;
  return Math.max(0, Math.ceil(usedAt + duration - gameTimeSec));
}

function playerEconomy(player, state, isLocal) {
  if (isLocal) return localNetWorth(state);
  const direct = finite(player?.netWorth ?? player?.net_worth);
  const exactAllowed = player?.spectatorExact === true || player?.economyQuality === 'EXACT' || state?.phase === 'spectating';
  if (direct !== null && exactAllowed) return { value: Math.round(direct), quality: 'EXACT', source: 'spectator_exact' };

  const explicitLow = finite(player?.netWorthLow ?? player?.estimatedNetWorthLow);
  const explicitHigh = finite(player?.netWorthHigh ?? player?.estimatedNetWorthHigh);
  if (explicitLow !== null && explicitHigh !== null && explicitHigh >= explicitLow) {
    return { value: Math.round((explicitLow + explicitHigh) / 2), low: Math.round(explicitLow), high: Math.round(explicitHigh), quality: 'ESTIMATE', source: 'explicit_range' };
  }

  const inventory = itemValue(player?.inventory ?? player?.items);
  const level = finite(player?.level);
  const lastHits = finite(player?.lastHits ?? player?.last_hits);
  if (inventory.known > 0 || lastHits !== null) {
    const gameMinute = Math.max(0, finite(state?.gameTimeSec) ?? 0) / 60;
    const publicFarmFloor = Math.max(0, (lastHits ?? 0) * 38 + (level ?? 1) * 90);
    const base = Math.max(inventory.known, publicFarmFloor);
    const uncertainty = Math.max(900, Math.round(650 + gameMinute * 75 + inventory.unknown * 700));
    return { value: Math.round(base + uncertainty / 2), low: Math.round(base), high: Math.round(base + uncertainty), quality: 'ESTIMATE', source: 'public_signals' };
  }
  return { value: null, quality: 'UNAVAILABLE', source: 'missing_public_economy' };
}

function fallbackRows(state) {
  const local = localNetWorth(state);
  return [{
    id: 'local', hero: normalizeHero(state?.hero) || 'unknown', team: state?.team ?? 'unknown',
    local: true, economy: local, buybackRemainingSec: finite(state?.buybackCooldownSec),
    buybackQuality: finite(state?.buybackCooldownSec) === null ? 'UNAVAILABLE' : 'EXACT'
  }];
}

export function buildEconomyOverlayModel(state = {}, settings = {}) {
  const gameTimeSec = Math.max(0, finite(state?.gameTimeSec) ?? 0);
  const roster = Array.isArray(state?.roster) ? state.roster : [];
  const rows = roster.length ? roster.map((player, index) => {
    const local = sameLocalPlayer(player, state);
    const buybackRemainingSec = local
      ? finite(state?.buybackCooldownSec ?? player?.buybackCooldownSec)
      : confirmedBuybackRemaining(player, state, gameTimeSec);
    return {
      id: String(player?.steamId ?? player?.steam_id ?? player?.slot ?? index),
      hero: normalizeHero(player?.hero ?? player?.heroId) || `player_${index + 1}`,
      team: teamOf(player),
      local,
      economy: playerEconomy(player, state, local),
      buybackRemainingSec,
      buybackQuality: buybackRemainingSec === null ? 'UNAVAILABLE' : local ? 'EXACT' : 'CONFIRMED'
    };
  }) : fallbackRows(state);

  const localTeam = String(state?.team ?? rows.find((row) => row.local)?.team ?? 'unknown').toLowerCase();
  const filtered = rows.filter((row) => {
    const ally = row.local || row.team === localTeam;
    if (ally && settings.showAllies === false) return row.local;
    if (!ally && settings.showEnemies === false) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (settings.sort === 'NET_WORTH') {
      const av = a.economy.value ?? -1;
      const bv = b.economy.value ?? -1;
      if (bv !== av) return bv - av;
    }
    if (a.team !== b.team) return a.team === localTeam ? -1 : 1;
    if (a.local !== b.local) return a.local ? -1 : 1;
    return a.hero.localeCompare(b.hero);
  });

  return {
    rows: sorted,
    localTeam,
    exactCount: sorted.filter((row) => row.economy.quality === 'EXACT').length,
    estimatedCount: sorted.filter((row) => row.economy.quality === 'ESTIMATE').length,
    unavailableCount: sorted.filter((row) => row.economy.quality === 'UNAVAILABLE').length,
    generatedAt: Date.now()
  };
}
