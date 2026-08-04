const diagnostic = document.getElementById('boot-diagnostic');
const root = document.getElementById('root');
let bootCompleted = false;

function showDiagnostic(title: string, detail: string): void {
  if (!diagnostic) return;
  diagnostic.hidden = false;
  const titleNode = diagnostic.querySelector('[data-boot-title]');
  const detailNode = diagnostic.querySelector('[data-boot-detail]');
  if (titleNode) titleNode.textContent = title;
  if (detailNode) detailNode.textContent = detail;
}

function markBootCompleted(): void {
  if (bootCompleted) return;
  bootCompleted = true;
  if (diagnostic) diagnostic.hidden = true;
}

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
