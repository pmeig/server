import { Options } from '@swc/core';
import { PluginOption, UserConfig, ViteDevServer } from 'vite';
import { execSync } from 'child_process';
import { RollupPluginSwc } from './swc/rollup-plugin-swc';
import * as process from 'node:process';
import { resolve } from 'path';
import { readFileSync } from 'node:fs';

export interface PmeigVitePluginConfig {
  src?: string;
  swc?: Options;
}

export const PmeigVitePlugin = (configuration: PmeigVitePluginConfig = {}): PluginOption[] => {
  let context: { close(): Promise<void | any> } | undefined;
  let currentServer: ViteDevServer;
  let timeoutDisable = () => {};
  return [
    {
      name: 'pmeig-vite-plugin',
      config: config => {
        updateBuild(config, configuration);
        updateServer(config);
        return config;
      },
      configureServer: async server => {
        currentServer = server;
        context = await loadContext(server);
      },
      watchChange: async () => {
        timeoutDisable();
        const timeout = setTimeout(async () => {
          await context?.close();
          await currentServer.restart(true);
          timeoutDisable = () => {};
        }, 1000);
        timeoutDisable = () => clearTimeout(timeout);
      }
    },
    RollupPluginSwc(configuration.swc ?? {})
  ];
};

const loadContext = async (server: ViteDevServer) => {
  const module = await server.ssrLoadModule(server.config.build.rollupOptions.input as string);
  const values = Object.values(module);
  let context: { close(): Promise<void | any> } | undefined;
  while (!context && values.length > 0) {
    let value = values.shift();
    if (value instanceof Promise) {
      value = await value;
    }
    if (Object.getOwnPropertyNames(Object.getPrototypeOf(value)).includes('close')) {
      context = value;
    }
  }
  return context;
};

const updateBuild = (config: UserConfig, configuration: PmeigVitePluginConfig) => {
  const build = config.build ?? { rollupOptions: {} };
  const cwd = config.root ?? process.cwd();
  build.target =
    build.target ??
    (() => {
      const tsConfig = JSON.parse(
        execSync('pnpm tsc --showConfig', {
          encoding: 'utf-8',
          cwd
        })
      );
      return tsConfig.compilerOptions?.target ?? 'es2024';
    })();
  const rollup = build.rollupOptions ?? {};
  rollup.input = configuration.src || rollup.input;
  if (!rollup.input) {
    rollup.input = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf-8')).main ?? 'index.js';
  }
  build.rollupOptions = rollup;
  build.ssr = undefined;
  config.build = build;
};

const updateServer = (config: UserConfig) => {
  const server = config.server ?? {};
  server.host = 'localhost';
  server.proxy = {
    '/': {
      target: `http://localhost:3000`,
      changeOrigin: true
    }
  };
  config.server = server;
};
