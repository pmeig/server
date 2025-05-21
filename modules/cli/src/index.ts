import { ServerArguments } from './server-arguments';

const main = async (params: string[]) => {
  const request = params.shift();
  if (request) {
    return ServerArguments[request as keyof typeof ServerArguments]?.(...params);
  }
};

(async () => await main(process.argv.slice(2)))();
