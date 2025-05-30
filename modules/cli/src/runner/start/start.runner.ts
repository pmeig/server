import { CliContext } from '../../server/cli.context';
import { Builder } from '../build/builder';
import { Starter } from './starter';
import { CliRunner, Runnable } from '../runner';
import { Parameters, RunnerParameterConfiguration } from '../runner.helper';

const startParameter: RunnerParameterConfiguration = {};

export type StartParameter = typeof startParameter;

const startRun: CliRunner<StartParameter> = async (
  context: CliContext,
  parameters: Parameters<StartParameter>['cli'],
  rootProject: string,
  ...params: string[]
) => {
  return Promise.all(
    parameters.projects.map(async project => {
      const cliProject = context.projects[project];
      if (!cliProject || cliProject.type !== 'application') {
        return;
      }
      await Builder.from(context, rootProject, project).build({}, '--outDir', './target', '--sourceMap', 'true');
      return Starter.from(context, rootProject, project).start(parameters, ...params);
    })
  );
};

export const startApplication: Runnable<typeof startParameter> = {
  run: startRun,
  parameters: startParameter
};
