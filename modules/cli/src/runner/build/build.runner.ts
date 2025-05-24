import { Builder } from './builder';
import { CliRunner } from '../runner';

export const buildApplication: CliRunner = (context, rootProject: string, project, ...params) => {
  const builder = Builder.from(context, project, ...params);
  return builder.build(...params);
};
