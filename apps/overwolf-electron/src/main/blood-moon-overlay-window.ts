import { app, BrowserWindow, screen } from 'electron';

export type BloodMoonOverlayHandle = {
  window: BrowserWindow;
  mode: 'OVERWOLF_OVERLAY' | 'ELECTRON_DEV_FALLBACK';
};

type OverlayBrowserWindowLike = {
  window: BrowserWindow;
};

type GameLaunchEventLike = {
  inject?: () => unknown;
  dismiss?: () => unknown;
};

type GameInfoLike = {
  classId?: number;
  gameId?: number;
  id?: number;
  supported?: boolean;
  isSupported?: boolean;
};

type OverlayApiLike = {
  createWindow(options: Record<string, unknown>): Promise<OverlayBrowserWindowLike>;
  registerGames?(filter: { gameIds: number[] }): unknown;
  requestGameInjection?(classId: number): Promise<void>;
  on?(eventName: string, listener: (...args: unknown[]) => void): unknown;
};

function overlayApi(): OverlayApiLike | null {
  return ((app as unknown as {
    overwolf?: { packages?: { overlay?: OverlayApiLike } };
  }).overwolf?.packages?.overlay) ?? null;
}

function gameIdOf(info: GameInfoLike): number | null {
  const value = Number(info.classId ?? info.gameId ?? info.id);
  return Number.isFinite(value) ? value : null;
}

function browserWindowOptions(preload: string) {
  const bounds = screen.getPrimaryDisplay().bounds;
  return {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    focusable: false,
    hasShadow: false,
    show: false,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false
    }
  };
}

function prepareOverlayInjection(overlay: OverlayApiLike, gameId: number): void {
  try {
    overlay.registerGames?.({ gameIds: [gameId] });
  } catch (error) {
    console.warn('[Blood Moon] Failed to register Dota overlay tracking', error);
  }

  overlay.on?.('game-launched', (...args: unknown[]) => {
    const event = args[0] as GameLaunchEventLike | undefined;
    const info = (args.find((value) => value && typeof value === 'object' && value !== event) ?? {}) as GameInfoLike;
    const detectedId = gameIdOf(info);
    if (detectedId !== null && detectedId !== gameId) return;
    const supported = info.supported ?? info.isSupported;
    if (supported === false) {
      event?.dismiss?.();
      return;
    }
    try {
      event?.inject?.();
    } catch (error) {
      console.warn('[Blood Moon] Dota overlay injection request failed', error);
    }
  });

  if (overlay.requestGameInjection) {
    void overlay.requestGameInjection(gameId).catch((error) => {
      console.info('[Blood Moon] Late overlay injection is not available yet', error instanceof Error ? error.message : String(error));
    });
  }
}

export async function createBloodMoonOverlayWindow(
  preload: string,
  url: string,
  gameId: number
): Promise<BloodMoonOverlayHandle> {
  const overlay = overlayApi();
  if (overlay) {
    prepareOverlayInjection(overlay, gameId);
    const created = await overlay.createWindow({
      ...browserWindowOptions(preload),
      name: 'dota-flow-blood-moon',
      passthrough: 'passThrough',
      ignoreKeyboardInput: true,
      zOrder: 'topMost',
      strictToGameWindow: true,
      dpiAware: true
    });
    const window = created.window;
    await window.loadURL(url);
    return { window, mode: 'OVERWOLF_OVERLAY' };
  }

  // Development-only fallback. Production uses the official Overwolf overlay
  // package; this BrowserWindow keeps the renderer testable outside Overwolf.
  const window = new BrowserWindow({
    ...browserWindowOptions(preload),
    alwaysOnTop: true
  });
  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setIgnoreMouseEvents(true, { forward: true });
  await window.loadURL(url);
  return { window, mode: 'ELECTRON_DEV_FALLBACK' };
}
