import { definePlugin } from '@noir-player/plugin-api';

export interface BlankPluginConfig {
  readonly enabled: boolean;
}

function parseConfig(input: unknown): BlankPluginConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Blank plugin config must be an object.');
  }

  const enabled = (input as { enabled?: unknown }).enabled;
  if (typeof enabled !== 'boolean') {
    throw new TypeError('Blank plugin config enabled must be a boolean.');
  }

  return Object.freeze({ enabled });
}

const plugin = definePlugin<BlankPluginConfig>({
  manifest: {
    id: 'example.blank',
    name: 'Blank Noir Player plugin',
    version: '0.1.0',
    apiVersion: '^1.0.0',
    appVersion: '>=0.1.0 <1.0.0',
    description: 'A minimal, self-contained Noir Player plugin starter.',
    license: 'MIT',
    authors: ['Your name'],
    repository: 'https://github.com/neura-neura/noir-player-plugin-template',
    platforms: ['windows', 'browser-preview'],
    requestedCapabilities: [],
  },
  defaultConfig: {
    enabled: true,
  },
  config: { parse: parseConfig },
  setup(context, config) {
    context.logger.info('Blank plugin setup complete', { enabled: config.enabled });

    return {
      dispose() {
        context.logger.info('Blank plugin disposed');
      },
    };
  },
});

export default plugin;
