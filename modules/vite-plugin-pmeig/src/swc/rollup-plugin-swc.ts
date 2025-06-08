import { createFilter } from '@rollup/pluginutils';
import type { Compiler, Options } from '@swc/core';
import type { Plugin } from 'vite';
import { SwcOptions } from './swc.options';

export const queryRE = /\?.*$/;
export const hashRE = /#.*$/;

export function RollupPluginSwc(options: Options): Plugin {
  let swc: Compiler;
  const filter = createFilter(/\.(tsx?|jsx)$/, /\.js$/);

  return {
    name: 'rollup-plugin-swc',
    config: config => {
      const optimizeDeps = config.optimizeDeps || {};
      optimizeDeps.exclude = optimizeDeps.exclude || [];
      optimizeDeps.exclude.push('@swc/core');
      config.optimizeDeps = optimizeDeps;
      config.esbuild = config.esbuild || false;
      return config;
    },
    async transform(code, id) {
      if (filter(id) || filter(id.replace(hashRE, '').replace(queryRE, ''))) {
        if (!swc) swc = await import('@swc/core').then(({ Compiler }) => new Compiler());
        return swc.transform(
          code,
          SwcOptions({
            ...options,
            filename: id
          })
        );
      }
    }
  };
}
