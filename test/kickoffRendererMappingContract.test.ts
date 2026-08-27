import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

import '../src/composition/apparel';
import { storefrontPageRendererRegistry } from '../src/rendering/storefrontPageRendererRegistry';
import { storefrontRendererRegistry } from '../src/rendering/storefrontRendererRegistry';

const require = createRequire(import.meta.url);
const kickoffRoot = process.env.NODICS_KICKOFF_ROOT || path.resolve(import.meta.dirname, '../../../nodics.kickoff');
const domain = 'apparel' as const;

describe('Kickoff logical renderer mappings', () => {
  it('maps Apparel content keys to executable code in the Apparel frontend composition', () => {
    expect(fs.existsSync(kickoffRoot)).toBe(true);
    const title = domain[0].toUpperCase() + domain.slice(1);
    const data = require(path.join(kickoffRoot, 'modules', `agora.${domain}`, 'data', 'staged', domain, 'data', `agora${title}RendererData.js`));
    for (const mapping of Object.values(data) as { renderer: string }[]) {
      const registry = mapping.renderer.includes('.page.') ? storefrontPageRendererRegistry : storefrontRendererRegistry;
      expect(() => registry.resolve(mapping.renderer, domain)).not.toThrow();
    }
  });
});
