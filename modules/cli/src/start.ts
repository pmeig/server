import { Command } from './command';
import { readdirSync, readFileSync, writeFileSync } from 'fs';

export const starterApplication = async (...params: string[]) => {
  const command = new Command();
  console.log(params[0]);
  await command.launch('tsc');
  readdirSync('./dist/runner').forEach(file => {
    if (file.endsWith('.js')) {
      const path = `./dist/runner/${file}`;
      const content = readFileSync(path, 'utf8');
      writeFileSync(path, content.replaceAll(/require\('@server/g, "require('../modules"));
    }
  });
  return command.launch(`node dist/runner/${params[0]}.js`);
};
