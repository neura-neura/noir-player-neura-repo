import {
  createElement,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import {
  definePlugin,
  type NoirPluginContext,
  type PluginSlotProps,
  type UiContribution,
} from '@noir-player/plugin-api';

export interface ChangeSliderColorConfig {
  readonly enabled: boolean;
  readonly defaultColor: string;
}

export interface ChangeSliderColorState {
  readonly enabled: boolean;
  readonly color: string;
  readonly defaultColor: string;
}

export interface ChangeSliderColorApi {
  readonly getState: () => Readonly<ChangeSliderColorState>;
  readonly setColor: (input: unknown) => boolean;
  readonly resetColor: () => boolean;
}

export const PLUGIN_ID = 'namespace.change-slider-color' as const;
const STORAGE_COLOR_KEY = 'sliderColor';
const DEFAULT_COLOR = '#39A7FF';

const manifest = {
  id: PLUGIN_ID,
  name: 'Change Slider Color',
  version: '0.1.0',
  apiVersion: '^1.0.0',
  appVersion: '>=0.1.0 <1.0.0',
  description:
    'Customize the Noir Player playback and volume slider color with a persistent color picker or hexadecimal value.',
  license: 'MIT',
  authors: ['neura-neura'],
  repository: 'https://github.com/neura-neura/noir-player-neura-repo',
  platforms: ['windows', 'browser-preview'] as const,
  requestedCapabilities: ['ui.contribute', 'storage', 'unsafe.dom'] as const,
};

/**
 * Accept the six-digit form used by <input type="color"> and expand the
 * compact three-digit form commonly used in hexadecimal color notation.
 */
export function normalizeHexColor(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;

  const value = input.trim();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [red, green, blue] = value.slice(1).toUpperCase().split('');
    return `#${red}${red}${green}${green}${blue}${blue}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toUpperCase();
  }

  return undefined;
}

function parseConfig(input: unknown): ChangeSliderColorConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Change Slider Color config must be an object.');
  }

  const value = input as Record<string, unknown>;
  if (typeof value.enabled !== 'boolean') {
    throw new TypeError('Change Slider Color config enabled must be a boolean.');
  }

  const defaultColor = normalizeHexColor(value.defaultColor);
  if (!defaultColor) {
    throw new TypeError(
      'Change Slider Color config defaultColor must be a hexadecimal color such as #39A7FF.',
    );
  }

  return Object.freeze({ enabled: value.enabled, defaultColor });
}

type StateListener = () => void;

class SliderColorController {
  private readonly listeners = new Set<StateListener>();
  private disposed = false;
  private running = false;
  private persistedColor = false;
  private styleElement: HTMLStyleElement | null = null;
  private _state: ChangeSliderColorState;

  constructor(
    private readonly context: NoirPluginContext,
    config: ChangeSliderColorConfig,
  ) {
    const storedColor = this.readStoredColor();
    this.persistedColor = storedColor !== undefined;
    this._state = Object.freeze({
      enabled: config.enabled,
      color: storedColor ?? config.defaultColor,
      defaultColor: config.defaultColor,
    });
  }

  get state(): Readonly<ChangeSliderColorState> {
    return this._state;
  }

  subscribe(listener: StateListener): () => void {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.disposed) return;
    // Keeping start idempotent makes restart and host lifecycle retries safe.
    this.running = true;
    this.syncDom();
  }

  stop(): void {
    if (this.disposed) return;
    this.running = false;
    this.removeStyleElement();
  }

  applyConfig(next: ChangeSliderColorConfig, previous: ChangeSliderColorConfig): void {
    if (this.disposed) return;

    const shouldAdoptNewDefault =
      next.defaultColor !== previous.defaultColor &&
      !this.persistedColor &&
      this._state.color === previous.defaultColor;

    this.updateState({
      enabled: next.enabled,
      color: shouldAdoptNewDefault ? next.defaultColor : this._state.color,
      defaultColor: next.defaultColor,
    });
  }

  setColor(input: unknown): boolean {
    if (this.disposed) return false;

    const color = normalizeHexColor(input);
    if (!color) return false;

    this.persistedColor = true;
    try {
      this.context.storage.set(STORAGE_COLOR_KEY, color);
    } catch (error) {
      this.context.logger.warn('Unable to persist slider color.', {
        storageKey: STORAGE_COLOR_KEY,
      });
      this.context.logger.debug('Slider color persistence error details.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
    }

    this.updateState({ ...this._state, color });
    return true;
  }

  resetColor(): boolean {
    return this.setColor(this._state.defaultColor);
  }

  dispose(): void {
    if (this.disposed) return;
    this.running = false;
    this.removeStyleElement();
    this.disposed = true;
    this.listeners.clear();
  }

  private readStoredColor(): string | undefined {
    try {
      const stored = this.context.storage.get(STORAGE_COLOR_KEY);
      return normalizeHexColor(stored);
    } catch (error) {
      this.context.logger.warn('Unable to read the persisted slider color.', {
        storageKey: STORAGE_COLOR_KEY,
      });
      this.context.logger.debug('Slider color read error details.', {
        error: error instanceof Error ? error.message : 'unknown error',
      });
      return undefined;
    }
  }

  private updateState(next: ChangeSliderColorState): void {
    if (this.disposed) return;
    this._state = Object.freeze(next);
    this.syncDom();
    for (const listener of [...this.listeners]) {
      try {
        listener();
      } catch (error) {
        this.context.logger.warn('A slider color UI listener failed.', {
          error: error instanceof Error ? error.message : 'unknown error',
        });
      }
    }
  }

  private syncDom(): void {
    if (!this.running || !this.canUseDom()) return;

    this.ensureStyleElement();
    if (this.styleElement) {
      this.styleElement.textContent = this._state.enabled
        ? buildSliderColorStyles(this._state.color)
        : '';
    }

    const settings = document.querySelector<HTMLElement>(
      `[data-plugin-settings="${PLUGIN_ID}"]`,
    );
    if (!settings) return;

    const picker = settings.querySelector<HTMLInputElement>(
      '[data-slider-color-control="picker"]',
    );
    const hexInput = settings.querySelector<HTMLInputElement>(
      '[data-slider-color-control="hex"]',
    );
    const reset = settings.querySelector<HTMLButtonElement>(
      '[data-slider-color-control="reset"]',
    );
    const helper = settings.querySelector<HTMLElement>(
      '[data-slider-color-control="helper"]',
    );

    if (picker) {
      picker.value = this._state.color;
      picker.disabled = !this._state.enabled;
    }
    if (hexInput) {
      hexInput.value = this._state.color;
      hexInput.disabled = !this._state.enabled;
    }
    if (reset) {
      reset.disabled =
        !this._state.enabled || this._state.color === this._state.defaultColor;
    }
    if (helper) {
      helper.textContent = this._state.enabled
        ? 'Choose a color or enter #RGB/#RRGGBB. The choice is remembered when Noir Player restarts.'
        : 'This plugin is disabled by its configuration.';
    }
  }

  private canUseDom(): boolean {
    return (
      this.context.hasCapability('unsafe.dom') &&
      typeof document !== 'undefined'
    );
  }

  private ensureStyleElement(): void {
    if (this.styleElement?.isConnected || !this.canUseDom()) return;

    const parent = document.head ?? document.documentElement;
    if (!parent) return;

    const style = document.createElement('style');
    style.setAttribute('data-plugin', `${PLUGIN_ID}/styles`);
    parent.append(style);
    this.styleElement = style;
  }

  private removeStyleElement(): void {
    this.styleElement?.remove();
    this.styleElement = null;
  }
}

export function buildSliderColorStyles(input: unknown): string {
  const color = normalizeHexColor(input);
  if (!color) {
    throw new TypeError('A valid hexadecimal slider color is required.');
  }

  return `
/* namespace.change-slider-color: public UI contribution for Noir Player sliders */
.native-progress,
.native-volume {
  accent-color: ${color} !important;
}

.native-progress::-webkit-slider-runnable-track,
.native-volume::-webkit-slider-runnable-track {
  background: linear-gradient(
    90deg,
    ${color} 0 var(--range-progress, 0%),
    rgba(255, 255, 255, 0.16) var(--range-progress, 0%) 100%
  ) !important;
}

.native-progress::-moz-range-progress,
.native-volume::-moz-range-progress,
.native-progress::-webkit-slider-thumb,
.native-volume::-webkit-slider-thumb,
.native-progress::-moz-range-thumb,
.native-volume::-moz-range-thumb {
  background: ${color} !important;
}

.plyr .plyr__progress input[type='range'],
.plyr .plyr__volume input[type='range'] {
  --plyr-color-main: ${color};
  --plyr-range-fill-background: ${color};
  --plyr-range-thumb-background: ${color};
  --plyr-video-range-fill-background: ${color};
  --plyr-video-range-thumb-background: ${color};
  accent-color: ${color} !important;
  color: ${color} !important;
}

.plyr .plyr__progress input[type='range']::-webkit-slider-thumb,
.plyr .plyr__volume input[type='range']::-webkit-slider-thumb,
.plyr .plyr__progress input[type='range']::-moz-range-thumb,
.plyr .plyr__volume input[type='range']::-moz-range-thumb {
  background: ${color} !important;
}
`;
}

function SliderColorSettings({
  controller,
}: PluginSlotProps & { readonly controller: SliderColorController }) {
  const state = controller.state;

  const commitDraft = (input: unknown, target?: HTMLInputElement) => {
    if (!controller.setColor(input) && target) {
      target.value = controller.state.color;
    }
  };

  const handleColorPickerChange = (event: ChangeEvent<HTMLInputElement>) => {
    controller.setColor(event.currentTarget.value);
  };

  const handleHexKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitDraft(event.currentTarget.value, event.currentTarget);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.currentTarget.value = controller.state.color;
    }
  };

  return createElement(
    'section',
    {
      className: 'plugin-settings-section',
      'aria-labelledby': 'change-slider-color-settings-title',
      'data-plugin-settings': PLUGIN_ID,
    },
    createElement(
      'h3',
      { id: 'change-slider-color-settings-title' },
      'Slider color',
    ),
    createElement(
      'label',
      { className: 'settings-item' },
      createElement('span', null, 'Playback and volume'),
      createElement(
        'span',
        { className: 'settings-item-content' },
        createElement('input', {
          type: 'color',
          value: state.color,
          disabled: !state.enabled,
          'data-slider-color-control': 'picker',
          'aria-label': 'Choose playback and volume slider color',
          onChange: handleColorPickerChange,
        }),
      ),
    ),
    createElement(
      'label',
      { className: 'settings-item' },
      createElement('span', null, 'Hexadecimal value'),
      createElement('input', {
        className: 'text-input',
        type: 'text',
        defaultValue: state.color,
        maxLength: 7,
        spellCheck: false,
        inputMode: 'text',
        disabled: !state.enabled,
        'data-slider-color-control': 'hex',
        'aria-label': 'Hexadecimal slider color',
        onBlur: (event: FocusEvent<HTMLInputElement>) =>
          commitDraft(event.currentTarget.value, event.currentTarget),
        onKeyDown: handleHexKeyDown,
      }),
    ),
    createElement(
      'div',
      { className: 'button-grid' },
      createElement(
        'button',
        {
          type: 'button',
          className: 'mini-button',
          disabled: !state.enabled || state.color === state.defaultColor,
          'data-slider-color-control': 'reset',
          onClick: () => controller.resetColor(),
        },
        'Reset to default',
      ),
    ),
    createElement(
      'p',
      { className: 'helper-text', 'data-slider-color-control': 'helper' },
      state.enabled
        ? 'Choose a color or enter #RGB/#RRGGBB. The choice is remembered when Noir Player restarts.'
        : 'This plugin is disabled by its configuration.',
    ),
  );
}

const plugin = definePlugin<ChangeSliderColorConfig, ChangeSliderColorApi>({
  manifest,
  defaultConfig: {
    enabled: true,
    defaultColor: DEFAULT_COLOR,
  },
  config: { parse: parseConfig },
  setup(context, config) {
    const controller = new SliderColorController(context, config);
    context.resources.add(() => controller.dispose());

    context.resources.add(
      context.ui.contribute({
        id: `${PLUGIN_ID}/settings`,
        slot: 'settings.sections',
        order: 50,
        component: (props) =>
          createElement(SliderColorSettings, { ...props, controller }),
      } as UiContribution),
    );

    context.logger.info('Change Slider Color setup complete', {
      color: controller.state.color,
    });

    return {
      api: {
        getState: () => controller.state,
        setColor: (input) => controller.setColor(input),
        resetColor: () => controller.resetColor(),
      },
      start() {
        controller.start();
      },
      onConfigChange(next, previous) {
        controller.applyConfig(next, previous);
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

export { parseConfig as parseChangeSliderColorConfig };
export default plugin;
