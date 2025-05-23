import { CliRunner } from '../runner';
import { Builder } from './builder';

export const buildApplication: CliRunner = (context, project, ...params) => {
  const builder = Builder.from(context, project, ...params);
  return builder.build(...params);
};
