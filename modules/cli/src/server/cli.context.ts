import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { findFile } from '../helper/io.helper';

export interface CliProject {
  type: 'library' | 'application' | 'noop';
  location: {
    root: string;
  };
  assets: string[];
}

export interface CliGenerate {
  prefix?: string;
  root?: string;
}

export interface CliContext extends CliProject {
  name: string;
  projects: Record<string, CliProject>;
  architecture: {
    prefix?: string;
    library?: CliGenerate;
    application?: CliGenerate;
    service?: CliGenerate;
    controller?: CliGenerate;
    properties?: CliGenerate;
  };
}

export const findContext = (cwd: string) => {
  let rootProject = cwd;
  return {
    context: findFile(cwd, folder => {
      rootProject = folder;
      return getContext(folder);
    }),
    rootProject
  };
};

const getContext = (from: string) => {
  const path = resolve(from, 'pmeig-cli.json');
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8')) as CliContext;
  }
  return undefined;
};
