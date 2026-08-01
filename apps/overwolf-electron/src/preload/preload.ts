import { contextBridge, ipcRenderer } from 'electron';

const INVOKE_CHANNELS = new Set(['runtime:get-status','runtime:get-snapshot','runtime:start','runtime:stop','capture:start','capture:stop','capture:get-status','capture:open-folder','manual-context:send','coach-timer:start','diagnostics:get','diagnostics:export']);

function subscribe(channel: string, listener: (payload: unknown) => void): () => void {
  const wrapped = (_event: unknown, payload: unknown) => listener(payload);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
}

contextBridge.exposeInMainWorld('dotaFlow', {
  onGepEnvelope: (listener: (envelope: unknown) => void) => subscribe('dota-flow:gep', listener),
  onLiveSnapshot: (listener: (snapshot: unknown) => void) => subscribe('dota-flow:live-snapshot', listener),
  onOverlaySettings: (listener: (settings: unknown) => void) => subscribe('dota-flow:overlay-settings', listener),
  onCaptureStatus: (listener: (status: unknown) => void) => subscribe('dota-flow:capture-status', listener),
  getLiveSnapshot: () => ipcRenderer.invoke('dota-flow:get-live-snapshot'),
  resetLiveSession: () => ipcRenderer.invoke('dota-flow:reset-live-session'),
  getOverlaySettings: () => ipcRenderer.invoke('dota-flow:get-overlay-settings'),
  setOverlaySettings: (settings: unknown) => ipcRenderer.invoke('dota-flow:set-overlay-settings', settings),
  showOverlay: () => ipcRenderer.invoke('dota-flow:show-overlay'),
  hideOverlay: () => ipcRenderer.invoke('dota-flow:hide-overlay'),
  getCaptureStatus: () => ipcRenderer.invoke('dota-flow:get-capture-status'),
  startCapture: () => ipcRenderer.invoke('dota-flow:start-capture'),
  stopCapture: () => ipcRenderer.invoke('dota-flow:stop-capture'),
  openRecordingsFolder: () => ipcRenderer.invoke('dota-flow:open-recordings-folder'),
  applyManualContext: (command: string) => ipcRenderer.invoke('dota-flow:apply-manual-context', command),
  getManualContextShortcuts: () => ipcRenderer.invoke('dota-flow:get-manual-context-shortcuts'),
  applyCoachEvent: (eventType: string, payload: unknown) => ipcRenderer.invoke('dota-flow:apply-coach-event', eventType, payload)
});

contextBridge.exposeInMainWorld('dotaFlowRuntime', {
  invoke: (channel: string, payload?: unknown) => {
    if (!INVOKE_CHANNELS.has(channel)) return Promise.reject({ code: 'IPC_CHANNEL_DENIED', message: 'IPC channel is not allowlisted' });
    return ipcRenderer.invoke(channel, payload);
  },
  subscribe: (listener: (snapshot: unknown) => void) => subscribe('runtime:snapshot', listener)
});
