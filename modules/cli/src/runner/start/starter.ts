import { CliContext, CliProject } from '../../server/cli.context';
import { resolve } from 'path';
import { readFileSync } from 'fs';
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
      .print()
      .launch(main.slice(0, main.lastIndexOf('.')) + '.js', ...params);
  }
}

class ApplicationStarter extends Starter {}

export class LibraryStarter extends Starter {
  start(parameters: Parameters<StartParameter>['cli'], ...params: string[]): Promise<ConsoleCommand> {
    this.folderRunner = resolve(this.root, 'target');
    return super.start(parameters, ...params);
  }
}
