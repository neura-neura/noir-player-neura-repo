import { createHash } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'noir.plugins.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));

if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.plugins)) {
  throw new Error('noir.plugins.json must contain schemaVersion 1 and a plugins array.');
}

const descriptorPaths = catalog.plugins.map((entry) => {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object' && typeof entry.descriptor === 'string') {
    return entry.descriptor;
  }
  throw new Error('Every catalog plugin entry must contain a descriptor path.');
});

if (descriptorPaths.length === 0) {
  throw new Error('The plugin catalog must contain at least one descriptor.');
}

const manifestIds = new Set();
for (const descriptorRelativePath of descriptorPaths) {
  const descriptorPath = resolveWithin(root, descriptorRelativePath, 'descriptor');
  const descriptor = JSON.parse(await readFile(descriptorPath, 'utf8'));
  const manifest = descriptor?.manifest;
  if (!manifest || typeof manifest.id !== 'string' || !manifest.id) {
    throw new Error(`${descriptorRelativePath} must contain manifest.id.`);
  }
  if (!/^[a-z0-9-]+\.[a-z0-9-]+$/.test(manifest.id)) {
    throw new Error(`${descriptorRelativePath} manifest.id must use namespace.name.`);
  }
  if (manifestIds.has(manifest.id)) {
    throw new Error(`Duplicate plugin manifest id: ${manifest.id}`);
  }
  manifestIds.add(manifest.id);

  if (typeof descriptor.entry !== 'string' || !descriptor.entry.trim()) {
    throw new Error(`${descriptorRelativePath} must contain an entry path.`);
  }
  if (descriptor.entry !== 'dist/index.js') {
    throw new Error(`${descriptorRelativePath} must use entry "dist/index.js".`);
  }

  const pluginRoot = path.dirname(descriptorPath);
  const sourcePath = resolveWithin(pluginRoot, 'src/index.ts', 'source');
  const entryPath = resolveWithin(pluginRoot, descriptor.entry, 'entry');
  await access(sourcePath);

  await build({
    configFile: false,
    root: pluginRoot,
    // GitHub plugins execute directly in Noir Player's WebView, where Node's
    // `process` global does not exist. React's production build is browser-safe
    // and keeps the published bundle independent of Node-only globals.
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      emptyOutDir: true,
      outDir: 'dist',
      lib: {
        entry: sourcePath,
        formats: ['es'],
        fileName: () => 'index.js',
      },
    },
  });

  const entrySource = await readFile(entryPath);
  const integrity = createHash('sha256').update(entrySource).digest('hex');
  descriptor.integrity = `sha256:${integrity}`;
  await writeFile(descriptorPath, `${JSON.stringify(descriptor, null, 2)}\n`, 'utf8');
  console.log(`Built ${manifest.id} -> ${path.relative(root, entryPath)} (sha256:${integrity})`);
}

function resolveWithin(base, relativePath, label) {
  if (typeof relativePath !== 'string' || path.isAbsolute(relativePath)) {
    throw new Error(`${label} path must be relative.`);
  }
  const resolved = path.resolve(base, relativePath);
  const relative = path.relative(base, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} path escapes the repository: ${relativePath}`);
  }
  return resolved;
}
