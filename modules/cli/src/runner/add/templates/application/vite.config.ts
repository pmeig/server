import { defineConfig } from 'vite';
import { PmeigVitePlugin } from '@pmeig/vite-plugin';

export default defineConfig({
  plugins: [...PmeigVitePlugin({})]
});
