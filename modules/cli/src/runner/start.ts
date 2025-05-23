import { command } from '../command';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { CliContext } from '../server/cli.context';
import { CliRunner } from './runner';
import { Builder } from './build/builder';
import { basename, resolve } from 'path';

export const startApplication: CliRunner = async (context: CliContext, project: string, ...params: string[]) => {
  const cliProject = context.projects[project];
  if (!cliProject || cliProject.type !== 'application') {
    return;
  }
  await Builder.from(context, project, ...params).build('--outDir', './target');
  // just use location.root for each project to retrieve in target
  const mapper = replaceRequireProvideInsideProject(cliProject.location.root, context.projects);
  return command.cwd(projectRoot).launch('node', './target/index.js', ...params);
};

const findProjectRoot = (root: string) => {
  let rootPath: string | undefined = undefined;
  const name = basename(root);
  const folders = new Set<string>([root]);
  let current = folders.values().next();
  while (!rootPath && !current.done) {
    const path = current.value;
    const packageJson = resolve(path, 'package.json');
    const hasPackageJson = existsSync(packageJson);
    if (hasPackageJson && basename(path) === name) {
      rootPath = path;
    }
    if (!hasPackageJson) {
      readdirSync(path, {
        encoding: 'utf-8',
        withFileTypes: true,
      }).forEach(file => {
        if (file.isDirectory()) {
          folders.add(resolve(path, file.name));
        }
      });
    }
    current = folders.values().next();
  }
  return rootPath;
};

const replaceRequireProvideInsideProject = (projectRoot: string, projects: CliContext['projects']) => {
  const mapper = createMapperRequire(projects);
};

const createMapperRequire = (projects: CliContext['projects']): Record<string, string> => {
  return Object.values(projects).reduce((acc, project) => {
    const json = JSON.parse(readFileSync(resolve(project.location.root, 'package.json'), { encoding: 'utf-8' }));
    const name = json.name;
    const main = (json.main as string) ?? 'index.js';
    acc[`require("${name}")`] = `../${project.location.root}/src/${main.slice(0, main.lastIndexOf('.'))}.js`;
    return acc;
  }, {});
};
