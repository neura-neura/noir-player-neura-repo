import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import plugin, {
  buildSliderColorStyles,
  normalizeHexColor,
  parseChangeSliderColorConfig,
} from '../src/index';

describe('Change Slider Color Noir Player plugin', () => {
  it('exports a compatible manifest with only required capabilities', () => {
    expect(plugin.manifest.id).toBe('namespace.change-slider-color');
    expect(plugin.manifest.apiVersion).toBe('^1.0.0');
    expect(plugin.manifest.repository).toBe(
      'https://github.com/neura-neura/noir-player-neura-repo',
    );
    expect(plugin.manifest.requestedCapabilities).toEqual([
      'ui.contribute',
      'storage',
      'unsafe.dom',
    ]);
  });

  it('keeps the source manifest and descriptor manifest synchronized', async () => {
    const descriptor = JSON.parse(
      await readFile(path.join(process.cwd(), 'noir.plugin.json'), 'utf8'),
    ) as { manifest: unknown };

    expect(descriptor.manifest).toEqual(plugin.manifest);
  });

  it('validates and normalizes its configuration', () => {
    expect(parseChangeSliderColorConfig(plugin.defaultConfig)).toEqual({
      enabled: true,
      defaultColor: '#39A7FF',
    });
    expect(normalizeHexColor('#abc')).toBe('#AABBCC');
    expect(normalizeHexColor(' #12abEF ')).toBe('#12ABEF');
    expect(() => parseChangeSliderColorConfig({ enabled: 'yes', defaultColor: '#fff' })).toThrow(
      'enabled must be a boolean',
    );
    expect(() => parseChangeSliderColorConfig({ enabled: true, defaultColor: 'blue' })).toThrow(
      'defaultColor must be a hexadecimal color',
    );
  });

  it('creates CSS for both native and browser playback sliders', () => {
    const css = buildSliderColorStyles('#123456');

    expect(css).toContain('.native-progress');
    expect(css).toContain('.native-volume');
    expect(css).toContain('.plyr .plyr__progress input[type=\'range\']');
    expect(css).toContain('.plyr .plyr__volume input[type=\'range\']');
    expect(css).toContain('#123456');
    expect(() => buildSliderColorStyles('#12345')).toThrow(
      'valid hexadecimal slider color',
    );
  });

  it('exposes a persistent color API and a settings UI contribution', async () => {
    const stored = new Map<string, unknown>();
    const contributions: Array<{ id: string }> = [];
    const resources: Array<() => void> = [];
    const context = {
      pluginId: plugin.manifest.id,
      manifest: plugin.manifest,
      signal: new AbortController().signal,
      storage: {
        schemaVersion: 1,
        get: (key: string) => stored.get(key),
        set: (key: string, value: unknown) => stored.set(key, value),
        remove: (key: string) => stored.delete(key),
        clear: () => stored.clear(),
      },
      logger: {
        debug: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      },
      resources: {
        add: <T extends () => void>(disposable: T) => {
          resources.push(disposable);
          return disposable;
        },
        addAbortController: () => new AbortController().signal,
        addTimer: (timer: ReturnType<typeof setTimeout>) => timer,
        dispose: () => undefined,
        get size() {
          return resources.length;
        },
      },
      ui: {
        contribute: (contribution: { id: string }) => {
          contributions.push(contribution);
          return () => undefined;
        },
      },
      hasCapability: () => true,
    } as never;

    const instance = await plugin.setup(context, plugin.defaultConfig);
    expect(contributions.map(({ id }) => id)).toEqual([
      'namespace.change-slider-color/settings',
    ]);
    expect(instance.api?.getState().color).toBe('#39A7FF');
    await instance.start?.();
    await instance.start?.();
    expect(instance.api?.setColor('#abc')).toBe(true);
    expect(instance.api?.getState().color).toBe('#AABBCC');
    expect(stored.get('sliderColor')).toBe('#AABBCC');

    const restored = await plugin.setup(context, plugin.defaultConfig);
    expect(restored.api?.getState().color).toBe('#AABBCC');
    await restored.dispose?.();

    expect(instance.api?.resetColor()).toBe(true);
    expect(instance.api?.getState().color).toBe('#39A7FF');

    await instance.stop?.();
    await instance.stop?.();
    await instance.dispose?.();
    await instance.dispose?.();
  });
});
