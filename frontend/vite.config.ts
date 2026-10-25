import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { build as esbuild } from 'esbuild';

function chromeExtensionScriptsPlugin(): Plugin {
  return {
    name: 'chrome-extension-scripts',
    async closeBundle() {
      // Build background service worker (ESM)
      await esbuild({
        entryPoints: [resolve(__dirname, 'src/background/index.ts')],
        outfile: resolve(__dirname, 'dist/background.js'),
        bundle: true,
        format: 'esm',
        target: 'es2020',
        sourcemap: false,
      });

      // Build content script (IIFE for standalone browser injection)
      await esbuild({
        entryPoints: [resolve(__dirname, 'src/content/index.ts')],
        outfile: resolve(__dirname, 'dist/content.js'),
        bundle: true,
        format: 'iife',
        target: 'es2020',
        sourcemap: false,
      });

      console.log('✓ Bundled background.js and content.js for Manifest V3');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), chromeExtensionScriptsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
    },
  },
});
