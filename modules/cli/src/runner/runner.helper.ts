import { CliContext } from '../server/cli.context';
import { readJson } from '../helper/io.helper';
import { resolve } from 'path';

export interface ParameterConfiguration {
  indexes: number;
  alias?: string[];
  tilde?: 'double' | 'single';
}

export type RunnerParameterConfiguration = Record<string, ParameterConfiguration>;

export interface RunnerAlias {
  path: string;
  name: string;
  project: string;
  root: string;
}

export interface Parameters<T extends RunnerParameterConfiguration> {
  cli: Record<keyof T | 'projects', string[]>;
  command: string[];
}

const createParameterMapper = <T extends RunnerParameterConfiguration>(configurations: T) => {
  return Object.entries(configurations).reduce(
    (acc, [key, value]) => {
      let alias = key;
      if (value.tilde) {
        alias = value.tilde === 'double' ? `--${key}` : `-${key}`;
      }
      const config = {
        key,
        indexes: value.indexes
      };
      acc[alias] = config;
      value.alias?.forEach(anotherKey => {
        acc[anotherKey] = config;
      });
      return acc;
    },
    {} as Record<
      string,
      {
        key: keyof T;
        indexes: number;
      }
    >
  );
};

export const extractParameters = <T extends RunnerParameterConfiguration>(
  args: string[],
  configurations: T,
  projects: CliContext['projects']
): Parameters<T> => {
  let max = args.length;
  const numberArguments = max;
  const parameters = {} as Record<keyof T, string[]>;
  const mapper = createParameterMapper(configurations);
  const command: string[] = [];
  while (max-- > 0) {
    const value = args[max];
    const config = projects[value]
      ? {
          indexes: 0,
          key: 'projects'
        }
      : mapper[value];
    if (config) {
      let adjust = config.indexes;
      if (max + adjust > numberArguments) {
        throw new Error(
          `Missing argument for ${config.key.toString()}, expected ${config.indexes} but got ${numberArguments - max} instead.`
        );
      }
      const content: string[] = parameters[config.key] ?? [];
      if (adjust === 0) {
        content.push(args[max]);
      }
      while (adjust > 0) {
        command.shift();
        content.unshift(args[max + adjust--]);
        adjust--;
      }
      parameters[config.key] = content;
    } else command.unshift(value);
  }
  return {
    cli: parameters,
    command
  };
};

export const findAliases = (projects: CliContext['projects'], root: string) =>
  Object.entries(projects).reduce(
    (acc, [name, cliProject]) => {
      const path = resolve(root, cliProject.location.root);
      const projectName = readJson(resolve(path, 'package.json')).name;
      const item = {
        project: projectName,
        name,
        path,
        root: cliProject.location.root
      };
      [name, projectName, cliProject.location.root].forEach(key => {
        acc[key] = item;
      });
      return acc;
    },
    {} as Record<string, RunnerAlias>
  );
