import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const slug = args.find((argument) => !argument.startsWith('--'));
const dryRun = args.includes('--dry-run');

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error('Usage: npm run create-plugin -- plugin-name [--dry-run]');
}

const pluginRoot = path.join(root, 'plugins', slug);
const descriptorPath = path.join(pluginRoot, 'noir.plugin.json');
try {
  await access(pluginRoot);
  throw new Error(`Plugin directory already exists: plugins/${slug}`);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const id = `example.${slug}`;
const title = slug
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');
const repository = 'https://github.com/YOUR-USER/YOUR-REPOSITORY';
const descriptor = {
  manifest: {
    id,
    name: `${title} Noir Player plugin`,
    version: '0.1.0',
    apiVersion: '^1.0.0',
    appVersion: '>=0.1.0 <1.0.0',
    description: `A Noir Player plugin named ${title}.`,
    license: 'MIT',
    authors: ['Your name'],
    repository,
    platforms: ['windows', 'browser-preview'],
    requestedCapabilities: [],
  },
  entry: 'dist/index.js',
  integrity: '',
};

const source = `import { definePlugin } from '@noir-player/plugin-api';

export interface ${toIdentifier(slug)}Config {
  readonly enabled: boolean;
}

function parseConfig(input: unknown): ${toIdentifier(slug)}Config {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('${title} config must be an object.');
  }

  const enabled = (input as { enabled?: unknown }).enabled;
  if (typeof enabled !== 'boolean') {
    throw new TypeError('${title} config enabled must be a boolean.');
  }

  return Object.freeze({ enabled });
}

const plugin = definePlugin<${toIdentifier(slug)}Config>({
  manifest: ${JSON.stringify(descriptor.manifest, null, 2)},
  defaultConfig: {
    enabled: true,
  },
  config: { parse: parseConfig },
  setup(context, config) {
    context.logger.info('${title} plugin setup complete', { enabled: config.enabled });

    return {
      dispose() {
        context.logger.info('${title} plugin disposed');
      },
    };
  },
});

export default plugin;
`;

const test = `import { describe, expect, it } from 'vitest';
import plugin from '../src/index';

describe('${title} Noir Player plugin', () => {
  it('exports a compatible manifest without capabilities', () => {
    expect(plugin.manifest.id).toBe('${id}');
    expect(plugin.manifest.apiVersion).toBe('^1.0.0');
    expect(plugin.manifest.requestedCapabilities).toEqual([]);
  });

  it('validates its default configuration', () => {
    expect(plugin.config.parse(plugin.defaultConfig)).toEqual({ enabled: true });
    expect(() => plugin.config.parse({ enabled: 'yes' })).toThrow(
      'enabled must be a boolean',
    );
  });
});
`;

const readme = `# ${title} Noir Player plugin

Describe what this plugin does, its requested capabilities, and how users configure it.

Run the repository checks from the root:

\`\`\`powershell
npm run check
\`\`\`
`;

const catalogPath = path.join(root, 'noir.plugins.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const descriptorRelativePath = `plugins/${slug}/noir.plugin.json`;
const alreadyListed = catalog.plugins.some((entry) => (
  typeof entry === 'string' ? entry : entry?.descriptor
) === descriptorRelativePath);
if (alreadyListed) throw new Error(`Catalog already contains ${descriptorRelativePath}`);

if (dryRun) {
  console.log(`Would create ${descriptorRelativePath}`);
  console.log(`Would add ${descriptorRelativePath} to noir.plugins.json`);
} else {
  await mkdir(path.join(pluginRoot, 'src'), { recursive: true });
  await mkdir(path.join(pluginRoot, 'tests'), { recursive: true });
  await writeFile(path.join(pluginRoot, 'src/index.ts'), source, 'utf8');
  await writeFile(path.join(pluginRoot, 'tests/index.test.ts'), test, 'utf8');
  await writeFile(path.join(pluginRoot, 'README.md'), readme, 'utf8');
  await writeFile(descriptorPath, `${JSON.stringify(descriptor, null, 2)}\n`, 'utf8');
  catalog.plugins.push({ descriptor: descriptorRelativePath });
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Created plugins/${slug}. Run npm run check to build and hash it.`);
}

function toIdentifier(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
    .replace(/^[^A-Za-z]+/, '') || 'Generated';
}
