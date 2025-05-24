import { Builder } from './builder';
import { CliRunner } from '../runner';

export const buildApplication: CliRunner = (context, rootProject: string, project, ...params) => {
  const builder = Builder.from(context, rootProject, project, ...params);
  return builder.build(...params);
};
