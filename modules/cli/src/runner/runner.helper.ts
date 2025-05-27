export interface ParameterConfiguration {
  indexes: number;
  alias?: string[];
  tilde?: 'double' | 'single';
}

export type RunnerParameterConfiguration = Record<string, ParameterConfiguration>;

export interface Parameters<T extends RunnerParameterConfiguration> {
  cli: Record<keyof T, string[]>;
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
  configurations: T
): Parameters<T> => {
  let max = args.length;
  const numberArguments = max;
  const parameters = {} as Record<keyof T, string[]>;
  const mapper = createParameterMapper(configurations);
  const command: string[] = [];
  while (max-- > 0) {
    const value = args[max];
    const config = mapper[value];
    if (config) {
      let adjust = config.indexes;
      if (max + adjust > numberArguments) {
        throw new Error(
          `Missing argument for ${config.key.toString()}, expected ${config.indexes} but got ${numberArguments - max} instead.`
        );
      }
      const content: string[] = [];
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
