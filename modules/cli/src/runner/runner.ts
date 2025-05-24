import { startApplication } from './start/start.runner';
import { buildApplication } from './build/build.runner';
import { CliContext } from '../server/cli.context';

export type CliRunner = (context: CliContext, ...params: string[]) => Promise<void | any>;

export const Runner = Object.freeze({
  start: startApplication,
  build: buildApplication,
});
