import { ParameterConfiguration, RunnerParameterConfiguration } from '../runner.helper';
import { CliRunner, Runnable } from '../runner';
import { askManager, convertToParameter, createContext, createSrcRoot, initProject } from './create';
import { browseDir, writeJson } from '../../helper/io.helper';
import { resolve } from 'path';
import { GeneratorParameters } from '../add/add.runner';

export interface CreateParameters {
  type: 'application' | 'library';
  name: string;
  destination: string;
  prefix?: string;
  root?: string;
  module?: string[];
}

export const createParameter = {
  type: {
    indexes: 1,
    position: 0,
    alias: ['-t'],
    tilde: 'double'
  },
  name: {
    indexes: 1,
    alias: ['-n'],
    tilde: 'double',
    position: 1
  },
  destination: {
    indexes: 1,
    alias: ['-d'],
    tilde: 'double',
    position: 2
  },
  prefix: {
    indexes: 1,
    tilde: 'double',
    alias: ['-p']
  },
  root: {
    indexes: 1,
    alias: ['-r'],
    tilde: 'double',
    default: 'modules'
  },
  module: {
    indexes: 1,
    alias: ['-m'],
    tilde: 'double'
  }
} as Record<keyof CreateParameters, ParameterConfiguration>;

export type CreateParameter = typeof createParameter;

export const createRunner: CliRunner<CreateParameter> = async (context, parameters, rootProject) => {
  const params = convertToParameter(parameters);
  context = createContext(params);
  const root = createSrcRoot(params);
  writeJson(resolve(root, 'pmeig-cli.json'), context);
  return initProject(root, params.module ?? [], params.type, await askManager());
};

export const newApplication: Runnable<GeneratorParameters> = {
  run: createRunner,
  parameters: createParameter
};
