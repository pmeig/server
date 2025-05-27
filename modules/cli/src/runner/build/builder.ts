import { CliContext, CliProject } from '../../server/cli.context';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { copyFileSync, createReadStream, readdirSync, unlinkSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { ConsoleCommand, launcher } from '../../launcher';
import { glob } from 'fast-glob';
import { BuildParameter } from './build.runner';
import { Parameters } from '../runner.helper';

export abstract class Builder {
  constructor(
    protected readonly context: CliProject,
    protected readonly rootProject: string
  ) {}

  static from(context: CliContext, rootProject: string, project: string): Builder {
    const cliProject = context.projects?.[project];
    if (cliProject) {
      if (cliProject.type === 'application') {
        return new ApplicationBuilder(cliProject, rootProject);
      }
      return new LibraryBuilder(cliProject, rootProject);
    }
    return new NoopBuilder(
      {
        location: {
          root: ''
        },
        assets: [],
        type: 'noop'
      },
      rootProject
    );
  }

  async build(_: Parameters<BuildParameter>['cli'], ...options: string[]): Promise<ConsoleCommand> {
    const root = resolve(this.rootProject, this.context.location.root);
    const executor = launcher.cwd(root);
    const command = await executor.launch('tsc', ...options);
    let result = Promise.resolve(command);
    if (!command.exception && this.context.assets.length > 0) {
      const outDirConsole = await executor.launch('tsc', '--showConfig', ...options);
      const outDir = JSON.parse(outDirConsole.success[0]).compilerOptions.outDir;
      const outDirPath = resolve(root, outDir);
      const copies = this.context.assets.map(asset => {
        return glob(asset, {
          cwd: root
        }).then(files => {
          files.forEach(file => {
            const outFile = resolve(outDirPath, file.slice(file.indexOf('/') + 1));
            mkdirSync(dirname(outFile), { recursive: true });
            copyFileSync(resolve(root, file), outFile);
          });
        });
      });
      result = Promise.all(copies).then(() => command);
    }
    return result;
  }
}

class ApplicationBuilder extends Builder {
  async build(parameters: Parameters<BuildParameter>['cli'], ...options: string[]): Promise<ConsoleCommand> {
    const prepare = await super.build(parameters, ...options);
    if (prepare.error.length === 0 && !prepare.exception && typeof parameters.prod !== 'undefined') {
      // bundle
      return prepare;
    }
    return prepare;
  }
}

class NoopBuilder extends Builder {
  async build(parameters: Parameters<BuildParameter>['cli'], ...options: string[]): Promise<ConsoleCommand> {
    return Promise.resolve({
      error: [],
      success: []
    });
  }
}

class LibraryBuilder extends Builder {
  private regex = new RegExp(`^export [*] from .*;$`);

  constructor(context: CliProject, rootProject: string) {
    super(context, rootProject);
    context.assets = [...new Set([...context.assets, 'package.json'])];
  }

  async build(parameters: Parameters<BuildParameter>['cli'], ...options: string[]): Promise<ConsoleCommand> {
    const prepare = await super.build(parameters, ...options);
    if (!prepare.exception && prepare.error.length === 0 && typeof parameters.prod !== 'undefined') {
      const src = resolve(this.rootProject, this.context.location.root);
      const outDirConsole = await launcher.cwd(src).launch('tsc', '--showConfig', ...options);
      const outDir = JSON.parse(outDirConsole.success[0]).compilerOptions.outDir;
      const outDirPath = resolve(src, outDir);
      await this.exposeOnlyPublicApi(outDirPath);
    }
    return prepare;
  }

  private async exposeOnlyPublicApi(path: string) {
    const typings = (JSON.parse(readFileSync(resolve(path, 'package.json'), 'utf-8')).typings ?? 'index.ts') as string;
    if (existsSync(resolve(path, typings))) {
      const keep = new Set<string>();
      await this.addFileToKeep(path, typings, keep);
      const keepFiles = Array.from(keep);
      readdirSync(path, {
        encoding: 'utf-8',
        recursive: true,
        withFileTypes: true
      })
        .filter(file => file.isFile() && file.name.endsWith('.d.ts'))
        .map(file => `${file.parentPath ?? path}/${file.name}`.replaceAll('\\', '/'))
        .forEach(file => {
          if (!keepFiles.find(name => file.endsWith(name))) {
            unlinkSync(file);
          }
        });
    }
  }

  private async addFileToKeep(parent: string, name: string, keep: Set<string>) {
    keep.add(name);
    let prefix = '';
    const indexStartName = name.lastIndexOf('/') + 1;
    if (indexStartName > 0) {
      prefix = name.substring(0, indexStartName);
    }
    const files: string[] = [];
    await new Promise((resolve, reject) =>
      this.bufferedReader(`${parent}/${name}`, {
        next: line => {
          if (this.regex.test(line)) {
            const path =
              line
                .substring(line.lastIndexOf(' ') + 1)
                .replaceAll("'", '')
                .replace('./', '')
                .replace(';', '') + '.d.ts';
            files.push(prefix + path);
          }
        },
        complete: () => resolve(files),
        error: error => {
          reject(error);
        }
      })
    );
    return Promise.all(files.map(file => this.addFileToKeep(parent, file, keep)));
  }

  private bufferedReader(
    path: string,
    observer: {
      next: (value: string) => void;
      complete: () => void;
      error: (error: any) => void;
    }
  ) {
    try {
      const rl = createInterface({
        input: createReadStream(path),
        crlfDelay: Infinity
      });
      return new Promise((resolve, reject) => {
        rl.on('line', line => {
          observer.next(line);
        });
        rl.on('close', () => {
          observer.complete();
          resolve(observer);
        });
        rl.on('error', error => {
          observer.error(error);
          reject(error);
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
