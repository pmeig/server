import { Builder } from './builder';
import { CliRunner, Runnable } from '../runner';
import { RunnerParameterConfiguration } from '../runner.helper';

const buildParameter = {
  prod: {
    indexes: 0,
    alias: ['-p'],
    tilde: 'double'
  }
} as RunnerParameterConfiguration;

export type BuildParameter = typeof buildParameter;

const buildRunner: CliRunner<BuildParameter> = (
  context,
  parameters: Record<keyof BuildParameter | 'projects', string[]>,
  rootProject: string,
  ...params
) => {
  return Promise.all(
    parameters.projects.map(project => {
      const builder = Builder.from(context, rootProject, project);
      return builder.build(parameters, ...params);
    })
  );
};

export const buildApplication: Runnable<BuildParameter> = {
  run: buildRunner,
  parameters: buildParameter
};
