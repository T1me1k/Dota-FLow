import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cosmeticWeatherIsFresh,
  createCosmeticWeatherTelemetry,
  shouldShowBloodMoon,
  updateCosmeticWeatherTelemetry
} from '../src/cosmetic-weather.mjs';

test('clock_time_changed preserves approved Dota day/night telemetry', () => {
  const observedAt = 1_000_000;
  const next = updateCosmeticWeatherTelemetry(createCosmeticWeatherTelemetry(), {
    type: 'game-event',
    receivedAt: observedAt,
    payload: {
      events: [{
        name: 'clock_time_changed',
        data: JSON.stringify({ daytime: false, clock_time: 301, nightstalker_night: false })
      }]
    }
  });

  assert.equal(next.source, 'OVERWOLF_GEP');
  assert.equal(next.daytime, false);
  assert.equal(next.nightstalkerNight, false);
  assert.equal(next.clockTimeSec, 301);
  assert.equal(next.observedAt, observedAt);
  assert.equal(cosmeticWeatherIsFresh(next, observedAt + 2_000), true);
});

test('Blood Moon activates only in playing phase and approved night state', () => {
  const now = 2_000_000;
  const telemetry = createCosmeticWeatherTelemetry({
    source: 'OVERWOLF_GEP',
    daytime: false,
    nightstalkerNight: false,
    observedAt: now
  });
  const settings = { weatherEnabled: true, weatherActivation: 'NIGHT_ONLY' };

  assert.equal(shouldShowBloodMoon(settings, telemetry, 'playing', now), true);
  assert.equal(shouldShowBloodMoon(settings, telemetry, 'pregame', now), false);
  assert.equal(shouldShowBloodMoon({ ...settings, weatherEnabled: false }, telemetry, 'playing', now), false);
});

test('Night-only mode fails closed on stale telemetry while ALWAYS stays user-controlled', () => {
  const observedAt = 3_000_000;
  const telemetry = createCosmeticWeatherTelemetry({
    source: 'OVERWOLF_GEP',
    daytime: false,
    observedAt
  });

  assert.equal(shouldShowBloodMoon({ weatherEnabled: true, weatherActivation: 'NIGHT_ONLY' }, telemetry, 'playing', observedAt + 4_000), false);
  assert.equal(shouldShowBloodMoon({ weatherEnabled: true, weatherActivation: 'ALWAYS' }, telemetry, 'playing', observedAt + 4_000), true);
});

test('Night Stalker night is treated as night without inferring hidden state', () => {
  const observedAt = 4_000_000;
  const telemetry = updateCosmeticWeatherTelemetry(createCosmeticWeatherTelemetry(), {
    type: 'game-event',
    receivedAt: observedAt,
    payload: {
      events: [{
        name: 'daytime_changed',
        data: JSON.stringify({ daytime: true, clock_time: 600, nightstalker_night: true })
      }]
    }
  });

  assert.equal(shouldShowBloodMoon({ weatherEnabled: true, weatherActivation: 'NIGHT_ONLY' }, telemetry, 'playing', observedAt), true);
});

test('game exit clears weather telemetry', () => {
  const telemetry = createCosmeticWeatherTelemetry({ source: 'OVERWOLF_GEP', daytime: false, observedAt: 123 });
  const next = updateCosmeticWeatherTelemetry(telemetry, {
    type: 'status',
    payload: { code: 'GAME_EXIT' }
  });

  assert.deepEqual(next, createCosmeticWeatherTelemetry());
});
