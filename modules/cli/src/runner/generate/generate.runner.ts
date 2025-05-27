import { RunnerParameterConfiguration } from '../runner.helper';
import { CliRunner, Runnable } from '../runner';
import { CliContext } from '../../server/cli.context';
import { Generator } from './generate';

const generatorParameters: RunnerParameterConfiguration = {
  prefix: {
    tilde: 'double',
    indexes: 1
  },
  destination: {
    tilde: 'double',
    alias: ['-d'],
    indexes: 1
  }
};

export type GeneratorParameters = typeof generatorParameters;

const generateRunner: CliRunner<GeneratorParameters> = (
  context: CliContext,
  parameters: Record<keyof GeneratorParameters, any>,
  rootProject: string,
  type: keyof Omit<CliContext['architecture'], 'prefix'>,
  name: string,
  ...params: string[]
) => {
  return Generator.from(type, rootProject, name).write(context, parameters, rootProject, ...params);
};

export const generateApplication: Runnable<GeneratorParameters> = {
  run: generateRunner,
  parameters: generatorParameters
};
