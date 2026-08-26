import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '../..');
const scanRoots = ['src', 'public'].map((root) => path.join(projectRoot, root));
const forbiddenPatterns = [
  /\/agora-fashion\//u,
  /productImageMap/u,
  /storefrontContent/u,
  /fallbackBrand/u,
  /heroSlides\s*=\s*Object\.freeze/u,
  /collectionTiles\s*=\s*Object\.freeze/u,
  /editorialBanners\s*=\s*Object\.freeze/u,
  /customerQuotes\s*=\s*Object\.freeze/u,
  /instagramImages\s*=\s*Object\.freeze/u,
  /footerGroups\s*=\s*Object\.freeze/u,
  /Modave/iu,
];

function files(root: string): readonly string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = path.join(root, entry.name);
    if (entry.isDirectory()) return files(nextPath);
    if (!/\.(css|html|js|jsx|ts|tsx|json|svg)$/u.test(entry.name)) return [];
    return [nextPath];
  });
}

describe('Agora frontend content ownership', () => {
  it('does not ship customer-facing commerce content or media assets in the frontend repository', () => {
    const findings = scanRoots.flatMap((root) => files(root)).flatMap((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      return forbiddenPatterns
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${path.relative(projectRoot, filePath)} matched ${pattern.toString()}`);
    });

    expect(findings).toEqual([]);
  });
});
