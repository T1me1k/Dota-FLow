import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MatchCaptureTracker, type MatchCaptureManifest } from '../../../../packages/core/src/match-capture.mjs';
import { MATCH_VALIDATION_PROFILES, validateJsonlRecording } from '../../../../packages/core/src/match-validation.mjs';
import type { GepEnvelope } from './overwolf-gep-adapter.js';

type CaptureEnvelope = GepEnvelope | {
  type: 'manual-context' | 'coach-event';
  payload: unknown;
  receivedAt: number;
  sourceSequence?: string | number;
};

type LiveSnapshot = Record<string, unknown>;

export class RealMatchCaptureRecorder {
  readonly #rootDir: string;
  readonly #tracker: MatchCaptureTracker;
  #activeDir: string | null = null;
  #writeQueue: Promise<void> = Promise.resolve();

  constructor(rootDir: string, { appVersion = '0.12.0' } = {}) {
    this.#rootDir = rootDir;
    this.#tracker = new MatchCaptureTracker({ appVersion });
  }

  status(): MatchCaptureManifest {
    return this.#tracker.snapshot();
  }

  async start(metadata: Record<string, unknown> = {}): Promise<MatchCaptureManifest> {
    if (this.#tracker.snapshot().state === 'RECORDING') await this.stop('CAPTURE_RESTARTED');
    const manifest = this.#tracker.start(metadata);
    this.#activeDir = join(this.#rootDir, manifest.captureId);
    await mkdir(this.#activeDir, { recursive: true });
    await writeFile(join(this.#activeDir, manifest.files.events), '', 'utf8');
    await this.#writeManifest(manifest);
    return manifest;
  }

  record(envelope: CaptureEnvelope, liveSnapshot: LiveSnapshot): MatchCaptureManifest {
    const manifest = this.#tracker.observe(envelope, liveSnapshot);
    if (manifest.state !== 'RECORDING' || !this.#activeDir) return manifest;
    const eventsPath = join(this.#activeDir, manifest.files.events);
    this.#writeQueue = this.#writeQueue.then(async () => {
      await appendFile(eventsPath, `${JSON.stringify(envelope)}\n`, 'utf8');
      await this.#writeManifest(this.#tracker.snapshot());
    }).catch((error: unknown) => {
      console.error('Failed to persist real-match capture', error);
    });
    return manifest;
  }

  async stop(reason = 'MANUAL_STOP'): Promise<MatchCaptureManifest> {
    const manifest = this.#tracker.stop(reason);
    await this.#writeQueue;
    if (!this.#activeDir || !manifest.captureId) return manifest;
    await this.#writeManifest(manifest);

    try {
      const text = await readFile(join(this.#activeDir, manifest.files.events), 'utf8');
      const report = validateJsonlRecording(text, {
        profile: MATCH_VALIDATION_PROFILES.RELEASE,
        staleAfterMs: 15_000,
        gapThresholdMs: 15_000,
        coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
      });
      await writeFile(
        join(this.#activeDir, manifest.files.validationReport),
        `${JSON.stringify(report, null, 2)}\n`,
        'utf8'
      );
    } catch (error) {
      await writeFile(
        join(this.#activeDir, manifest.files.validationReport),
        `${JSON.stringify({ status: 'CAPTURE_ERROR', message: error instanceof Error ? error.message : String(error) }, null, 2)}\n`,
        'utf8'
      );
    }
    return manifest;
  }

  async #writeManifest(manifest: MatchCaptureManifest): Promise<void> {
    if (!this.#activeDir) return;
    await writeFile(
      join(this.#activeDir, manifest.files.manifest),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8'
    );
  }
}
