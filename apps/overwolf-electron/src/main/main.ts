import { app, BrowserWindow, globalShortcut, ipcMain, screen, shell } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LiveGepBridge, type LiveBridgeSnapshot } from '../../../../packages/core/src/live-gep-bridge.mjs';
import {
  DEFAULT_DOTA_GAME_ID,
  OverwolfGepAdapter,
  type GepEnvelope
} from './overwolf-gep-adapter.js';
import { DotaGsiAdapter } from './dota-gsi-adapter.js';
import { RealMatchCaptureRecorder } from './real-match-capture-recorder.js';
import { createManualContextEnvelope, type ManualContextEnvelope } from '../../../../packages/core/src/manual-context.mjs';
import { createCoachEventEnvelope, type CoachEventEnvelope } from '../../../../packages/core/src/coach-events.mjs';

type OverlaySettings = Record<string, unknown>;

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let captureRecorder: RealMatchCaptureRecorder | null = null;
let dotaGsiAdapter: DotaGsiAdapter | null = null;
let gracefulQuitStarted = false;
let manualContextSequence = 0;
let coachEventSequence = 0;
let lastNativeGepDataAt = 0;
let lastGsiDataAt = 0;
const DATA_SOURCE_FRESH_MS = 5_000;
let overlaySettings: OverlaySettings = {
  enabled: true,
  mode: 'COMPACT',
  reasonLimit: 2,
  minConfidence: 0.42,
  hideLowConfidence: false,
  showStaleDecision: false
};

const liveBridge = new LiveGepBridge({
  initialState: { source: 'overwolf' },
  connectionStaleAfterMs: 15_000,
  dedupeWindowMs: 30_000,
  maxArchives: 10
});

const MANUAL_CONTEXT_SHORTCUTS: Record<string, string> = {
  'CommandOrControl+Shift+1': 'LANE_PUSHED',
  'CommandOrControl+Shift+2': 'LANE_NOT_PUSHED',
  'CommandOrControl+Shift+3': 'ROUTE_SAFE',
  'CommandOrControl+Shift+4': 'ROUTE_UNSAFE',
  'CommandOrControl+Shift+D': 'BOTTLE_DOUBLE_DAMAGE',
  'CommandOrControl+Shift+W': 'WISDOM_FIGHT_EXPECTED',
  'CommandOrControl+Shift+0': 'CLEAR'
};

function overlaySettingsPath(): string {
  return join(app.getPath('userData'), 'overlay-settings.json');
}

function recordingsPath(): string {
  return join(app.getPath('userData'), 'recordings');
}

async function loadOverlaySettings(): Promise<void> {
  try {
    const value = JSON.parse(await readFile(overlaySettingsPath(), 'utf8')) as unknown;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      overlaySettings = { ...overlaySettings, ...(value as OverlaySettings) };
    }
  } catch {
    // First start or a malformed optional settings file: use safe defaults.
  }
}

async function persistOverlaySettings(): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true });
  await writeFile(overlaySettingsPath(), `${JSON.stringify(overlaySettings, null, 2)}\n`, 'utf8');
}

async function createWindows(): Promise<void> {
  const preload = join(import.meta.dirname, '../preload/preload.js');
  const mainUrl = process.env.DOTA_FLOW_RENDERER_URL ?? 'http://127.0.0.1:4173/live';
  const overlayUrl = process.env.DOTA_FLOW_OVERLAY_URL ?? 'http://127.0.0.1:4173/overlay';

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false }
  });

  const overlayWidth = 460;
  const overlayHeight = 184;
  const workArea = screen.getPrimaryDisplay().workArea;
  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    x: Math.round(workArea.x + (workArea.width - overlayWidth) / 2),
    y: workArea.y + 24,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: false,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false }
  });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  await Promise.all([
    mainWindow.loadURL(mainUrl),
    overlayWindow.loadURL(overlayUrl)
  ]);
}

function publishLiveSnapshot(snapshot: LiveBridgeSnapshot): void {
  mainWindow?.webContents.send('dota-flow:live-snapshot', snapshot);
  overlayWindow?.webContents.send('dota-flow:live-snapshot', snapshot);
  mainWindow?.webContents.send('runtime:snapshot', { ...snapshot, runtimeMode: 'LIVE_GEP' });
  overlayWindow?.webContents.send('runtime:snapshot', { ...snapshot, runtimeMode: 'LIVE_GEP' });
}

function requireObject(payload: unknown): Record<string, unknown> { if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw Object.assign(new Error('Payload must be an object'), { code: 'INVALID_IPC_PAYLOAD' }); return payload as Record<string, unknown>; }

function publishOverlaySettings(): void {
  mainWindow?.webContents.send('dota-flow:overlay-settings', overlaySettings);
  overlayWindow?.webContents.send('dota-flow:overlay-settings', overlaySettings);
}

function publishCaptureStatus(): void {
  mainWindow?.webContents.send('dota-flow:capture-status', captureRecorder?.status() ?? null);
}

function logRuntimeStatus(envelope: GepEnvelope): void {
  if (envelope.type !== 'status' || !envelope.payload || typeof envelope.payload !== 'object') return;
  const payload = envelope.payload as Record<string, unknown>;
  const mode = String(payload.mode ?? 'runtime').toUpperCase();
  const connection = String(payload.connection ?? 'unknown');
  const code = payload.code ? ` ${String(payload.code)}` : '';
  const message = payload.message ?? payload.warning ?? payload.error;
  console.log(`[Dota Flow ${mode}] ${connection}${code}${message ? `: ${String(message)}` : ''}`);
}

function broadcast(envelope: GepEnvelope): void {
  logRuntimeStatus(envelope);
  mainWindow?.webContents.send('dota-flow:gep', envelope);
  const snapshot = liveBridge.ingestEnvelope(envelope);
  captureRecorder?.record(envelope, snapshot);
  publishLiveSnapshot(snapshot);
  publishCaptureStatus();
}

function fresh(timestamp: number): boolean {
  return timestamp > 0 && Date.now() - timestamp <= DATA_SOURCE_FRESH_MS;
}

function broadcastNativeGep(envelope: GepEnvelope): void {
  if (envelope.type !== 'status') {
    lastNativeGepDataAt = Date.now();
    broadcast(envelope);
    return;
  }
  if (fresh(lastNativeGepDataAt) || !fresh(lastGsiDataAt)) broadcast(envelope);
}

function broadcastGsi(envelope: GepEnvelope): void {
  if (envelope.type !== 'status') {
    lastGsiDataAt = Date.now();
    if (!fresh(lastNativeGepDataAt)) broadcast(envelope);
    return;
  }
  if (!fresh(lastNativeGepDataAt)) broadcast(envelope);
}

function applyManualContext(command: string): LiveBridgeSnapshot {
  manualContextSequence += 1;
  const current = liveBridge.snapshot();
  const pipeline = (current as { diagnostics?: { pipeline?: { state?: { gameTimeSec?: number } } } }).diagnostics?.pipeline;
  const envelope: ManualContextEnvelope = createManualContextEnvelope(command, {
    receivedAt: Date.now(),
    gameTimeSec: pipeline?.state?.gameTimeSec,
    sourceSequence: `electron-manual:${manualContextSequence}`
  });
  const snapshot = liveBridge.ingestEnvelope(envelope);
  captureRecorder?.record(envelope, snapshot);
  publishLiveSnapshot(snapshot);
  publishCaptureStatus();
  return snapshot;
}

function applyCoachEvent(eventType: string, payload: Record<string, unknown> = {}): LiveBridgeSnapshot {
  coachEventSequence += 1;
  const current = liveBridge.snapshot();
  const pipeline = (current as { diagnostics?: { pipeline?: { state?: { gameTimeSec?: number } } } }).diagnostics?.pipeline;
  const envelope: CoachEventEnvelope = createCoachEventEnvelope(eventType, payload, {
    receivedAt: Date.now(),
    gameTimeSec: pipeline?.state?.gameTimeSec,
    sourceSequence: `electron-coach:${coachEventSequence}`
  });
  const snapshot = liveBridge.ingestEnvelope(envelope);
  captureRecorder?.record(envelope, snapshot);
  publishLiveSnapshot(snapshot);
  publishCaptureStatus();
  return snapshot;
}

function registerManualContextShortcuts(): void {
  for (const [accelerator, command] of Object.entries(MANUAL_CONTEXT_SHORTCUTS)) {
    const registered = globalShortcut.register(accelerator, () => {
      try {
        applyManualContext(command);
      } catch (error) {
        console.error(`Failed to apply manual context shortcut ${accelerator}`, error);
      }
    });
    if (!registered) console.warn(`Manual context shortcut unavailable: ${accelerator}`);
  }
}

app.whenReady().then(async () => {
  await loadOverlaySettings();
  captureRecorder = new RealMatchCaptureRecorder(recordingsPath(), { appVersion: app.getVersion() });
  await captureRecorder.start({
    runtime: 'overwolf-electron',
    gameId: DEFAULT_DOTA_GAME_ID,
    autoStarted: true
  });

  dotaGsiAdapter = new DotaGsiAdapter(broadcastGsi);
  try {
    await dotaGsiAdapter.start();
  } catch (error) {
    console.error('[Dota Flow GSI] Failed to start direct fallback', error);
    broadcastGsi({
      type: 'status',
      gameId: DEFAULT_DOTA_GAME_ID,
      receivedAt: Date.now(),
      sourceSequence: 'gsi:start-failed',
      payload: {
        mode: 'gsi',
        available: false,
        connection: 'disconnected',
        code: 'GSI_SERVER_START_FAILED',
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }

  await createWindows();
  registerManualContextShortcuts();

  const adapter = new OverwolfGepAdapter(broadcastNativeGep);
  await adapter.start();

  ipcMain.handle('dota-flow:get-live-snapshot', () => liveBridge.snapshot());
  ipcMain.handle('dota-flow:reset-live-session', () => liveBridge.reset({ reason: 'RENDERER_REQUEST' }));
  ipcMain.handle('dota-flow:get-overlay-settings', () => ({ ...overlaySettings }));
  ipcMain.handle('dota-flow:set-overlay-settings', async (_event: unknown, patch: unknown) => {
    if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
      overlaySettings = { ...overlaySettings, ...(patch as OverlaySettings) };
      await persistOverlaySettings();
      publishOverlaySettings();
    }
    return { ...overlaySettings };
  });
  ipcMain.handle('dota-flow:show-overlay', () => overlayWindow?.showInactive());
  ipcMain.handle('dota-flow:hide-overlay', () => overlayWindow?.hide());
  ipcMain.handle('dota-flow:get-capture-status', () => captureRecorder?.status() ?? null);
  ipcMain.handle('dota-flow:start-capture', async () => {
    const status = await captureRecorder?.start({
      runtime: 'overwolf-electron',
      gameId: DEFAULT_DOTA_GAME_ID,
      requestedBy: 'renderer'
    });
    publishCaptureStatus();
    return status ?? null;
  });
  ipcMain.handle('dota-flow:stop-capture', async () => {
    const status = await captureRecorder?.stop('RENDERER_REQUEST');
    publishCaptureStatus();
    return status ?? null;
  });
  ipcMain.handle('dota-flow:open-recordings-folder', async () => {
    await mkdir(recordingsPath(), { recursive: true });
    return shell.openPath(recordingsPath());
  });
  ipcMain.handle('dota-flow:apply-manual-context', (_event: unknown, command: unknown) => {
    return applyManualContext(String(command ?? ''));
  });
  ipcMain.handle('dota-flow:get-manual-context-shortcuts', () => ({ ...MANUAL_CONTEXT_SHORTCUTS }));
  ipcMain.handle('dota-flow:apply-coach-event', (_event: unknown, eventType: unknown, payload: unknown) => {
    const safePayload = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
    return applyCoachEvent(String(eventType ?? ''), safePayload);
  });

  ipcMain.handle('runtime:get-status', () => ({ runtimeMode: 'LIVE_GEP', status: liveBridge.snapshot().status }));
  ipcMain.handle('runtime:get-snapshot', () => ({ ...liveBridge.snapshot(), runtimeMode: 'LIVE_GEP' }));
  ipcMain.handle('runtime:start', () => ({ status: 'GEP_INITIALIZING' }));
  ipcMain.handle('runtime:stop', () => liveBridge.stop('RENDERER_REQUEST'));
  ipcMain.handle('capture:get-status', () => captureRecorder?.status() ?? null);
  ipcMain.handle('capture:start', async (_event, payload) => captureRecorder?.start({ runtime:'overwolf-electron',gameId:DEFAULT_DOTA_GAME_ID,requestedBy:'renderer',...requireObject(payload ?? {}) }));
  ipcMain.handle('capture:stop', () => captureRecorder?.stop('RENDERER_REQUEST'));
  ipcMain.handle('capture:open-folder', async () => { await mkdir(recordingsPath(),{recursive:true}); return { opened: (await shell.openPath(recordingsPath())) === '' }; });
  ipcMain.handle('manual-context:send', (_event,payload) => { const x=requireObject(payload);return applyManualContext(String(x.type??'')); });
  ipcMain.handle('coach-timer:start', (_event,payload) => { const x=requireObject(payload);if(!Number.isFinite(x.durationSec))throw Object.assign(new Error('durationSec must be finite'),{code:'INVALID_IPC_PAYLOAD'});return applyCoachEvent('COACH_TIMER_STARTED',x); });
  ipcMain.handle('diagnostics:get', () => ({ runtimeMode:'LIVE_GEP', bridge:liveBridge.snapshot().diagnostics }));
  ipcMain.handle('diagnostics:export', () => ({ code:'EXPORT_REQUIRES_CAPTURE_REDACTION', message:'Use capture export; private paths are not returned to renderer.' }));

  publishOverlaySettings();
  publishLiveSnapshot(liveBridge.snapshot());
  publishCaptureStatus();
});

app.on('before-quit', (event) => {
  if (gracefulQuitStarted) return;
  gracefulQuitStarted = true;
  event.preventDefault();
  globalShortcut.unregisterAll();
  liveBridge.stop('APP_QUIT');
  void Promise.allSettled([
    Promise.resolve(captureRecorder?.stop('APP_QUIT')),
    Promise.resolve(dotaGsiAdapter?.stop())
  ])
    .then((results) => {
      for (const result of results) {
        if (result.status === 'rejected') console.error('Failed to finalize Dota Flow runtime', result.reason);
      }
    })
    .finally(() => app.quit());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
