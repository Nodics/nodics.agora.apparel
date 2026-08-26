import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const storefrontSolution = 'apparel';
const allowedSolutions = new Set([storefrontSolution]);
const compositionPlugin = (solution: string): Plugin => ({
  name: 'agora-static-solution-composition',
  resolveId(id) { return id === 'virtual:agora-composition' ? '\0virtual:agora-composition' : undefined; },
  load(id) { return id === '\0virtual:agora-composition' ? `export * from ${JSON.stringify(`/src/composition/${solution}.ts`)};` : undefined; },
});

export default defineConfig(({ mode }) => {
  const solution = loadEnv(mode, process.cwd(), '').AGORA_SOLUTION || storefrontSolution;
  if (!allowedSolutions.has(solution)) throw new Error(`Unsupported AGORA_SOLUTION: ${solution}`);
  return { plugins: [react(), compositionPlugin(solution)],
  server: {
    proxy: {
      '/nodics': {
        target: loadEnv(mode, process.cwd(), '').VITE_STOREFRONT_COMMERCE_PROXY_TARGET ?? 'http://localhost:4350',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: `dist`, emptyOutDir: true },
  test: {
    environment: 'jsdom',
    globals: true,
  } };
});
