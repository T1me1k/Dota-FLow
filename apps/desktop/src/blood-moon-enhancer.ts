import type { RuntimeSnapshot } from './runtime/provider';
import './blood-moon-enhancer.css';

type WeatherActivation = 'NIGHT_ONLY' | 'ALWAYS';
type WeatherIntensity = 'SUBTLE' | 'NORMAL' | 'CINEMATIC';
type BloodMoonSettings = {
  weatherEnabled: boolean;
  weatherPreset: 'BLOOD_MOON';
  weatherActivation: WeatherActivation;
  weatherIntensity: WeatherIntensity;
  weatherReactiveKills: boolean;
  weatherLightning: boolean;
};
type WeatherTelemetry = {
  source?: string;
  daytime?: boolean | null;
  nightstalkerNight?: boolean;
  clockTimeSec?: number | null;
  observedAt?: number | null;
  eventName?: string | null;
};
type WeatherSnapshot = RuntimeSnapshot & { weather?: WeatherTelemetry };
type DotaFlowApi = {
  getOverlaySettings(): Promise<unknown>;
  setOverlaySettings(settings: unknown): Promise<unknown>;
  onOverlaySettings?(listener: (settings: unknown) => void): () => void;
};

const SNAPSHOT_EVENT = 'dota-flow:runtime-snapshot';
const STORAGE_KEY = 'dota-flow-blood-moon-v1';
const WEATHER_ROUTE = '/weather-overlay';
const defaults: BloodMoonSettings = {
  weatherEnabled: false,
  weatherPreset: 'BLOOD_MOON',
  weatherActivation: 'NIGHT_ONLY',
  weatherIntensity: 'SUBTLE',
  weatherReactiveKills: true,
  weatherLightning: true
};

let settings = loadLocal();
let latest: WeatherSnapshot | null = null;
let settingsCard: HTMLElement | null = null;
let weatherRoot: HTMLElement | null = null;
let ashLayer: HTMLElement | null = null;
let lastKills: number | null = null;
let renderQueued = false;
let lightningTimer: number | null = null;

const copy = {
  ru: {
    kicker: 'Dota Flow Immersion', title: 'Blood Moon',
    description: 'Ranked-safe косметическая погода: только Overwolf overlay и разрешённые события Dota.',
    enabled: 'Включить Blood Moon', activation: 'Когда показывать', night: 'Только ночью в Dota', always: 'Всегда во время матча',
    intensity: 'Интенсивность', subtle: 'Лёгкая', normal: 'Обычная', cinematic: 'Кинематографичная',
    reactive: 'Молния после убийства', lightning: 'Включить вспышки молнии',
    safety: 'Не меняет .vpk, память, ввод или игровые ресурсы. При потере day/night-сигнала ночной режим выключается.'
  },
  en: {
    kicker: 'Dota Flow Immersion', title: 'Blood Moon',
    description: 'Ranked-safe cosmetic weather using only the Overwolf overlay and approved Dota events.',
    enabled: 'Enable Blood Moon', activation: 'Activation', night: 'Only during Dota night', always: 'Always while playing',
    intensity: 'Intensity', subtle: 'Subtle', normal: 'Normal', cinematic: 'Cinematic',
    reactive: 'Lightning after a kill', lightning: 'Enable lightning flashes',
    safety: 'Does not modify .vpk files, memory, input, or game assets. Night mode fails closed when day/night telemetry is unavailable.'
  }
} as const;

function language(): 'ru' | 'en' {
  return document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'ru';
}
function c() { return copy[language()]; }
function objectOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function api(): DotaFlowApi | undefined {
  return (window as unknown as { dotaFlow?: DotaFlowApi }).dotaFlow;
}
function safeSettings(value: unknown): BloodMoonSettings {
  const raw = objectOf(value);
  const activation = String(raw.weatherActivation ?? defaults.weatherActivation).toUpperCase();
  const intensity = String(raw.weatherIntensity ?? defaults.weatherIntensity).toUpperCase();
  return {
    weatherEnabled: raw.weatherEnabled === true,
    weatherPreset: 'BLOOD_MOON',
    weatherActivation: activation === 'ALWAYS' ? 'ALWAYS' : 'NIGHT_ONLY',
    weatherIntensity: intensity === 'NORMAL' || intensity === 'CINEMATIC' ? intensity : 'SUBTLE',
    weatherReactiveKills: raw.weatherReactiveKills !== false,
    weatherLightning: raw.weatherLightning !== false
  };
}
function loadLocal(): BloodMoonSettings {
  try { return safeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')); }
  catch { return { ...defaults }; }
}
function persist(): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }

async function save(patch: Partial<BloodMoonSettings>): Promise<void> {
  settings = safeSettings({ ...settings, ...patch });
  persist();
  scheduleRender();
  const bridge = api();
  if (!bridge) return;
  try { await bridge.setOverlaySettings(settings); }
  catch { /* Browser preview / startup race. */ }
}

async function loadRemote(): Promise<void> {
  const bridge = api();
  if (!bridge) return;
  try {
    settings = safeSettings({ ...settings, ...objectOf(await bridge.getOverlaySettings()) });
    persist();
    scheduleRender();
  } catch { /* Startup race. */ }
}

function checkbox(label: string, checked: boolean, onChange: (value: boolean) => void): HTMLElement {
  const wrap = document.createElement('label');
  wrap.className = 'blood-moon-check';
  const input = document.createElement('input');
  input.type = 'checkbox'; input.checked = checked; input.onchange = () => onChange(input.checked);
  const text = document.createElement('span'); text.textContent = label;
  wrap.append(input, text); return wrap;
}
function selectField(label: string, value: string, options: Array<[string, string]>, onChange: (value: string) => void): HTMLElement {
  const wrap = document.createElement('label'); wrap.className = 'blood-moon-field';
  const text = document.createElement('span'); text.textContent = label;
  const select = document.createElement('select');
  for (const [optionValue, optionLabel] of options) {
    const option = document.createElement('option'); option.value = optionValue; option.textContent = optionLabel; select.append(option);
  }
  select.value = value; select.onchange = () => onChange(select.value);
  wrap.append(text, select); return wrap;
}

function buildSettingsCard(): HTMLElement {
  const card = document.createElement('section');
  card.className = 'card blood-moon-settings-card';
  card.dataset.bloodMoonSettings = 'true';
  card.innerHTML = '<div class="blood-moon-card-head"><div class="blood-moon-card-orb"></div><div><p class="kicker"></p><h2></h2></div></div><p class="subtle blood-moon-description"></p><div class="blood-moon-settings-controls"></div><p class="blood-moon-safety"></p>';
  return card;
}

function renderSettings(): void {
  if (location.pathname !== '/settings') { settingsCard?.remove(); settingsCard = null; return; }
  const grid = document.querySelector<HTMLElement>('.settings-grid');
  if (!grid) return;
  if (!settingsCard || !settingsCard.isConnected) { settingsCard = buildSettingsCard(); grid.prepend(settingsCard); }
  const signature = JSON.stringify([language(), settings]);
  if (settingsCard.dataset.signature === signature) return;
  settingsCard.dataset.signature = signature;
  const text = c();
  const kicker = settingsCard.querySelector('.kicker'); if (kicker) kicker.textContent = text.kicker;
  const title = settingsCard.querySelector('h2'); if (title) title.textContent = text.title;
  const description = settingsCard.querySelector('.blood-moon-description'); if (description) description.textContent = text.description;
  const safety = settingsCard.querySelector('.blood-moon-safety'); if (safety) safety.textContent = text.safety;
  const controls = settingsCard.querySelector<HTMLElement>('.blood-moon-settings-controls')!;
  controls.replaceChildren(
    checkbox(text.enabled, settings.weatherEnabled, (value) => void save({ weatherEnabled: value })),
    selectField(text.activation, settings.weatherActivation, [['NIGHT_ONLY', text.night], ['ALWAYS', text.always]], (value) => void save({ weatherActivation: value as WeatherActivation })),
    selectField(text.intensity, settings.weatherIntensity, [['SUBTLE', text.subtle], ['NORMAL', text.normal], ['CINEMATIC', text.cinematic]], (value) => void save({ weatherIntensity: value as WeatherIntensity })),
    checkbox(text.lightning, settings.weatherLightning, (value) => void save({ weatherLightning: value })),
    checkbox(text.reactive, settings.weatherReactiveKills, (value) => void save({ weatherReactiveKills: value }))
  );
}

function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
function particleCount(): number {
  if (settings.weatherIntensity === 'CINEMATIC') return 108;
  if (settings.weatherIntensity === 'NORMAL') return 72;
  return 42;
}
function rebuildAsh(): void {
  if (!ashLayer) return;
  const count = particleCount();
  const signature = `${settings.weatherIntensity}:${count}`;
  if (ashLayer.dataset.signature === signature) return;
  ashLayer.dataset.signature = signature;
  const particles: HTMLElement[] = [];
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('i');
    particle.className = 'blood-moon-ash';
    particle.style.setProperty('--x', `${Math.round(seeded(index, 1) * 100)}vw`);
    particle.style.setProperty('--size', `${1.5 + seeded(index, 2) * 5}px`);
    particle.style.setProperty('--delay', `${-seeded(index, 3) * 16}s`);
    particle.style.setProperty('--duration', `${8 + seeded(index, 4) * 13}s`);
    particle.style.setProperty('--drift', `${Math.round((seeded(index, 5) - .5) * 30)}vw`);
    particle.style.setProperty('--opacity', `${.18 + seeded(index, 6) * .52}`);
    particle.style.setProperty('--blur', `${seeded(index, 7) * 2.4}px`);
    particles.push(particle);
  }
  ashLayer.replaceChildren(...particles);
}

function ensureWeatherRoot(): HTMLElement | null {
  if (location.pathname !== WEATHER_ROUTE) return null;
  document.body.classList.add('blood-moon-weather-page');
  if (weatherRoot?.isConnected) return weatherRoot;
  weatherRoot = document.createElement('div');
  weatherRoot.id = 'blood-moon-root';
  weatherRoot.setAttribute('aria-hidden', 'true');
  weatherRoot.innerHTML = '<div class="blood-moon-scene"><div class="blood-moon-grade"></div><div class="blood-moon-haze blood-moon-haze-a"></div><div class="blood-moon-haze blood-moon-haze-b"></div><div class="blood-moon-moon"><i></i></div><div class="blood-moon-stars"></div><div class="blood-moon-ash-layer"></div><div class="blood-moon-lightning"></div><div class="blood-moon-vignette"></div></div>';
  document.body.append(weatherRoot);
  ashLayer = weatherRoot.querySelector<HTMLElement>('.blood-moon-ash-layer');
  rebuildAsh();
  return weatherRoot;
}

function telemetryFresh(weather: WeatherTelemetry | undefined): boolean {
  const observedAt = Number(weather?.observedAt);
  return weather?.source === 'OVERWOLF_GEP' && Number.isFinite(observedAt) && Date.now() - observedAt <= 3_500;
}
function effectActive(): boolean {
  if (!settings.weatherEnabled || String(latest?.state?.phase ?? '').toLowerCase() !== 'playing') return false;
  if (settings.weatherActivation === 'ALWAYS') return true;
  const weather = latest?.weather;
  if (!telemetryFresh(weather)) return false;
  return weather?.nightstalkerNight === true || weather?.daytime === false;
}
function triggerLightning(strength = 1): void {
  if (!settings.weatherLightning || !effectActive()) return;
  const root = ensureWeatherRoot(); if (!root) return;
  root.style.setProperty('--lightning-strength', String(Math.max(.5, Math.min(1.6, strength))));
  root.classList.remove('blood-moon-strike');
  void root.offsetWidth;
  root.classList.add('blood-moon-strike');
  if (lightningTimer !== null) window.clearTimeout(lightningTimer);
  lightningTimer = window.setTimeout(() => root.classList.remove('blood-moon-strike'), 420);
}

function renderWeather(): void {
  if (location.pathname !== WEATHER_ROUTE) return;
  const root = ensureWeatherRoot(); if (!root) return;
  rebuildAsh();
  root.classList.toggle('blood-moon-active', effectActive());
  root.classList.toggle('blood-moon-eclipse', latest?.weather?.nightstalkerNight === true);
  root.dataset.intensity = settings.weatherIntensity.toLowerCase();
}

function renderAll(): void {
  renderQueued = false;
  renderSettings();
  renderWeather();
}
function scheduleRender(): void {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderAll);
}

window.addEventListener(SNAPSHOT_EVENT, (event) => {
  const next = (event as CustomEvent<WeatherSnapshot>).detail;
  const kills = Number(next.state?.kills);
  if (Number.isFinite(kills) && lastKills !== null && kills > lastKills && settings.weatherReactiveKills) {
    latest = next;
    triggerLightning(Math.min(1.6, 1 + (kills - lastKills) * .15));
  } else {
    latest = next;
  }
  if (Number.isFinite(kills)) lastKills = kills;
  scheduleRender();
});

const bridge = api();
const offSettings = bridge?.onOverlaySettings?.((value) => {
  settings = safeSettings({ ...settings, ...objectOf(value) });
  persist(); scheduleRender();
});
window.addEventListener('beforeunload', () => offSettings?.(), { once: true });
window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) { settings = loadLocal(); scheduleRender(); } });
new MutationObserver(scheduleRender).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'], childList: true, subtree: true });

void loadRemote();
ensureWeatherRoot();
scheduleRender();
