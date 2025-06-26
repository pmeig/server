import { CliContext } from '../../server/cli.context';
import { CreateParameter, CreateParameters } from './create.runner';
import { dirname, resolve } from 'path';
import { mkdirSync } from 'fs';
import { browseDir } from '../../helper/io.helper';
import { copyFileSync } from 'node:fs';
import { launcher } from '../../launcher';
import { versions } from './versions';
import * as readline from 'node:readline';

const templates = resolve(dirname(process.argv[1]), 'runner', 'new', 'templates');

export const convertToParameter = (parameters: Record<keyof CreateParameters, string[]>) => {
  const params = {
    type: parameters.type[0],
    name: parameters.name[0]
  } as CreateParameters;
  if (!params.type || !params.name) throw new Error('missing type and name on your request');
  params.root = parameters.root[0];
  params.prefix = parameters.prefix[0];
  params.destination = parameters.destination[0] ?? '.';
  params.module = parameters.module;
  return params;
};

export const createContext = (parameters: CreateParameters) => {
  const context = {} as CliContext;
  context.type = parameters.type as 'application' | 'library';
  context.name = parameters.name;
  context.architecture[context.type] = {
    root: parameters.root
  };
  context.architecture.prefix = parameters.prefix;
  return context;
};

export const createSrcRoot = (parameters: CreateParameters) => {
  const path = resolve(parameters.destination, parameters.name);
  mkdirSync(path, { recursive: true });
  const templatePath = resolve(templates, parameters.type);
  browseDir(templatePath, {
    file: file => {
      const destination = file.replace(templatePath, path).replace('.template', '');
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(file, destination);
      return true;
    }
  });
  return path;
};

export const initProject = async (
  root: string,
  module: string[],
  type: 'application' | 'library',
  manager: 'pnpm' | 'npm' | 'yarn'
) => {
  const executor = launcher.cwd(root).bin(manager);
  await executor.launch('init');
  const args = [`@pmeig/srv-cli@${versions.cli}`, '@types/node', 'typescript'];
  if (manager === 'pnpm') {
    args.push('-w');
  }
  await executor.launch('install', '-D', ...args);
  await executor.launch('install', `pmeig/srv-core@${versions.core}`);
  if (type === 'library') {
    for (const mod of module) {
      await executor.launch('pmeig', 'add', 'library', mod);
    }
    await executor.launch('pmeig', 'add', 'application', 'runner');
  }
};

export const askManager = (): Promise<'pnpm' | 'npm' | 'yarn'> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question('What is your manager (pnpm,npm,yarn)? ', answer => {
      if (!['pnpm', 'npm', 'yarn'].includes(answer)) throw new Error('invalid manager');
      resolve(answer as 'pnpm' | 'npm' | 'yarn');
      rl.close();
    });
  });
};
