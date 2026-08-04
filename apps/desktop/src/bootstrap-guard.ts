type BootstrapRuntimeApi = {
  invoke: (channel: string, payload?: unknown) => Promise<unknown>;
  subscribe: (listener: (snapshot: unknown) => void) => () => void;
};

type BootstrapWindow = Window & { dotaFlowRuntime?: BootstrapRuntimeApi };

const diagnostic = document.getElementById('boot-diagnostic');
const root = document.getElementById('root');
let bootCompleted = false;

const preloadUnavailableSnapshot = {
  loading: false,
  runtimeMode: 'LIVE_GEP',
  status: 'UNAVAILABLE',
  error: 'OVERWOLF_PRELOAD_UNAVAILABLE: The secure Electron bridge did not load. Rebuild the Overwolf adapter and inspect the PowerShell startup log.',
  dataQuality: {
    overall: 'UNAVAILABLE',
    macro: 'UNAVAILABLE',
    role: 'UNAVAILABLE'
  },
  runtimeMetadata: {
    source: 'renderer-bootstrap-fallback',
    preloadAvailable: false
  }
};

function installFailClosedRuntimeFallback(): void {
  const target = window as BootstrapWindow;
  if (target.dotaFlowRuntime) return;

  console.error('[TRUST] Electron preload bridge unavailable; installing fail-closed diagnostic runtime.');
  target.dotaFlowRuntime = {
    invoke: async (channel: string) => {
      if (channel === 'runtime:get-snapshot') return structuredClone(preloadUnavailableSnapshot);
      if (channel === 'runtime:get-status') {
        return { runtimeMode: 'LIVE_GEP', status: 'UNAVAILABLE', error: preloadUnavailableSnapshot.error };
      }
      if (channel === 'diagnostics:get') {
        return { runtimeMode: 'LIVE_GEP', preloadAvailable: false, error: preloadUnavailableSnapshot.error };
      }
      throw Object.assign(new Error(preloadUnavailableSnapshot.error), { code: 'OVERWOLF_PRELOAD_UNAVAILABLE' });
    },
    subscribe: () => () => undefined
  };
}

function showDiagnostic(title: string, detail: string): void {
  if (!diagnostic) return;
  diagnostic.hidden = false;
  diagnostic.style.display = 'grid';
  const titleNode = diagnostic.querySelector('[data-boot-title]');
  const detailNode = diagnostic.querySelector('[data-boot-detail]');
  if (titleNode) titleNode.textContent = title;
  if (detailNode) detailNode.textContent = detail;
}

function markBootCompleted(): void {
  if (bootCompleted) return;
  bootCompleted = true;
  if (diagnostic) {
    diagnostic.hidden = true;
    diagnostic.style.display = 'none';
  }
}

installFailClosedRuntimeFallback();

if (root) {
  const observer = new MutationObserver(() => {
    if (root.childElementCount > 0) {
      markBootCompleted();
      observer.disconnect();
    }
  });
  observer.observe(root, { childList: true });
}

window.addEventListener('error', (event) => {
  const message = event.error instanceof Error ? event.error.message : event.message;
  showDiagnostic('Dota Flow failed to start', message || 'Unknown renderer startup error. Check the PowerShell log.');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'Unknown promise rejection');
  showDiagnostic('Dota Flow failed to start', reason);
});

window.setTimeout(() => {
  if (!bootCompleted) {
    showDiagnostic(
      'Dota Flow is still starting',
      'The renderer did not mount within 10 seconds. Check the PowerShell log for preload, IPC, or GEP errors.'
    );
  }
}, 10_000);
