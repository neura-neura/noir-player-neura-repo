import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerSnapshot } from '@noir-player/plugin-api';
import plugin, {
  buildMediaKey,
  formatResumeTime,
  parseResumePlayConfig,
} from '../src/index';

type EventHandler = (event: {
  readonly name: string;
  readonly payload: unknown;
  readonly timestamp: number;
  readonly revision: number;
  readonly sessionId: string | null;
}) => void;

function createMedia(
  displayName: string,
  currentTime = 0,
  duration: number | null = 120,
): NonNullable<PlayerSnapshot['media']> {
  return {
    displayName,
    sourceKind: 'local-file',
    engine: 'libmpv',
    engineStatus: 'ready',
    duration,
    currentTime,
    videoSize: { width: 1920, height: 1080 },
    buffered: [],
  };
}

function createSnapshot(
  media: PlayerSnapshot['media'] = null,
  sessionId: string | null = null,
  status: PlayerSnapshot['status'] = 'empty',
): PlayerSnapshot {
  return {
    revision: 1,
    sessionId,
    status,
    media,
    playback: {
      paused: status !== 'playing',
      rate: 1,
      volume: 1,
      muted: false,
      fullscreen: false,
    },
    subtitles: {
      trackId: null,
      displayName: null,
      cueIndex: -1,
      cueText: null,
      offsetMs: 0,
    },
    playlist: {
      items: [],
      activeId: null,
    },
    ui: {
      panelVisible: false,
      panelTab: null,
      playbackControlsVisible: true,
    },
  };
}

function createContext() {
  const stored = new Map<string, unknown>();
  const eventHandlers = new Map<string, Set<EventHandler>>();
  const hookHandlers = new Map<string, (input: unknown) => unknown>();
  const playerListeners = new Set<() => void>();
  const contributions: Array<{ id: string; slot: string }> = [];
  const commands: Array<{ name: string; input: unknown }> = [];
  const resources: Array<() => void> = [];
  let snapshot = createSnapshot();

  const context = {
    pluginId: plugin.manifest.id,
    manifest: plugin.manifest,
    signal: new AbortController().signal,
    player: {
      getSnapshot: () => snapshot,
      subscribe: (listener: () => void) => {
        playerListeners.add(listener);
        return () => playerListeners.delete(listener);
      },
    },
    mpv: {},
    events: {
      on: (name: string, listener: EventHandler) => {
        const handlers = eventHandlers.get(name) ?? new Set<EventHandler>();
        handlers.add(listener);
        eventHandlers.set(name, handlers);
        return () => handlers.delete(listener);
      },
      once: () => () => undefined,
    },
    hooks: {
      register: (name: string, handler: (input: unknown) => unknown) => {
        hookHandlers.set(name, handler);
        return () => hookHandlers.delete(name);
      },
    },
    commands: {
      execute: async (name: string, input: unknown) => {
        commands.push({ name, input });
        return undefined;
      },
      executePlugin: async () => undefined,
      register: () => () => undefined,
    },
    ui: {
      contribute: (contribution: { id: string; slot: string }) => {
        contributions.push(contribution);
        return () => undefined;
      },
    },
    services: {
      provide: () => () => undefined,
      get: () => undefined,
      optional: () => undefined,
    },
    storage: {
      schemaVersion: 1,
      get: (key: string) => stored.get(key),
      set: (key: string, value: unknown) => stored.set(key, value),
      remove: (key: string) => stored.delete(key),
      clear: () => stored.clear(),
    },
    i18n: {
      t: (key: string) => key,
      register: () => () => undefined,
      getLocale: () => 'en',
    },
    logger: {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    telemetry: {
      record: () => undefined,
    },
    resources: {
      add: <T extends () => void>(disposable: T) => {
        resources.push(disposable);
        return disposable;
      },
      addAbortController: () => new AbortController().signal,
      addTimer: (timer: ReturnType<typeof setTimeout>) => timer,
      dispose: () => {
        for (const disposable of [...resources].reverse()) disposable();
      },
      get size() {
        return resources.length;
      },
    },
    hasCapability: () => true,
  } as never;

  const setSnapshot = (next: PlayerSnapshot) => {
    snapshot = next;
    for (const listener of playerListeners) listener();
  };

  const emit = (name: string, payload: unknown, sessionId = snapshot.sessionId) => {
    const envelope = {
      name,
      payload,
      timestamp: Date.now(),
      revision: snapshot.revision,
      sessionId,
    };
    for (const handler of [...(eventHandlers.get(name) ?? [])]) handler(envelope);
  };

  const invokeBeforePlay = (nextSnapshot: PlayerSnapshot) =>
    hookHandlers.get('media:before-play')?.(nextSnapshot);

  return {
    context,
    stored,
    contributions,
    commands,
    emit,
    invokeBeforePlay,
    setSnapshot,
  };
}

describe('Resume Play Noir Player plugin', () => {
  it('exports a synchronized manifest with minimal public capabilities', async () => {
    expect(plugin.manifest.id).toBe('namespace.resume-play');
    expect(plugin.manifest.name).toBe('Resume Play');
    expect(plugin.manifest.requestedCapabilities).toEqual([
      'player.read',
      'player.control',
      'ui.contribute',
      'storage',
    ]);
    expect(plugin.manifest.requestedCapabilities).not.toContain('native.mpv.read');
    expect(plugin.manifest.requestedCapabilities).not.toContain('native.mpv.raw');

    const descriptor = JSON.parse(
      await readFile(
        path.join(process.cwd(), 'plugins/resume-play/noir.plugin.json'),
        'utf8',
      ),
    ) as { manifest: unknown };
    expect(descriptor.manifest).toEqual(plugin.manifest);
  });

  it('validates configuration and creates stable public media identities', () => {
    expect(parseResumePlayConfig(plugin.defaultConfig)).toEqual({ enabled: true });
    expect(() => parseResumePlayConfig({ enabled: 'yes' })).toThrow(
      'enabled must be a boolean',
    );
    expect(buildMediaKey(createMedia('  Stalker (1979).mkv  '))).toBe(
      JSON.stringify({ sourceKind: 'local-file', displayName: 'Stalker (1979).mkv' }),
    );
    expect(buildMediaKey({ sourceKind: 'unsupported', displayName: 'video' })).toBeUndefined();
    expect(formatResumeTime(3723.9)).toBe('1:02:03');
    expect(formatResumeTime(83.4)).toBe('1:23');
  });

  it('persists positions and lets the user resume or start over', async () => {
    const testContext = createContext();
    const instance = await plugin.setup(testContext.context, plugin.defaultConfig);

    expect(testContext.contributions).toHaveLength(1);
    expect(testContext.contributions[0]).toMatchObject({
      id: 'namespace.resume-play/prompt',
      slot: 'notifications',
    });

    await instance.start?.();
    await instance.start?.();

    const media = createMedia('Stalker (1979).mkv');
    testContext.setSnapshot(createSnapshot(media, 'session-1', 'ready'));
    testContext.emit('media:opening', {
      sessionId: 'session-1',
      displayName: media.displayName,
      kind: media.sourceKind,
    }, 'session-1');
    testContext.emit('media:ready', { media }, 'session-1');
    testContext.emit('media:time-update', {
      currentTime: 42.25,
      duration: 120,
    }, 'session-1');
    testContext.emit('media:pause', { currentTime: 42.25 }, 'session-1');

    const mediaKey = buildMediaKey(media);
    expect(mediaKey).toBeDefined();
    expect(
      (testContext.stored.get('resumePositions') as Record<string, { position: number }>)[
        mediaKey as string
      ].position,
    ).toBe(42.25);

    const secondSessionMedia = createMedia(media.displayName, 100);
    const secondSession = createSnapshot(secondSessionMedia, 'session-2', 'playing');
    testContext.setSnapshot(secondSession);
    testContext.emit('media:opening', {
      sessionId: 'session-2',
      displayName: media.displayName,
      kind: media.sourceKind,
    }, 'session-2');
    expect(instance.api?.getState().prompt?.position).toBe(42.25);
    expect(instance.api?.getState().promptRemainingMs).toBe(5000);
    // The host emits this bootstrap event before media:ready. It must not
    // erase the position that the ready event is about to offer.
    testContext.emit('media:time-update', {
      currentTime: 100,
      duration: 120,
    }, 'session-2');
    testContext.emit('media:ready', { media: secondSessionMedia }, 'session-2');

    expect(instance.api?.getState().prompt?.position).toBe(42.25);
    expect(testContext.invokeBeforePlay(secondSession)).toEqual({ decision: 'cancel' });

    expect(await instance.api?.resume()).toBe(true);
    expect(testContext.commands.slice(-2)).toEqual([
      { name: 'media.seekTo', input: { seconds: 42.25 } },
      { name: 'media.play', input: undefined },
    ]);
    expect(testContext.invokeBeforePlay(secondSession)).toEqual({ decision: 'allow' });

    testContext.emit('media:opening', {
      sessionId: 'session-3',
      displayName: media.displayName,
      kind: media.sourceKind,
    }, 'session-3');
    testContext.setSnapshot(createSnapshot(createMedia(media.displayName), 'session-3', 'ready'));
    testContext.emit(
      'media:ready',
      { media: createMedia(media.displayName) },
      'session-3',
    );
    expect(instance.api?.getState().prompt?.position).toBe(42.25);
    expect(await instance.api?.startOver()).toBe(true);
    expect(testContext.commands.slice(-2)).toEqual([
      { name: 'media.seekTo', input: { seconds: 0 } },
      { name: 'media.play', input: undefined },
    ]);
    expect(
      (testContext.stored.get('resumePositions') as Record<string, unknown>)[
        mediaKey as string
      ],
    ).toBeUndefined();

    await instance.stop?.();
    await instance.stop?.();
    await instance.dispose?.();
    await instance.dispose?.();
  });

  it('dismisses the floating notification after five seconds', async () => {
    vi.useFakeTimers();
    let instance: Awaited<ReturnType<typeof plugin.setup>> | undefined;

    try {
      const testContext = createContext();
      const media = createMedia('Timed prompt.mkv');
      const mediaKey = buildMediaKey(media) as string;
      testContext.stored.set('resumePositions', {
        [mediaKey]: { position: 42.25, duration: 120, updatedAt: 1 },
      });
      instance = await plugin.setup(testContext.context, plugin.defaultConfig);
      await instance.start?.();

      testContext.setSnapshot(createSnapshot(media, 'timed-session', 'ready'));
      testContext.emit('media:opening', {
        sessionId: 'timed-session',
        displayName: media.displayName,
        kind: media.sourceKind,
      }, 'timed-session');

      expect(instance.api?.getState().prompt).not.toBeNull();
      expect(instance.api?.getState().promptRemainingMs).toBe(5000);

      await vi.advanceTimersByTimeAsync(5000);

      expect(instance.api?.getState().prompt).toBeNull();
      expect(instance.api?.getState().promptRemainingMs).toBe(0);
    } finally {
      await instance?.dispose?.();
      vi.useRealTimers();
    }
  });

  it('clears a saved position when playback reaches the end', async () => {
    const testContext = createContext();
    const instance = await plugin.setup(testContext.context, plugin.defaultConfig);
    await instance.start?.();

    const media = createMedia('Short video.mkv', 10, 120);
    testContext.setSnapshot(createSnapshot(media, 'session-end', 'playing'));
    testContext.emit('media:opening', {
      sessionId: 'session-end',
      displayName: media.displayName,
      kind: media.sourceKind,
    }, 'session-end');
    testContext.emit('media:time-update', {
      currentTime: 10,
      duration: 120,
    }, 'session-end');
    const mediaKey = buildMediaKey(media) as string;
    expect(
      (testContext.stored.get('resumePositions') as Record<string, unknown>)[mediaKey],
    ).toBeDefined();

    testContext.emit('media:ended', { currentTime: 120 }, 'session-end');
    expect(
      (testContext.stored.get('resumePositions') as Record<string, unknown>)[mediaKey],
    ).toBeUndefined();
    await instance.dispose?.();
  });
});
