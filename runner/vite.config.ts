import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

const lib = resolve(__dirname, '../modules');

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['process']
    },
    watch: {
      include: [`${lib}/**/src/**`],
      chokidar: {}
    }
  },
  resolve: {
    alias: {
      '@server/core': resolve(lib, 'core')
    }
  },
  plugins: [
    ...VitePluginNode({
      initAppOnBoot: true,
      adapter: 'marble',
      appPath: './main.ts',
      exportName: 'server',
      tsCompiler: 'swc'
    })
  ]
});
