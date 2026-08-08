import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('multi-plugin catalog', () => {
  it('references unique descriptors with a source and the standard entry', async () => {
    const catalog = JSON.parse(await readFile(path.join(root, 'noir.plugins.json'), 'utf8')) as {
      readonly schemaVersion: number;
      readonly plugins: readonly (string | { readonly descriptor: string })[];
    };
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.plugins.length).toBeGreaterThan(0);

    const ids: string[] = [];
    for (const item of catalog.plugins) {
      const descriptorRelativePath = typeof item === 'string' ? item : item.descriptor;
      const descriptorPath = path.resolve(root, descriptorRelativePath);
      const descriptor = JSON.parse(await readFile(descriptorPath, 'utf8')) as {
        readonly manifest: { readonly id: string };
        readonly entry: string;
      };
      await access(path.resolve(path.dirname(descriptorPath), 'src/index.ts'));
      expect(descriptor.entry).toBe('dist/index.js');
      ids.push(descriptor.manifest.id);
    }

    expect(new Set(ids).size).toBe(ids.length);
  });
});
