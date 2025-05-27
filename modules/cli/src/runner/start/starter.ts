import { CliContext, CliProject } from '../../server/cli.context';
import { resolve } from 'path';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { ConsoleCommand, launcher } from '../../launcher';
import { StartParameter } from './start.runner';
import { Parameters } from '../runner.helper';

export abstract class Starter {
  protected folderRunner: string;
  protected readonly root: string;

  protected constructor(
    protected readonly context: CliContext,
    protected readonly project: CliProject,
    protected readonly rootProject: string
  ) {
    this.root = resolve(rootProject, this.project.location.root);
    this.folderRunner = resolve(this.root, 'target');
  }

  static from(context: CliContext, rootProject: string, project: string): Starter {
    if (context.type === 'application') {
      return new ApplicationStarter(context, context, rootProject);
    }
    return new LibraryStarter(context, context.projects[project], rootProject);
  }

  start(_: Parameters<StartParameter>['cli'], ...params: string[]) {
    const main = (JSON.parse(readFileSync(resolve(this.root, 'package.json'), 'utf8')).main as string) ?? 'index.ts';
    return launcher
      .cwd(this.folderRunner)
      .bin('node')
      .launch(main.slice(0, main.lastIndexOf('.')) + '.js', ...params);
  }
}

class ApplicationStarter extends Starter {}

interface RequireMapper {
  from: string;
  to: (rollback: number) => string;
}

export class LibraryStarter extends Starter {
  start(parameters: Parameters<StartParameter>['cli'], ...params: string[]): Promise<ConsoleCommand> {
    this.folderRunner = this.replaceRequireProvideInsideProject(this.context.projects);
    return super.start(parameters, ...params);
  }

  private replaceRequireProvideInsideProject(projects: CliContext['projects']) {
    const mapper = this.createMapperRequire(projects);
    const runner = resolve(this.root, 'target', this.project.location.root);
    const folders = new Set([
      {
        path: runner,
        rollback: 1
      }
    ]);
    const iterator = folders.values();
    let current = iterator.next();
    while (!current.done) {
      const parent = current.value;
      readdirSync(parent.path, { encoding: 'utf-8', withFileTypes: true }).forEach(file => {
        if (file.isDirectory() && file.name != 'node_modules') {
          folders.add({
            path: resolve(parent.path, file.name),
            rollback: parent.rollback + 1
          });
        } else if (file.name.endsWith('.js')) {
          this.replaceRequireByLocalPath(resolve(parent.path, file.name), mapper, parent.rollback);
        }
      });
      current = iterator.next();
    }
    return runner;
  }

  private replaceRequireByLocalPath(jsFile: string, mapper: RequireMapper[], rollback: number) {
    let content = readFileSync(jsFile, 'utf-8');
    mapper.forEach(mapping => (content = content.replaceAll(mapping.from, mapping.to(rollback))));
    writeFileSync(jsFile, content, { encoding: 'utf-8' });
  }

  private createMapperRequire(projects: CliContext['projects']): RequireMapper[] {
    return Object.values(projects).reduce((acc, project) => {
      const json = JSON.parse(
        readFileSync(resolve(this.rootProject, project.location.root, 'package.json'), { encoding: 'utf-8' })
      );
      const name = json.name;
      acc.push({
        from: `= require("${name}")`,
        to: (rollback: number) => `= require("${'../'.repeat(rollback)}${project.location.root}/src")`
      });
      return acc;
    }, [] as RequireMapper[]);
  }
}
