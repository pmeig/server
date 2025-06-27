import { defineConfig } from 'vite';
import { PmeigVitePlugin } from '@pmeig/vite-plugin';
import vitePluginRequire from 'vite-plugin-require';

export default defineConfig({
  plugins: [...PmeigVitePlugin({}), vitePluginRequire()]
});
