import { CliContext } from '../server/cli.context';

export interface ParameterConfiguration {
  indexes: number;
  alias?: string[];
  tilde?: 'double' | 'single';
  position?: number;
  default?: any;
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
      if (typeof value.position !== 'undefined') {
        acc[value.position] = config;
      }
      return acc;
    },
    {} as Record<
      string | number,
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
  const parameters = {
    root: [''],
    prefix: [''],
    destination: ['']
  } as Record<keyof T, string[]>;
  const mapper = createParameterMapper(configurations);
  const command: string[] = [];
  let indexWithoutParameterNamed = 0;
  while (max-- > 0) {
    const value = args[max];
    let byIndexes = true;
    let config = projects[value]
      ? {
          indexes: 0,
          key: 'projects'
        }
      : mapper[value];
    if (!config) {
      byIndexes = false;
      config = mapper[max - indexWithoutParameterNamed];
    }
    if (config) {
      let adjust = byIndexes ? config.indexes : 0;
      indexWithoutParameterNamed = adjust + (byIndexes ? 1 : 0);
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
        const argument = command.shift()!;
        content.unshift(argument);
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
