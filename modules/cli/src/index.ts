import { Runner } from './runner/runner';
import * as process from 'node:process';
import { findContext } from './server/cli.context';

const main = async (params: string[]) => {
  const request = params.shift();
  if (request) {
    const context = findContext(process.cwd());
    if (context) {
      const runner = Runner[request as keyof typeof Runner];
      if (runner && params.length > 1) {
        return runner(context, ...params);
      }
    }
  }
};

(async () => await main(process.argv.slice(2)))();
