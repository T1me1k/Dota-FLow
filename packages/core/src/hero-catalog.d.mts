export type HeroProfileTier = 'DETAILED' | 'BASELINE';

export interface HeroCatalogEntry {
  id: string;
  displayName: string;
  profileTemplate: string;
  primaryRole: string;
  roles: string[];
  draftTags: string[];
  calibrationTier: HeroProfileTier;
}

export const HERO_PROFILE_TIERS: Readonly<{
  DETAILED: 'DETAILED';
  BASELINE: 'BASELINE';
}>;

export const HERO_CATALOG: readonly HeroCatalogEntry[];

export function resolveHeroId(value: unknown): string | null;
export function getHeroCatalogEntry(value: unknown): HeroCatalogEntry | null;
export function isKnownHero(value: unknown): boolean;
export function listHeroCatalog(): HeroCatalogEntry[];
