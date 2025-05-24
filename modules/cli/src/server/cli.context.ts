import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

export interface CliProject {
  type: 'library' | 'application' | 'noop';
  location: {
    root: string;
  };
  assets: string[];
}

export interface CliContext extends CliProject {
  name: string;
  projects: Record<string, CliProject>;
}

export const findContext = (cwd: string) => {
  let context: CliContext | undefined;
  let current = `${cwd}/deleted`;
  while (!context && !current.endsWith('\\') && !current.endsWith('/')) {
    current = dirname(current);
    context = getContext(current);
  }
  return {
    context: context ?? getContext(current),
    rootProject: current,
  };
};

const getContext = (from: string) => {
  const path = resolve(from, 'pmeig-cli.json');
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8')) as CliContext;
  }
  return undefined;
};
