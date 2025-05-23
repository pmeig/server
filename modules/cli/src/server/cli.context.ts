import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

export interface CliProject {
  type: 'library' | 'application' | 'noop';
  location: {
    root: string;
  };
  assets: string[];
}

export interface CliContext {
  name: string;
  projects: Record<string, CliProject>;
}

export const findContext = (cwd: string): CliContext | undefined => {
  let context: CliContext | undefined;
  let current = cwd;
  do {
    context = getContext(current);
    current = dirname(current);
  } while (!context && !current.endsWith('\\') && !current.endsWith('/'));
  return context ?? getContext(current);
};

const getContext = (from: string) => {
  const path = resolve(from, 'pmeig.json');
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  return undefined;
};
