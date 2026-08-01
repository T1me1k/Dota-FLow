const STEAM64_BASE = 76561197960265728n;

export function steamId64ToAccountId(value) {
  try {
    const steamId = BigInt(String(value));
    const accountId = steamId - STEAM64_BASE;
    return accountId >= 0n ? Number(accountId) : null;
  } catch {
    return null;
  }
}

function winFromMatch(match, accountId) {
  const playerSlot = Number(match.player_slot ?? 0);
  const radiant = playerSlot < 128;
  return Boolean(match.radiant_win) === radiant;
}

export function summarizeRecentMatches(matches = [], accountId) {
  const recent = Array.isArray(matches) ? matches.slice(0, 20) : [];
  const wins = recent.filter((match) => winFromMatch(match, accountId)).length;
  const avg = (field) => recent.length
    ? recent.reduce((sum, match) => sum + Number(match[field] ?? 0), 0) / recent.length
    : 0;
  const itemFrequency = new Map();
  for (const match of recent) {
    for (const key of ['item_0', 'item_1', 'item_2', 'item_3', 'item_4', 'item_5']) {
      const itemId = Number(match[key]);
      if (Number.isFinite(itemId) && itemId > 0) itemFrequency.set(itemId, (itemFrequency.get(itemId) ?? 0) + 1);
    }
  }
  return {
    matches: recent.length,
    wins,
    losses: Math.max(0, recent.length - wins),
    winRate: recent.length ? wins / recent.length : null,
    averages: { kills: avg('kills'), deaths: avg('deaths'), assists: avg('assists'), gpm: avg('gold_per_min'), xpm: avg('xp_per_min') },
    commonItemIds: [...itemFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([itemId, count]) => ({ itemId, count }))
  };
}

export class OpenDotaScoutingProvider {
  constructor({ fetchImpl = globalThis.fetch, baseUrl = 'https://api.opendota.com/api' } = {}) {
    this.fetchImpl = fetchImpl;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async #json(path) {
    if (typeof this.fetchImpl !== 'function') throw new Error('fetch is unavailable');
    const response = await this.fetchImpl(`${this.baseUrl}${path}`);
    if (!response?.ok) throw new Error(`OpenDota request failed: ${response?.status ?? 'unknown status'}`);
    return response.json();
  }

  async getPlayer(steamId) {
    const accountId = steamId64ToAccountId(steamId);
    if (accountId === null) return { status: 'UNAVAILABLE', steamId, limitations: ['Invalid Steam ID'] };
    try {
      const [profile, recentMatches, winLoss] = await Promise.all([
        this.#json(`/players/${accountId}`),
        this.#json(`/players/${accountId}/recentMatches`),
        this.#json(`/players/${accountId}/wl`)
      ]);
      return {
        status: 'PUBLIC',
        source: 'OpenDota',
        steamId: String(steamId),
        accountId,
        profile: profile?.profile ?? null,
        rankTier: profile?.rank_tier ?? null,
        leaderboardRank: profile?.leaderboard_rank ?? null,
        totals: { wins: Number(winLoss?.win ?? 0), losses: Number(winLoss?.lose ?? 0) },
        recent: summarizeRecentMatches(recentMatches, accountId),
        limitations: profile?.profile ? [] : ['Public profile details are unavailable']
      };
    } catch (error) {
      return { status: 'UNAVAILABLE', source: 'OpenDota', steamId: String(steamId), accountId, limitations: [error.message] };
    }
  }

  async getRoster(players = []) {
    const results = await Promise.all(players.map((player) => this.getPlayer(player.steamId ?? player.steam_id)));
    return { status: results.some((entry) => entry.status === 'PUBLIC') ? 'PARTIAL' : 'UNAVAILABLE', source: 'OpenDota', players: results };
  }
}
