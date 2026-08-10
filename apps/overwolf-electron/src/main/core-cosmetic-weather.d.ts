declare module '*cosmetic-weather.mjs' {
  export type CosmeticWeatherTelemetry = {
    source: string;
    daytime: boolean | null;
    nightstalkerNight: boolean;
    clockTimeSec: number | null;
    observedAt: number | null;
    eventName: string | null;
  };

  export function createCosmeticWeatherTelemetry(overrides?: Partial<CosmeticWeatherTelemetry>): CosmeticWeatherTelemetry;
  export function updateCosmeticWeatherTelemetry(previous: CosmeticWeatherTelemetry, envelope: unknown): CosmeticWeatherTelemetry;
  export function cosmeticWeatherIsFresh(telemetry: CosmeticWeatherTelemetry, nowMs?: number, staleAfterMs?: number): boolean;
  export function shouldShowBloodMoon(settings: Record<string, unknown>, telemetry: CosmeticWeatherTelemetry, phase: unknown, nowMs?: number): boolean;
}
