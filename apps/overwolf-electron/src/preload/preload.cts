import { contextBridge, ipcRenderer } from 'electron';

const BRIDGE_VERSION = 1;
const IPC_RETRY_ATTEMPTS = 30;
const IPC_RETRY_DELAY_MS = 100;
const INVOKE_CHANNELS = new Set([
  'runtime:get-status',
  'runtime:get-snapshot',
  'runtime:start',
  'runtime:stop',
  'capture:start',
  'capture:stop',
  'capture:get-status',
  'capture:open-folder',
  'manual-context:send',
  'coach-timer:start',
  'diagnostics:get',
  'diagnostics:export'
]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHandlerRegistrationRace(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /no handler registered|handler.*not registered|channel.*not found/i.test(message);
}

async function invokeWithStartupRetry(channel: string, ...args: unknown[]): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= IPC_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await ipcRenderer.invoke(channel, ...args);
    } catch (error) {
      lastError = error;
      if (!isHandlerRegistrationRace(error) || attempt === IPC_RETRY_ATTEMPTS) throw error;
      await delay(IPC_RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

function subscribe(channel: string, listener: (payload: unknown) => void): () => void {
  const wrapped = (_event: unknown, payload: unknown) => listener(payload);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
}

const invokeAllowlisted = (channel: string, payload?: unknown): Promise<unknown> => {
  if (!INVOKE_CHANNELS.has(channel)) {
    return Promise.reject({ code: 'IPC_CHANNEL_DENIED', message: 'IPC channel is not allowlisted' });
  }
  return invokeWithStartupRetry(channel, payload);
};

contextBridge.exposeInMainWorld('dotaFlow', {
  bridgeVersion: BRIDGE_VERSION,
  onGepEnvelope: (listener: (envelope: unknown) => void) => subscribe('dota-flow:gep', listener),
  onLiveSnapshot: (listener: (snapshot: unknown) => void) => subscribe('dota-flow:live-snapshot', listener),
  onOverlaySettings: (listener: (settings: unknown) => void) => subscribe('dota-flow:overlay-settings', listener),
  onCaptureStatus: (listener: (status: unknown) => void) => subscribe('dota-flow:capture-status', listener),
  getLiveSnapshot: () => invokeWithStartupRetry('dota-flow:get-live-snapshot'),
  resetLiveSession: () => invokeWithStartupRetry('dota-flow:reset-live-session'),
  getOverlaySettings: () => invokeWithStartupRetry('dota-flow:get-overlay-settings'),
  setOverlaySettings: (settings: unknown) => invokeWithStartupRetry('dota-flow:set-overlay-settings', settings),
  showOverlay: () => invokeWithStartupRetry('dota-flow:show-overlay'),
  hideOverlay: () => invokeWithStartupRetry('dota-flow:hide-overlay'),
  getCaptureStatus: () => invokeWithStartupRetry('dota-flow:get-capture-status'),
  startCapture: () => invokeWithStartupRetry('dota-flow:start-capture'),
  stopCapture: () => invokeWithStartupRetry('dota-flow:stop-capture'),
  openRecordingsFolder: () => invokeWithStartupRetry('dota-flow:open-recordings-folder'),
  applyManualContext: (command: string) => invokeWithStartupRetry('dota-flow:apply-manual-context', command),
  getManualContextShortcuts: () => invokeWithStartupRetry('dota-flow:get-manual-context-shortcuts'),
  applyCoachEvent: (eventType: string, payload: unknown) => invokeWithStartupRetry('dota-flow:apply-coach-event', eventType, payload)
});

contextBridge.exposeInMainWorld('dotaFlowRuntime', {
  bridgeVersion: BRIDGE_VERSION,
  invoke: invokeAllowlisted,
  subscribe: (listener: (snapshot: unknown) => void) => subscribe('runtime:snapshot', listener)
});

ipcRenderer.send('dota-flow:preload-ready', { bridgeVersion: BRIDGE_VERSION });
