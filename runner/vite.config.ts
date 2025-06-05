import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
  build: {
    sourcemap: true,
    minify: true
  },
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    hmr: true
  },
  appType: 'custom',
  plugins: [
    ...VitePluginNode({
      appPath: 'main.ts',
      tsCompiler: 'swc',
      exportName: 'server',
      initAppOnBoot: true,
      adapter: 'express'
    }).map(value => {
      value.configureServer = server => {
        server.httpServer?.once('listening', async () => {
          const module = await server.ssrLoadModule('main.ts');
          await server.close();
          await module['main'];
        });
      };
      return value;
    })
  ]
});
