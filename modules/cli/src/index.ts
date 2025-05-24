import { findContext } from './server/cli.context';
import { Runner } from './runner/runner';
// import { buildApplication } from './runner/build/build.runner';

const main = async (params: string[]) => {
  console.log('enter');
  const request = params.shift();
  if (request) {
    const contextMetadata = findContext(process.cwd());
    if (contextMetadata.context) {
      params.unshift(contextMetadata.rootProject);
      if (contextMetadata.context.type === 'application') {
        params.unshift('main');
        contextMetadata.context.projects = {
          main: contextMetadata.context,
        };
        if (params.length === 1) {
          const runner = Object.entries(contextMetadata.context.projects)
            .find(([_, value]) => value.type === 'application')
            ?.shift() as string;
          if (runner) {
            params.unshift(runner);
          }
        }
      }
      if (params.length > 0) {
        const runner = Runner[request as keyof typeof Runner];
        if (runner) {
          return runner(contextMetadata.context, ...params);
        }
      }
    }
  }
};

console.log('toto');

(async () => await main(process.argv.slice(2)))();
