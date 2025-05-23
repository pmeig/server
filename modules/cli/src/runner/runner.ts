import { startApplication } from './start';
import { CliContext } from '../server/cli.context';
import { buildApplication } from './build/build';

export type CliRunner = (context: CliContext, ...params: string[]) => Promise<void | any>;

export const Runner = Object.freeze({
  start: startApplication,
  build: buildApplication,
});
