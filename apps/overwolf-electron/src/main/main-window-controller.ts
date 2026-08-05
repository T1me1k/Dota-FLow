import { app, BrowserWindow, screen, systemPreferences, type Rectangle } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type MainWindowState = { compact: boolean; alwaysOnTop: boolean };
type PersistedWindowState = MainWindowState & { expandedBounds?: Rectangle };
const DEFAULT_STATE: MainWindowState = { compact: true, alwaysOnTop: false };
const FULL_MIN_WIDTH = 900;
const FULL_MIN_HEIGHT = 600;
const DEFAULT_FULL_WIDTH = 1180;
const DEFAULT_FULL_HEIGHT = 760;
const COMPACT_WIDTH = 420;
const COMPACT_HEIGHT = 150;
const ANIMATION_DURATION_MS = 220;

function settingsPath(): string { return join(app.getPath('userData'), 'window-settings.json'); }
function isRectangle(value: unknown): value is Rectangle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(candidate[key]));
}
async function loadPersistedState(): Promise<PersistedWindowState> {
  try {
    const parsed = JSON.parse(await readFile(settingsPath(), 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_STATE };
    const candidate = parsed as Record<string, unknown>;
    return {
      compact: true,
      alwaysOnTop: candidate.alwaysOnTop === true,
      ...(isRectangle(candidate.expandedBounds) ? { expandedBounds: candidate.expandedBounds } : {})
    };
  } catch { return { ...DEFAULT_STATE }; }
}
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(Math.max(value, minimum), Math.max(minimum, maximum)); }
function fitBounds(bounds: Rectangle, workArea: Rectangle): Rectangle {
  const width = Math.min(Math.max(bounds.width, 1), workArea.width);
  const height = Math.min(Math.max(bounds.height, 1), workArea.height);
  return { width, height, x: clamp(bounds.x, workArea.x, workArea.x + workArea.width - width), y: clamp(bounds.y, workArea.y, workArea.y + workArea.height - height) };
}
export function compactBoundsFor(expandedBounds: Rectangle, workArea: Rectangle): Rectangle {
  return fitBounds({ x: expandedBounds.x + expandedBounds.width - COMPACT_WIDTH, y: expandedBounds.y, width: COMPACT_WIDTH, height: COMPACT_HEIGHT }, workArea);
}
export function shouldAnimateWindowBounds(): boolean {
  try {
    const settings = systemPreferences.getAnimationSettings();
    return settings.shouldRenderRichAnimation && !settings.prefersReducedMotion;
  } catch {
    return true;
  }
}

export class MainWindowController {
  readonly #window: BrowserWindow;
  #state: MainWindowState;
  #expandedBounds?: Rectangle;
  #animationId = 0;
  private constructor(window: BrowserWindow, persisted: PersistedWindowState) {
    this.#window = window;
    this.#state = { compact: persisted.compact, alwaysOnTop: persisted.alwaysOnTop };
    this.#expandedBounds = persisted.expandedBounds;
  }
  static async create(window: BrowserWindow): Promise<MainWindowController> {
    const controller = new MainWindowController(window, await loadPersistedState());
    await controller.#applyInitialState();
    return controller;
  }
  getState(): MainWindowState { return { ...this.#state }; }
  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<MainWindowState> {
    this.#state.alwaysOnTop = alwaysOnTop;
    this.#applyAlwaysOnTop();
    await this.#persist();
    return this.getState();
  }
  async setCompact(compact: boolean): Promise<MainWindowState> {
    if (this.#window.isDestroyed() || this.#state.compact === compact) return this.getState();
    this.#window.setMenuBarVisibility(false);
    if (compact) {
      this.#expandedBounds = this.#window.isMaximized() ? this.#window.getNormalBounds() : this.#window.getBounds();
      if (this.#window.isMaximized()) this.#window.unmaximize();
      this.#state.compact = true;
      this.#window.setMinimumSize(COMPACT_WIDTH, COMPACT_HEIGHT);
      this.#window.setResizable(false);
      const workArea = screen.getDisplayMatching(this.#expandedBounds).workArea;
      const completed = await this.#animateTo(compactBoundsFor(this.#expandedBounds, workArea));
      if (!completed) return this.getState();
    } else {
      this.#state.compact = false;
      this.#window.setResizable(true);
      this.#window.setMinimumSize(COMPACT_WIDTH, COMPACT_HEIGHT);
      const completed = await this.#animateTo(this.#expandedTarget());
      if (!completed) return this.getState();
      this.#window.setMinimumSize(FULL_MIN_WIDTH, FULL_MIN_HEIGHT);
    }
    await this.#persist();
    return this.getState();
  }
  async #applyInitialState(): Promise<void> {
    this.#applyAlwaysOnTop();
    this.#window.setMenuBarVisibility(false);
    if (!this.#expandedBounds) this.#expandedBounds = this.#window.getBounds();
    this.#window.setMinimumSize(COMPACT_WIDTH, COMPACT_HEIGHT);
    this.#window.setResizable(false);
    const workArea = screen.getDisplayMatching(this.#expandedBounds).workArea;
    this.#window.setBounds(compactBoundsFor(this.#expandedBounds, workArea));
    this.#state.compact = true;
  }
  #expandedTarget(): Rectangle {
    const currentDisplay = screen.getDisplayMatching(this.#expandedBounds ?? this.#window.getBounds());
    const fallback: Rectangle = {
      width: Math.min(DEFAULT_FULL_WIDTH, currentDisplay.workArea.width),
      height: Math.min(DEFAULT_FULL_HEIGHT, currentDisplay.workArea.height),
      x: currentDisplay.workArea.x + Math.max(0, Math.round((currentDisplay.workArea.width - DEFAULT_FULL_WIDTH) / 2)),
      y: currentDisplay.workArea.y + Math.max(0, Math.round((currentDisplay.workArea.height - DEFAULT_FULL_HEIGHT) / 2))
    };
    return fitBounds(this.#expandedBounds ?? fallback, currentDisplay.workArea);
  }
  #applyAlwaysOnTop(): void {
    if (this.#window.isDestroyed()) return;
    if (this.#state.alwaysOnTop) {
      this.#window.setAlwaysOnTop(true, 'screen-saver');
      this.#window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } else {
      this.#window.setAlwaysOnTop(false);
      this.#window.setVisibleOnAllWorkspaces(false);
    }
  }
  async #animateTo(target: Rectangle): Promise<boolean> {
    const animationId = ++this.#animationId;
    if (this.#window.isDestroyed()) return false;
    if (!shouldAnimateWindowBounds()) {
      this.#window.setBounds(target);
      return true;
    }
    const start = this.#window.getBounds();
    const startedAt = Date.now();
    return await new Promise<boolean>((resolve) => {
      const timer = setInterval(() => {
        if (animationId !== this.#animationId || this.#window.isDestroyed()) { clearInterval(timer); resolve(false); return; }
        const progress = Math.min(1, (Date.now() - startedAt) / ANIMATION_DURATION_MS);
        const eased = 1 - Math.pow(1 - progress, 3);
        const interpolate = (from: number, to: number) => Math.round(from + (to - from) * eased);
        this.#window.setBounds({ x: interpolate(start.x, target.x), y: interpolate(start.y, target.y), width: interpolate(start.width, target.width), height: interpolate(start.height, target.height) });
        if (progress >= 1) { clearInterval(timer); this.#window.setBounds(target); resolve(true); }
      }, 16);
    });
  }
  async #persist(): Promise<void> {
    await mkdir(app.getPath('userData'), { recursive: true });
    await writeFile(settingsPath(), `${JSON.stringify({ ...this.#state, expandedBounds: this.#expandedBounds }, null, 2)}\n`, 'utf8');
  }
}
