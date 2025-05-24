import { CliContext, findContext } from './server/cli.context';
import { Runner } from './runner/runner';

export const Configuration = {
  prod: false,
};

function exposeDefaultParamIfNotGiven(
  params: string[],
  contextMetadata: {
    context: CliContext;
    rootProject: string;
  }
) {
  params.unshift(contextMetadata.rootProject);
  if (contextMetadata.context.type === 'application') {
    params.unshift('main');
    contextMetadata.context.projects = {
      main: contextMetadata.context,
    };
  }
  if (params.length === 1) {
    const runner = Object.entries(contextMetadata.context.projects)
      .find(([_, value]) => value.type === 'application')
      ?.shift() as string;
    if (runner) {
      params.push(runner);
    }
  }
}

const paramsWithoutConfiguration = (params: string[]) => {
  const parameters = [...params];
  const keys = Object.keys(Configuration).map(key => `--${key}`);
  let current = parameters.shift();
  while (current && keys.includes(current)) {
    Configuration[current.replace('--', '')] = true;
    current = parameters.shift();
  }
  if (current) {
    parameters.unshift(current);
  }
  return parameters;
};

const main = async (params: string[]) => {
  const request = params.shift();
  if (request) {
    params = paramsWithoutConfiguration(params);
    const contextMetadata = findContext(process.cwd());
    if (contextMetadata.context) {
      exposeDefaultParamIfNotGiven(
        params,
        contextMetadata as {
          context: CliContext;
          rootProject: string;
        }
      );
      if (params.length > 1) {
        const runner = Runner[request as keyof typeof Runner];
        if (runner) {
          return runner(contextMetadata.context, ...params);
        }
      }
    }
  }
};

(async () => await main(process.argv.slice(2)))();
