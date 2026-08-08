import { describe, expect, it } from 'vitest';
import plugin from '../src/index';

describe('blank Noir Player plugin', () => {
  it('exports a compatible manifest without capabilities', () => {
    expect(plugin.manifest.id).toBe('example.blank');
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
