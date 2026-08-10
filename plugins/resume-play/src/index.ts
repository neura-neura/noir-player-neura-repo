import { createElement, type ChangeEvent } from 'react';
import {
  definePlugin,
  type NoirPluginContext,
  type PluginEventEnvelope,
  type PluginStorageValue,
  type PluginSlotProps,
  type PlayerSnapshot,
  type UiContribution,
} from '@noir-player/plugin-api';

export interface ResumePlayConfig {
  readonly enabled: boolean;
}

export interface ResumePrompt {
  readonly mediaKey: string;
  readonly displayName: string;
  readonly position: number;
  readonly duration: number | null;
  readonly percentage: number | null;
}

export interface ResumePlayState {
  readonly enabled: boolean;
  readonly currentMediaKey: string | null;
  readonly prompt: ResumePrompt | null;
  readonly promptDurationSeconds: number;
  readonly promptRemainingMs: number;
}

export interface ResumePlayApi {
  readonly getState: () => Readonly<ResumePlayState>;
  readonly resume: () => Promise<boolean>;
  readonly startOver: () => Promise<boolean>;
  readonly setPromptDuration: (input: unknown) => boolean;
}

export const PLUGIN_ID = 'neura-neura.resume-play' as const;
const STORAGE_KEY = 'resumePositions';
const PROMPT_DURATION_STORAGE_KEY = 'promptDurationSeconds';
const MIN_RESUME_SECONDS = 5;
const COMPLETION_EPSILON_SECONDS = 3;
const MAX_STORED_POSITIONS = 500;
const DEFAULT_PROMPT_DURATION_SECONDS = 5;
const PROMPT_DURATION_OPTIONS = [1, 3, 5, 8, 10, 15, 30, 60] as const;
const PROMPT_TICK_MS = 200;

export function normalizePromptDurationSeconds(input: unknown): number | undefined {
  const value =
    typeof input === 'number'
      ? input
      : typeof input === 'string' && input.trim()
        ? Number(input)
        : Number.NaN;

  if (!Number.isInteger(value)) return undefined;
  return PROMPT_DURATION_OPTIONS.some((option) => option === value)
    ? value
    : undefined;
}

const manifest = {
  id: PLUGIN_ID,
  name: 'Resume Play',
  version: '0.1.0',
  apiVersion: '^1.0.0',
  appVersion: '>=0.1.0 <1.0.0',
  description:
    'Resume Play automatically remembers the exact point where you left off in each video. When you play it again, you can choose to resume from where you stopped or start over from the beginning, so you never lose your progress.',
  license: 'MIT',
  authors: ['neura-neura'],
  repository: 'https://github.com/neura-neura/noir-player-neura-repo',
  platforms: ['windows', 'browser-preview'] as const,
  requestedCapabilities: [
    'player.read',
    'player.control',
    'ui.contribute',
    'storage',
  ] as const,
};

type PlayerMedia = Exclude<PlayerSnapshot['media'], null>;
type MediaSourceKind = PlayerMedia['sourceKind'];

interface StoredResumePosition {
  readonly position: number;
  readonly duration: number | null;
  readonly updatedAt: number;
}

type StoredResumePositions = Record<string, StoredResumePosition>;

interface ActiveMedia {
  readonly key: string;
  readonly sourceKind: MediaSourceKind;
  readonly displayName: string;
  readonly sessionId: string | null;
  readonly duration: number | null;
  readonly currentTime: number;
}

interface PendingPlayBypass {
  readonly mediaKey: string;
  readonly sessionId: string | null;
}

type StateListener = () => void;
type UiRefresh = () => void;

function isSourceKind(input: unknown): input is MediaSourceKind {
  return (
    input === 'local-file' || input === 'object-url' || input === 'hls'
  );
}

/**
 * Build a stable key from the public media identity exposed by the SDK.
 * displayName is the only portable, non-native identifier available to a
 * plugin, so native mpv properties are not required for this feature.
 */
export function buildMediaKey(input: unknown): string | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }

  const value = input as Record<string, unknown>;
  const sourceKind = value.sourceKind;
  const displayName =
    typeof value.displayName === 'string' ? value.displayName.trim() : '';

  if (!isSourceKind(sourceKind) || !displayName) return undefined;

  return JSON.stringify({ sourceKind, displayName });
}

export function formatResumeTime(input: number): string {
  if (!Number.isFinite(input) || input < 0) return '0:00';

  const totalSeconds = Math.floor(input);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const paddedSeconds = String(seconds).padStart(2, '0');

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
    : `${minutes}:${paddedSeconds}`;
}

function parseConfig(input: unknown): ResumePlayConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Resume Play config must be an object.');
  }

  const enabled = (input as { enabled?: unknown }).enabled;
  if (typeof enabled !== 'boolean') {
    throw new TypeError('Resume Play config enabled must be a boolean.');
  }

  return Object.freeze({ enabled });
}

function parseStoredPositions(input: unknown): StoredResumePositions {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const parsed: StoredResumePositions = {};
  for (const [mediaKey, candidate] of Object.entries(
    input as Record<string, unknown>,
  )) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      continue;
    }

    const value = candidate as Record<string, unknown>;
    const position = value.position;
    const duration = value.duration;
    const updatedAt = value.updatedAt;
    const validDuration =
      duration === null ||
      (typeof duration === 'number' && Number.isFinite(duration) && duration > 0);

    if (
      typeof position !== 'number' ||
      !Number.isFinite(position) ||
      position < 0 ||
      !validDuration ||
      typeof updatedAt !== 'number' ||
      !Number.isFinite(updatedAt) ||
      updatedAt < 0
    ) {
      continue;
    }

    parsed[mediaKey] = Object.freeze({
      position,
      duration,
      updatedAt,
    });
  }

  return parsed;
}

function createPrompt(
  active: ActiveMedia,
  stored: StoredResumePosition | undefined,
  options: { readonly allowPastPosition?: boolean } = {},
): ResumePrompt | null {
  if (!stored || stored.position < MIN_RESUME_SECONDS) return null;

  const duration = active.duration ?? stored.duration;
  if (
    duration !== null &&
    (!Number.isFinite(duration) ||
      duration <= 0 ||
      stored.position >= duration - COMPLETION_EPSILON_SECONDS)
  ) {
    return null;
  }

  if (
    !options.allowPastPosition &&
    stored.position <= active.currentTime + COMPLETION_EPSILON_SECONDS
  ) {
    return null;
  }

  const percentage =
    duration !== null && duration > 0
      ? Math.min(100, Math.max(0, (stored.position / duration) * 100))
      : null;

  return Object.freeze({
    mediaKey: active.key,
    displayName: active.displayName,
    position: stored.position,
    duration,
    percentage,
  });
}

class ResumePlayController {
  private readonly listeners = new Set<StateListener>();
  private readonly positions: StoredResumePositions;
  private config: ResumePlayConfig;
  private promptDurationSeconds: number;
  private activeMedia: ActiveMedia | null = null;
  private pendingPrompt: ResumePrompt | null = null;
  private resumeCandidate: StoredResumePosition | null = null;
  private bypassPrompt: PendingPlayBypass | null = null;
  private uiAvailable = false;
  private uiRefresh: UiRefresh | null = null;
  private settingsUiRefresh: UiRefresh | null = null;
  private promptTimer: ReturnType<typeof setInterval> | null = null;
  private promptExpiresAt: number | null = null;
  private promptRemainingMs = 0;
  private running = false;
  private disposed = false;
  private _state: ResumePlayState;

  constructor(
    private readonly context: NoirPluginContext,
    config: ResumePlayConfig,
  ) {
    this.config = config;
    this.positions = this.readPositions();
    this.promptDurationSeconds = this.readPromptDuration();
    this._state = this.buildState();
  }

  get state(): Readonly<ResumePlayState> {
    return this._state;
  }

  subscribe(listener: StateListener): () => void {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setUiAvailable(available: boolean): void {
    this.uiAvailable = available;
    if (!available) {
      this.resumeCandidate = null;
      this.setPendingPrompt(null);
      return;
    }

    if (this.activeMedia && this.config.enabled && !this.resumeCandidate) {
      this.resumeCandidate = this.positions[this.activeMedia.key] ?? null;
    }
    this.offerResumeIfAvailable();
  }

  setUiRefresh(refresh: UiRefresh | null): void {
    this.uiRefresh = refresh;
  }

  setSettingsUiRefresh(refresh: UiRefresh | null): void {
    this.settingsUiRefresh = refresh;
  }

  start(): void {
    if (this.disposed || this.running) return;
    this.running = true;
    this.refreshSnapshot();
    this.offerResumeIfAvailable();
  }

  stop(): void {
    if (this.disposed || !this.running) return;
    this.running = false;
    this.bypassPrompt = null;
    this.setPendingPrompt(null);
  }

  applyConfig(next: ResumePlayConfig): void {
    if (this.disposed) return;
    this.config = next;
    if (!next.enabled) {
      this.resumeCandidate = null;
      this.setPendingPrompt(null);
      this.emitState();
      this.refreshSettingsUi();
      return;
    }
    if (this.activeMedia) {
      this.resumeCandidate = this.positions[this.activeMedia.key] ?? null;
    }
    this.offerResumeIfAvailable();
    this.emitState();
    this.refreshSettingsUi();
  }

  beforePlay(snapshot: Readonly<PlayerSnapshot>): { decision: 'allow' | 'cancel' } {
    if (
      this.disposed ||
      !this.running ||
      !this.config.enabled ||
      !this.uiAvailable ||
      !this.context.hasCapability('player.read')
    ) {
      return { decision: 'allow' };
    }

    const active = this.activateFromSnapshot(snapshot);
    if (!active) return { decision: 'allow' };

    if (this.matchesBypass(active)) {
      this.bypassPrompt = null;
      return { decision: 'allow' };
    }

    const prompt =
      this.pendingPrompt?.mediaKey === active.key
        ? this.pendingPrompt
        : createPrompt(active, this.resumeCandidate ?? this.positions[active.key], {
            allowPastPosition: this.resumeCandidate !== null,
          });
    if (!prompt) return { decision: 'allow' };

    this.setPendingPrompt(prompt);
    return { decision: 'cancel' };
  }

  onOpening(
    event: PluginEventEnvelope<'media:opening'>,
  ): void {
    if (this.disposed || !isSourceKind(event.payload.kind)) return;

    const key = buildMediaKey({
      sourceKind: event.payload.kind,
      displayName: event.payload.displayName,
    });
    if (!key) return;

    this.setActiveMedia({
      key,
      sourceKind: event.payload.kind,
      displayName: event.payload.displayName.trim(),
      sessionId: event.sessionId,
      duration: null,
      currentTime: 0,
    });
    this.offerResumeIfAvailable();
  }

  onReady(event: PluginEventEnvelope<'media:ready'>): void {
    if (this.disposed || !event.payload.media) return;
    this.handleMediaSnapshot(event.payload.media, event.sessionId);
    this.offerResumeIfAvailable();
  }

  onSourceChanged(event: PluginEventEnvelope<'media:source-changed'>): void {
    if (this.disposed || !event.payload.media) {
      this.clearActiveMedia();
      return;
    }

    this.handleMediaSnapshot(event.payload.media, event.sessionId);
    this.offerResumeIfAvailable();
  }

  onTimeUpdate(event: PluginEventEnvelope<'media:time-update'>): void {
    if (
      this.disposed ||
      !this.running ||
      !this.activeMedia ||
      !this.matchesSession(event.sessionId)
    ) {
      return;
    }

    this.activeMedia = Object.freeze({
      ...this.activeMedia,
      currentTime: event.payload.currentTime,
      duration: event.payload.duration ?? this.activeMedia.duration,
    });

    if (
      this.pendingPrompt?.mediaKey === this.activeMedia.key ||
      this.resumeCandidate !== null
    ) {
      return;
    }
    this.savePosition(event.payload.currentTime, event.payload.duration);
  }

  onPause(event: PluginEventEnvelope<'media:pause'>): void {
    if (
      this.disposed ||
      !this.running ||
      !this.activeMedia ||
      !this.matchesSession(event.sessionId) ||
      this.pendingPrompt?.mediaKey === this.activeMedia.key ||
      this.resumeCandidate !== null
    ) {
      return;
    }

    this.savePosition(event.payload.currentTime, this.activeMedia.duration);
  }

  onSeeked(event: PluginEventEnvelope<'media:seeked'>): void {
    if (
      this.disposed ||
      !this.running ||
      !this.activeMedia ||
      !this.matchesSession(event.sessionId) ||
      this.pendingPrompt?.mediaKey === this.activeMedia.key ||
      this.resumeCandidate !== null
    ) {
      return;
    }

    this.activeMedia = Object.freeze({
      ...this.activeMedia,
      currentTime: event.payload.to,
    });
    this.savePosition(event.payload.to, this.activeMedia.duration);
  }

  onEnded(event: PluginEventEnvelope<'media:ended'>): void {
    if (
      this.disposed ||
      !this.activeMedia ||
      !this.matchesSession(event.sessionId)
    ) {
      return;
    }

    this.removePosition(this.activeMedia.key);
    this.resumeCandidate = null;
    this.setPendingPrompt(null);
  }

  onSnapshot(snapshot: Readonly<PlayerSnapshot>): void {
    if (this.disposed) return;

    if (!snapshot.media) {
      this.clearActiveMedia();
      return;
    }

    const active = this.activateFromSnapshot(snapshot);
    if (!active) return;

    if (snapshot.status === 'ended') {
      this.removePosition(active.key);
      this.resumeCandidate = null;
      this.setPendingPrompt(null);
      return;
    }

    if (this.running && snapshot.status === 'ready') {
      this.offerResumeIfAvailable();
    }
  }

  async resume(): Promise<boolean> {
    const prompt = this.pendingPrompt;
    if (!this.canControl(prompt)) return false;

    this.setPendingPrompt(null);
    const previousCandidate = this.resumeCandidate;
    this.resumeCandidate = null;
    this.bypassPrompt = {
      mediaKey: prompt.mediaKey,
      sessionId: this.activeMedia?.sessionId ?? null,
    };

    try {
      await this.context.commands.execute('media.seekTo', {
        seconds: prompt.position,
      });
      await this.context.commands.execute('media.play', undefined);
      return true;
    } catch (error) {
      this.bypassPrompt = null;
      this.resumeCandidate = previousCandidate;
      this.setPendingPrompt(prompt);
      this.logCommandFailure('resume', error);
      return false;
    }
  }

  async startOver(): Promise<boolean> {
    const prompt = this.pendingPrompt;
    if (!this.canControl(prompt)) return false;

    const previous = this.positions[prompt.mediaKey];
    const previousCandidate = this.resumeCandidate;
    delete this.positions[prompt.mediaKey];
    this.persistPositions();
    this.setPendingPrompt(null);
    this.resumeCandidate = null;
    this.bypassPrompt = {
      mediaKey: prompt.mediaKey,
      sessionId: this.activeMedia?.sessionId ?? null,
    };

    try {
      await this.context.commands.execute('media.seekTo', { seconds: 0 });
      await this.context.commands.execute('media.play', undefined);
      return true;
    } catch (error) {
      this.bypassPrompt = null;
      this.resumeCandidate = previousCandidate;
      if (previous) this.positions[prompt.mediaKey] = previous;
      this.persistPositions();
      this.setPendingPrompt(prompt);
      this.logCommandFailure('start over', error);
      return false;
    }
  }

  setPromptDuration(input: unknown): boolean {
    if (this.disposed) return false;

    const duration = normalizePromptDurationSeconds(input);
    if (duration === undefined) return false;

    this.promptDurationSeconds = duration;
    this.persistPromptDuration();
    if (this.pendingPrompt) this.startPromptTimer();
    this.emitState();
    this.refreshSettingsUi();

    return true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.stopPromptTimer();
    this.running = false;
    this.disposed = true;
    this.resumeCandidate = null;
    this.bypassPrompt = null;
    this.pendingPrompt = null;
    this.listeners.clear();
    this.emitState();
  }

  private buildState(): ResumePlayState {
    return Object.freeze({
      enabled: this.config.enabled,
      currentMediaKey: this.activeMedia?.key ?? null,
      prompt: this.pendingPrompt,
      promptDurationSeconds: this.promptDurationSeconds,
      promptRemainingMs: this.promptRemainingMs,
    });
  }

  private emitState(): void {
    if (this.disposed) return;
    this._state = this.buildState();
    for (const listener of [...this.listeners]) {
      try {
        listener();
      } catch (error) {
        this.context.logger.warn('A Resume Play UI listener failed.', {
          error: error instanceof Error ? error.message : 'unknown error',
        });
      }
    }

    try {
      this.uiRefresh?.();
    } catch (error) {
      this.context.logger.warn('A Resume Play UI refresh failed.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  private refreshSettingsUi(): void {
    try {
      this.settingsUiRefresh?.();
    } catch (error) {
      this.context.logger.warn('A Resume Play settings refresh failed.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  private setPendingPrompt(prompt: ResumePrompt | null): void {
    if (this.disposed) return;
    if (
      this.pendingPrompt === prompt ||
      (this.pendingPrompt !== null &&
        prompt !== null &&
        this.pendingPrompt.mediaKey === prompt.mediaKey &&
        this.pendingPrompt.position === prompt.position &&
        this.pendingPrompt.duration === prompt.duration)
    ) {
      return;
    }
    this.pendingPrompt = prompt;
    if (prompt) {
      this.startPromptTimer();
    } else {
      this.stopPromptTimer();
    }
    this.emitState();
  }

  private startPromptTimer(): void {
    this.stopPromptTimer();
    const promptDurationMs = this.promptDurationSeconds * 1000;
    this.promptExpiresAt = Date.now() + promptDurationMs;
    this.promptRemainingMs = promptDurationMs;
    this.promptTimer = setInterval(() => {
      if (!this.pendingPrompt || this.promptExpiresAt === null) {
        this.stopPromptTimer();
        return;
      }

      const remaining = Math.max(0, this.promptExpiresAt - Date.now());
      if (remaining === 0) {
        const active = this.activeMedia;
        this.resumeCandidate = null;
        if (active) {
          this.bypassPrompt = {
            mediaKey: active.key,
            sessionId: active.sessionId,
          };
        }
        this.setPendingPrompt(null);
        return;
      }

      if (remaining === this.promptRemainingMs) return;
      this.promptRemainingMs = remaining;
      this.emitState();
    }, PROMPT_TICK_MS);
  }

  private stopPromptTimer(): void {
    if (this.promptTimer !== null) {
      clearInterval(this.promptTimer);
      this.promptTimer = null;
    }
    this.promptExpiresAt = null;
    this.promptRemainingMs = 0;
  }

  private setActiveMedia(active: ActiveMedia): void {
    const changed =
      !this.activeMedia ||
      this.activeMedia.key !== active.key ||
      (this.activeMedia.sessionId !== null &&
        active.sessionId !== null &&
        this.activeMedia.sessionId !== active.sessionId);

    this.activeMedia = Object.freeze(active);
    if (changed) {
      this.bypassPrompt = null;
      this.resumeCandidate =
        this.config.enabled && this.uiAvailable
          ? this.positions[active.key] ?? null
          : null;
      this.setPendingPrompt(null);
    }
  }

  private clearActiveMedia(): void {
    if (!this.activeMedia && !this.pendingPrompt) return;
    this.activeMedia = null;
    this.resumeCandidate = null;
    this.bypassPrompt = null;
    this.setPendingPrompt(null);
  }

  private activateFromSnapshot(
    snapshot: Readonly<PlayerSnapshot>,
  ): ActiveMedia | null {
    if (!snapshot.media) return null;
    this.handleMediaSnapshot(snapshot.media, snapshot.sessionId);
    return this.activeMedia;
  }

  private handleMediaSnapshot(
    media: PlayerMedia,
    sessionId: string | null,
  ): void {
    const key = buildMediaKey(media);
    if (!key) {
      this.clearActiveMedia();
      return;
    }

    this.setActiveMedia({
      key,
      sourceKind: media.sourceKind,
      displayName: media.displayName.trim(),
      sessionId,
      duration: media.duration,
      currentTime: media.currentTime,
    });
  }

  private refreshSnapshot(): void {
    try {
      this.onSnapshot(this.context.player.getSnapshot());
    } catch (error) {
      this.context.logger.warn('Unable to read the current player snapshot.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  private offerResumeIfAvailable(): void {
    if (
      !this.running ||
      !this.config.enabled ||
      !this.uiAvailable ||
      !this.activeMedia
    ) {
      return;
    }

    const prompt = createPrompt(this.activeMedia, this.resumeCandidate ?? undefined, {
      allowPastPosition: true,
    });
    if (prompt) this.setPendingPrompt(prompt);
  }

  private savePosition(position: number, duration: number | null): void {
    if (!this.activeMedia || !Number.isFinite(position) || position < 0) {
      return;
    }

    // The host emits an initial media:time-update at 0 before media:ready.
    // Preserve an existing resume point during that bootstrap event; an
    // explicit Start over action deletes the record before issuing seekTo(0).
    if (position < MIN_RESUME_SECONDS && this.hasStoredResumePosition()) {
      return;
    }

    const safeDuration =
      typeof duration === 'number' && Number.isFinite(duration) && duration > 0
        ? duration
        : this.activeMedia.duration;

    if (
      safeDuration !== null &&
      position >= safeDuration - COMPLETION_EPSILON_SECONDS
    ) {
      this.removePosition(this.activeMedia.key);
      return;
    }

    if (position < MIN_RESUME_SECONDS) {
      this.removePosition(this.activeMedia.key);
      return;
    }

    this.positions[this.activeMedia.key] = Object.freeze({
      position,
      duration: safeDuration,
      updatedAt: Date.now(),
    });
    this.trimPositions();
    this.persistPositions();
  }

  private hasStoredResumePosition(): boolean {
    if (!this.activeMedia) return false;
    const stored = this.positions[this.activeMedia.key];
    return Boolean(stored && stored.position >= MIN_RESUME_SECONDS);
  }

  private removePosition(mediaKey: string): void {
    if (!Object.prototype.hasOwnProperty.call(this.positions, mediaKey)) {
      return;
    }
    delete this.positions[mediaKey];
    this.persistPositions();
  }

  private trimPositions(): void {
    const entries = Object.entries(this.positions);
    if (entries.length <= MAX_STORED_POSITIONS) return;

    entries
      .sort(([, left], [, right]) => left.updatedAt - right.updatedAt)
      .slice(0, entries.length - MAX_STORED_POSITIONS)
      .forEach(([mediaKey]) => delete this.positions[mediaKey]);
  }

  private readPositions(): StoredResumePositions {
    if (!this.context.hasCapability('storage')) return {};

    try {
      return parseStoredPositions(this.context.storage.get(STORAGE_KEY));
    } catch (error) {
      this.context.logger.warn('Unable to read Resume Play positions.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
      return {};
    }
  }

  private readPromptDuration(): number {
    if (!this.context.hasCapability('storage')) {
      return DEFAULT_PROMPT_DURATION_SECONDS;
    }

    try {
      return (
        normalizePromptDurationSeconds(
          this.context.storage.get(PROMPT_DURATION_STORAGE_KEY),
        ) ?? DEFAULT_PROMPT_DURATION_SECONDS
      );
    } catch (error) {
      this.context.logger.warn('Unable to read Resume Play notification duration.', {
        storageKey: PROMPT_DURATION_STORAGE_KEY,
      });
      this.context.logger.debug('Resume Play duration read error details.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
      return DEFAULT_PROMPT_DURATION_SECONDS;
    }
  }

  private persistPromptDuration(): void {
    if (!this.context.hasCapability('storage')) return;

    try {
      this.context.storage.set(
        PROMPT_DURATION_STORAGE_KEY,
        this.promptDurationSeconds,
      );
    } catch (error) {
      this.context.logger.warn('Unable to persist Resume Play notification duration.', {
        storageKey: PROMPT_DURATION_STORAGE_KEY,
      });
      this.context.logger.debug('Resume Play duration persistence error details.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  private persistPositions(): void {
    if (!this.context.hasCapability('storage')) return;

    try {
      const serializable: Record<string, PluginStorageValue> = {};
      for (const [mediaKey, position] of Object.entries(this.positions)) {
        serializable[mediaKey] = {
          position: position.position,
          duration: position.duration,
          updatedAt: position.updatedAt,
        };
      }
      this.context.storage.set(STORAGE_KEY, serializable);
    } catch (error) {
      this.context.logger.warn('Unable to persist Resume Play positions.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  private matchesSession(sessionId: string | null): boolean {
    return (
      !this.activeMedia ||
      this.activeMedia.sessionId === null ||
      sessionId === null ||
      this.activeMedia.sessionId === sessionId
    );
  }

  private matchesBypass(active: ActiveMedia): boolean {
    return (
      this.bypassPrompt !== null &&
      this.bypassPrompt.mediaKey === active.key &&
      (this.bypassPrompt.sessionId === null ||
        active.sessionId === null ||
        this.bypassPrompt.sessionId === active.sessionId)
    );
  }

  private canControl(prompt: ResumePrompt | null): prompt is ResumePrompt {
    return Boolean(
      prompt &&
        this.running &&
        !this.disposed &&
        this.config.enabled &&
        this.context.hasCapability('player.control'),
    );
  }

  private logCommandFailure(action: string, error: unknown): void {
    this.context.logger.warn(`Unable to ${action} in Resume Play.`, {
      error: error instanceof Error ? error.message : 'unknown error',
    });
  }
}

function ResumePlayPrompt({
  controller,
}: PluginSlotProps & { readonly controller: ResumePlayController }) {
  // The host re-renders public slots when the player snapshot changes. The
  // component deliberately avoids React hooks because the published plugin
  // bundle carries its own React runtime; hooks from that copy cannot share
  // the host renderer's dispatcher.
  const state = controller.state;

  if (!state.enabled || !state.prompt) return null;

  const prompt = state.prompt;
  const percentage =
    prompt.percentage === null ? '' : ` (${Math.round(prompt.percentage)}% complete)`;
  const promptDurationMs = state.promptDurationSeconds * 1000;
  const remainingMs = Math.max(
    0,
    Math.min(promptDurationMs, state.promptRemainingMs),
  );
  const progressPercent = Math.round(
    (remainingMs / promptDurationMs) * 100,
  );
  const secondsRemaining = Math.max(1, Math.ceil(remainingMs / 1000));
  const notificationStyle = {
    position: 'fixed',
    top: '84px',
    right: '24px',
    zIndex: 1000,
    width: 'min(420px, calc(100vw - 32px))',
    padding: '16px',
    border: '1px solid rgba(57, 167, 255, 0.42)',
    borderRadius: '20px',
    background: 'rgba(11, 15, 22, 0.96)',
    boxShadow:
      '0 18px 48px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.04) inset',
    backdropFilter: 'blur(16px)',
    color: '#eff5fb',
    pointerEvents: 'auto',
  } as const;
  const actionStyle = {
    minHeight: '44px',
    padding: '0 14px',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '12px',
    color: '#eff5fb',
    fontWeight: 700,
    cursor: 'pointer',
  } as const;

  return createElement(
    'section',
    {
      className: 'resume-play-notification',
      role: 'dialog',
      'aria-labelledby': 'resume-play-notification-title',
      'aria-describedby': 'resume-play-notification-description',
      'aria-live': 'polite',
      style: notificationStyle,
    },
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        },
      },
      createElement(
        'h2',
        {
          id: 'resume-play-notification-title',
          style: {
            margin: 0,
            fontSize: '15px',
            lineHeight: 1.25,
            letterSpacing: '0.02em',
          },
        },
        'Resume Play',
      ),
      createElement(
        'span',
        {
          'aria-label': `${secondsRemaining} seconds remaining`,
          style: {
            flex: '0 0 auto',
            minWidth: '40px',
            padding: '4px 8px',
            borderRadius: '999px',
            background: 'rgba(57, 167, 255, 0.16)',
            color: '#8bdcff',
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'center',
          },
        },
        `${secondsRemaining}s`,
      ),
    ),
    createElement(
      'p',
      {
        id: 'resume-play-notification-description',
        style: {
          margin: '12px 0 14px',
          color: 'rgba(239, 245, 251, 0.78)',
          fontSize: '14px',
          lineHeight: 1.45,
          overflowWrap: 'anywhere',
        },
      },
      `Continue "${prompt.displayName}" from ${formatResumeTime(prompt.position)}${percentage}?`,
    ),
    createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '8px',
        },
      },
      createElement(
        'button',
        {
          type: 'button',
          style: {
            ...actionStyle,
            background: 'rgba(57, 167, 255, 0.22)',
            borderColor: 'rgba(57, 167, 255, 0.48)',
          },
          onClick: () => {
            void controller.resume();
          },
        },
        'Resume',
      ),
      createElement(
        'button',
        {
          type: 'button',
          style: {
            ...actionStyle,
            background: 'rgba(255, 255, 255, 0.06)',
          },
          onClick: () => {
            void controller.startOver();
          },
        },
        'Start over',
      ),
    ),
    createElement(
      'div',
      {
        role: 'progressbar',
        'aria-label': 'Resume prompt time remaining',
        'aria-valuemin': 0,
        'aria-valuemax': promptDurationMs,
        'aria-valuenow': remainingMs,
        'aria-valuetext': `${secondsRemaining} seconds remaining`,
        style: {
          height: '4px',
          marginTop: '14px',
          overflow: 'hidden',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.12)',
        },
      },
      createElement('div', {
        'aria-hidden': 'true',
        style: {
          width: `${progressPercent}%`,
          height: '100%',
          borderRadius: 'inherit',
          background: 'linear-gradient(90deg, #39a7ff, #6fe1ff)',
          transition: 'width 180ms linear',
        },
      }),
    ),
  );
}

function ResumePlaySettings({
  controller,
}: PluginSlotProps & { readonly controller: ResumePlayController }) {
  const state = controller.state;

  return createElement(
    'section',
    {
      className: 'plugin-settings-section',
      'aria-labelledby': 'resume-play-settings-title',
      'data-plugin-settings': PLUGIN_ID,
    },
    createElement('h3', { id: 'resume-play-settings-title' }, 'Resume Play'),
    createElement(
      'label',
      { className: 'settings-item' },
      createElement('span', null, 'Notification duration'),
      createElement(
        'span',
        { className: 'settings-item-content' },
        createElement(
          'select',
          {
            className: 'text-input',
            value: String(state.promptDurationSeconds),
            disabled: !state.enabled,
            'aria-label': 'Resume Play notification duration',
            onChange: (event: ChangeEvent<HTMLSelectElement>) =>
              controller.setPromptDuration(event.currentTarget.value),
          },
          ...PROMPT_DURATION_OPTIONS.map((seconds) =>
            createElement(
              'option',
              { key: seconds, value: String(seconds) },
              `${seconds} second${seconds === 1 ? '' : 's'}`,
            ),
          ),
        ),
      ),
    ),
    createElement(
      'p',
      { className: 'helper-text' },
      state.enabled
        ? 'Choose how long the floating notification stays visible. The choice is remembered when Noir Player restarts.'
        : 'This plugin is disabled by its configuration.',
    ),
  );
}

const plugin = definePlugin<ResumePlayConfig, ResumePlayApi>({
  manifest,
  defaultConfig: {
    enabled: true,
  },
  config: { parse: parseConfig },
  setup(context, config) {
    const controller = new ResumePlayController(context, config);
    context.resources.add(() => controller.dispose());

    if (context.hasCapability('ui.contribute')) {
      let promptDisposable: (() => void) | undefined;
      let settingsDisposable: (() => void) | undefined;
      const promptContribution = {
        id: `${PLUGIN_ID}/prompt`,
        slot: 'notifications' as const,
        order: 10,
        ariaLabel: 'Resume Play',
        component: (props: PluginSlotProps) =>
          createElement(ResumePlayPrompt, { ...props, controller }),
      } as UiContribution;
      const settingsContribution = {
        id: `${PLUGIN_ID}/settings`,
        slot: 'settings.sections' as const,
        order: 60,
        ariaLabel: 'Resume Play settings',
        component: (props: PluginSlotProps) =>
          createElement(ResumePlaySettings, { ...props, controller }),
      } as UiContribution;
      const refreshPromptContribution = () => {
        promptDisposable?.();
        promptDisposable = context.ui.contribute(promptContribution);
      };
      const refreshSettingsContribution = () => {
        settingsDisposable?.();
        settingsDisposable = context.ui.contribute(settingsContribution);
      };

      try {
        controller.setUiRefresh(refreshPromptContribution);
        controller.setSettingsUiRefresh(refreshSettingsContribution);
        refreshPromptContribution();
        refreshSettingsContribution();
        context.resources.add(() => {
          controller.setUiRefresh(null);
          controller.setSettingsUiRefresh(null);
          promptDisposable?.();
          settingsDisposable?.();
          promptDisposable = undefined;
          settingsDisposable = undefined;
        });
        controller.setUiAvailable(true);
      } catch (error) {
        controller.setUiRefresh(null);
        context.logger.warn('Unable to register the Resume Play prompt.', {
          error: error instanceof Error ? error.message : 'unknown error',
        });
      }
    }

    if (context.hasCapability('player.read')) {
      context.resources.add(
        context.player.subscribe(() => {
          try {
            controller.onSnapshot(context.player.getSnapshot());
          } catch (error) {
            context.logger.warn('Unable to process a player snapshot.', {
              error: error instanceof Error ? error.message : 'unknown error',
            });
          }
        }),
      );

      context.resources.add(
        context.events.on('media:opening', (event) => controller.onOpening(event)),
      );
      context.resources.add(
        context.events.on('media:ready', (event) => controller.onReady(event)),
      );
      context.resources.add(
        context.events.on('media:source-changed', (event) =>
          controller.onSourceChanged(event),
        ),
      );
      context.resources.add(
        context.events.on('media:time-update', (event) =>
          controller.onTimeUpdate(event),
        ),
      );
      context.resources.add(
        context.events.on('media:pause', (event) => controller.onPause(event)),
      );
      context.resources.add(
        context.events.on('media:seeked', (event) => controller.onSeeked(event)),
      );
      context.resources.add(
        context.events.on('media:ended', (event) => controller.onEnded(event)),
      );

      context.resources.add(
        context.hooks.register('media:before-play', (snapshot) =>
          controller.beforePlay(snapshot),
        ),
      );
    }

    context.logger.info('Resume Play setup complete', {
      enabled: config.enabled,
    });

    return {
      api: {
        getState: () => controller.state,
        resume: () => controller.resume(),
        startOver: () => controller.startOver(),
        setPromptDuration: (input) => controller.setPromptDuration(input),
      },
      start() {
        controller.start();
      },
      onConfigChange(next) {
        controller.applyConfig(next);
      },
      stop() {
        controller.stop();
      },
      dispose() {
        controller.dispose();
      },
    };
  },
});

export { parseConfig as parseResumePlayConfig };
export default plugin;
