import { buildApplication } from './build/build.runner';
import { CliContext } from '../server/cli.context';
import { ParameterConfiguration, RunnerParameterConfiguration } from './runner.helper';
import { addApplication } from './add/add.runner';
import { newApplication } from './new/create.runner';

export type CliRunner<T extends RunnerParameterConfiguration> = (
  context: CliContext,
  parameters: Record<keyof T, string[]>,
  rootProject?: string,
  ...params: string[]
) => Promise<void | any>;

export interface Runnable<T extends Record<string, ParameterConfiguration>> {
  run: CliRunner<T>;
  parameters: T;
}

export const Runner: Readonly<Record<string, Runnable<any>>> = Object.freeze({
  build: buildApplication,
  add: addApplication,
  generate: addApplication,
  g: addApplication,
  a: addApplication,
  ['+']: addApplication,
  new: newApplication,
  create: newApplication,
  ['++']: newApplication,
  n: newApplication,
  c: newApplication
});
