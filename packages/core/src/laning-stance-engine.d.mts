export type LaningStanceCode = 'AGGRESSIVE' | 'TRADE' | 'NEUTRAL' | 'DEFENSIVE' | 'RESET';

export type LaningStanceResult = {
  action: LaningStanceCode;
  confidence: number;
  hero: string;
  role: string;
  level: number;
  healthPct: number;
  manaPct: number;
  ability: {
    name: string | null;
    ready: boolean;
    level: number;
    cooldown: number;
  };
  economy: {
    value: number;
    quality: string;
    unknownItems: number;
  };
  evidence: {
    opponentLevel: number | null;
    opponentNetWorth: number | null;
    danger: number | null;
    missingHeroesRisk: number | null;
    alliesNearby: number | null;
    enemiesNearby: number | null;
    killPotential: number | null;
  };
  hasSustain: boolean;
  reasons: string[];
  tipKey: string;
  missingSignals: string[];
  generatedAtSec: number;
  thresholds: {
    reserveManaPct: number;
    durationSec: number;
    cancelHealthPct: number;
    resumeHealthPct: number;
  };
};

export type PresentedLaningStance = {
  title: string;
  instruction: string;
  reasons: string[];
  cancellation: string;
  variables: Record<string, string | number>;
};

export declare const LANING_STANCES: Readonly<Record<LaningStanceCode, LaningStanceCode>>;
export declare function evaluateLaningStance(state?: Record<string, unknown>): LaningStanceResult;
export declare function presentLaningStance(
  result: LaningStanceResult,
  language?: 'ru' | 'en'
): PresentedLaningStance;
export declare const LANING_HERO_RULES: Readonly<Record<string, Record<string, unknown>>>;
