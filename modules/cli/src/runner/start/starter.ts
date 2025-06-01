import { CliContext, CliProject } from '../../server/cli.context';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { ConsoleCommand, launcher } from '../../launcher';
import { StartParameter } from './start.runner';
import { findAliases, Parameters, RunnerAlias } from '../runner.helper';
import { BuildParameter } from '../build/build.runner';
import { browseDir, readJson, updateContent } from '../../helper/io.helper';
import { Builder } from '../build/builder';

export abstract class Starter {
  protected folderRunner: string;
  protected readonly root: string;

  protected constructor(
    protected readonly context: CliContext,
    protected readonly project: CliProject,
    protected readonly rootProject: string,
    protected readonly name: string
  ) {
    this.root = resolve(rootProject, this.project.location.root);
    this.folderRunner = resolve(this.root, 'target');
  }

  static from(context: CliContext, rootProject: string, project: string): Starter {
    if (context.type === 'application') {
      return new ApplicationStarter(context, context, rootProject, project);
    }
    return new LibraryStarter(context, context.projects[project], rootProject, project);
  }

  start(_: Parameters<StartParameter>['cli'], ...params: string[]) {
    const main = (JSON.parse(readFileSync(resolve(this.root, 'package.json'), 'utf8')).main as string) ?? 'index.ts';
    const exec = resolve(this.folderRunner, main.slice(0, main.lastIndexOf('.')) + '.js');
    return launcher
      .cwd(this.root)
      .bin('node')
      .print()
      .launch(exec, ...params);
  }
}

class ApplicationStarter extends Starter {}

interface RequireMapper {
  from: string;
  to: string;
}

export class LibraryStarter extends Starter {
  async start(parameters: Parameters<BuildParameter>['cli'], ...params: string[]): Promise<ConsoleCommand> {
    const dependencies = await this.buildRequiredDependencies(this.context.projects);
    this.folderRunner = resolve(dependencies.runner, this.project.location.root);
    this.linkImportForProject(dependencies.dependencies, dependencies.aliases);
    return super.start(parameters, ...params);
  }

  private async buildRequiredDependencies(projects: CliContext['projects']) {
    const runner = resolve(this.root, 'target');
    const aliases = findAliases(projects, this.rootProject);
    const dependencies = this.retrieveDependencies(aliases);
    await this.buildDependencies(dependencies, aliases);
    return {
      dependencies,
      runner,
      aliases
    };
  }

  private buildDependencies(dependencies: string[], aliases: Record<string, RunnerAlias>) {
    const npm = launcher.bin('npm');
    return Promise.all(
      dependencies.map(async depend => {
        const config = aliases[depend];
        if (config) {
          await Builder.from(this.context, this.rootProject, config.name).build(
            { prod: [] },
            '--outDir',
            './target',
            '--sourceMap',
            'true'
          );
          return npm.cwd(resolve(this.root, config.path, 'target')).launch('install');
        }
        return Promise.resolve();
      })
    );
  }

  private retrieveDependencies(aliases: Record<string, RunnerAlias>) {
    const dependencies = readJson(resolve(this.root, 'package.json')).dependencies ?? {};
    return Object.keys(dependencies).filter(key => !!aliases[key]);
  }

  private linkImportForProject(dependencies: string[], aliases: Record<string, RunnerAlias>) {
    const mapping = dependencies
      .map(depend => {
        const config = aliases[depend];
        if (config) {
          return {
            from: `= require("${config.project}")`,
            to: `= require("${resolve(this.root, config.path, 'target').replaceAll('\\', '/')}")`
          } as RequireMapper;
        }
        return undefined;
      })
      .filter(value => !!value) as RequireMapper[];
    dependencies.unshift(this.folderRunner);
    dependencies.forEach(folder => {
      const config = aliases[folder];
      browseDir(config ? resolve(this.root, config.path, 'target') : folder, {
        file: file => {
          if (file.endsWith('.js')) {
            updateContent(file, content => {
              mapping.forEach(mapper => (content = content.replaceAll(mapper.from, mapper.to)));
              return content;
            });
          }
          return false;
        }
      });
    });
  }
}
