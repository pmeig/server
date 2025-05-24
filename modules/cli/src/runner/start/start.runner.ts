import { CliContext } from '../../server/cli.context';
import { Builder } from '../build/builder';
import { Starter } from './starter';
import { CliRunner } from '../runner';

export const startApplication: CliRunner = async (
  context: CliContext,
  rootProject: string,
  project: string,
  ...params: string[]
) => {
  const cliProject = context.projects[project];
  if (!cliProject || cliProject.type !== 'application') {
    return;
  }
  await Builder.from(context, rootProject, project, ...params).build('--outDir', './target', '--sourceMap', 'true');
  return Starter.from(context, rootProject, project).start(...params);
};
