import { CliContext, findContext } from './server/cli.context';
import { Runner } from './runner/runner';
import { extractParameters } from './runner/runner.helper';
import { exit } from 'node:process';

export const NoopContext: CliContext = {
  type: 'noop',
  name: 'noop',
  projects: {},
  architecture: {},
  location: {
    root: ''
  },
  assets: []
};

const main = async (params: string[]) => {
  const request = params.shift();
  if (request) {
    const contextMetadata = findContext(process.cwd());
    if (contextMetadata.context) {
      if (contextMetadata.context.type === 'application') {
        contextMetadata.context.projects['main'] = contextMetadata.context;
        params.unshift('main');
      } else if (params.length === 0) {
        params.unshift(
          (Object.entries(contextMetadata.context.projects ?? {}).find(
            ([_, project]) => project.type === 'application'
          ) ?? ['main'])[0]
        );
      }
    }
    const runner = Runner[request as keyof typeof Runner];
    if (runner) {
      const parameters = extractParameters(params, runner.parameters,
        contextMetadata.context?.projects ?? {}, contextMetadata.context?.architecture ?? {});
      return runner.run(
        contextMetadata.context ?? NoopContext,
        parameters.cli,
        contextMetadata.rootProject,
        ...parameters.command
      );
    }
  }
};

(async () => await main(process.argv.slice(2))
  .then(() => exit(0))
  .catch(error => {
    console.error(error);
    exit(1);
  }))();
