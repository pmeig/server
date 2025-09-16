import { CliContext, CliProject } from '../../server/cli.context';
import { dirname, resolve } from 'path';
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync
} from 'fs';
import { createInterface } from 'node:readline';
import { ConsoleCommand, launcher } from '../../launcher';
import { glob } from 'fast-glob';
import { BuildParameter } from './build.runner';
import { Parameters } from '../runner.helper';
import { readJson, updateContent, updateJson } from '../../helper/io.helper';

interface BuildProjectContext {
  name: string;
  version: string;
  module: string;
  path: string
}

export abstract class Builder {
  protected isProd = false;
  constructor(
    protected readonly context: CliProject,
    protected readonly rootProject: string,
    protected readonly projects: Record<string, BuildProjectContext> = {}
  ) {}

  static from(context: CliContext, rootProject: string, project: string): Builder {
    const cliProject = context.projects?.[project];
    if (cliProject) {
      const anotherProject = Builder.retrieveProjectNameVersion(rootProject, context.projects);
      if (cliProject.type === 'application') {
        return new ApplicationBuilder(cliProject, rootProject, anotherProject);
      }
      return new LibraryBuilder(cliProject, rootProject, anotherProject);
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

  private static retrieveProjectNameVersion(rootProject: string, projects?: Record<string, CliProject>) {
    return Object.entries(projects ?? {}).reduce((acc, [name, context]) => {
      const json = readJson(resolve(rootProject, context.location.root, 'package.json'));
      const item = {
        name,
        version: json.version,
        module: json.name,
        path: context.location.root
      }
      acc[item.module] = item;
      acc[name] = item;
      return acc;
    }, {} as Record<string, BuildProjectContext>)
  }

  async build(_: Parameters<BuildParameter>['cli'], ...options: string[]): Promise<ConsoleCommand> {
    const root = resolve(this.rootProject, this.context.location.root);
    this.isProd = options.includes('--prod');
    let command;
    let outDirPath;
    try {
      const executor = launcher.cwd(root);
      const outDirConsole = await executor.launch('tsc', '--showConfig', ...options);
      const json = this.linesToJson(outDirConsole.success);
      const outDir = JSON.parse(json || '{}').compilerOptions.outDir;
      if (!outDir) {
        throw new Error('No outDir found');
      }
      outDirPath = resolve(root, outDir);
      this.removeDist(outDirPath);
      command = await executor.launch('tsc', ...options);
    } catch (error) {
      console.error(error.message);
      throw error;
    }

    let result = Promise.resolve(command);
    if (command.code === 0 && this.context.assets.length > 0) {
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
      result = Promise.all(copies).then(() => {
        updateJson(resolve(outDirPath, 'package.json'), content => {
          content.scripts = undefined;
          content.dependencies = this.exposeVersionOfInternalDependencies(content.dependencies);
          content.devDependencies = this.exposeVersionOfInternalDependencies(content.devDependencies);
          content.peerDependencies = this.exposeVersionOfInternalDependencies(content.peerDependencies);
          return content;
        });
        return command;
      })
    }
    return result.catch(error => {
      console.error(error.message);
      throw error;
    });
  }

  private removeDist(outDirPath: string) {
    if (existsSync(outDirPath)) {
      readdirSync(outDirPath, {
        withFileTypes: true,
        encoding: 'utf-8'
      }).forEach(file => {
        if (file.isDirectory()) {
          if (file.name !== 'node_modules') {
            rmSync(resolve(outDirPath, file.name), { recursive: true, force: true });
          }
        } else {
          unlinkSync(resolve(outDirPath, file.name));
        }
      });
    }
  }

  private exposeVersionOfInternalDependencies(dependencies?: Record<string, string>) {
    if (!dependencies) return undefined;
    let removeSnapshot = (version: string) => version;
    if (this.isProd) {
      removeSnapshot = (version: string) => {
        return version.replace(/-SNAPSHOT$/, '');
      }
    }
    return Object.entries(dependencies).reduce(
      (acc, [key, value]) => {
        const context = this.projects[key];
        acc[key] = context ? `^${removeSnapshot(context.version)}` : value;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  protected linesToJson(lines: string[]) {
    let start = lines[0];
    while (lines.length > 0 && !['{', '['].some(value => start.startsWith(value))) {
      lines.shift();
      start = lines[0];
    }
    if (lines.length > 0) {
      let end = lines[lines.length - 1].replace('\r', '');
      const compare = start === '{' ? '}' : ']';
      while (lines.length > 0 && !end.endsWith(compare)) {
        lines.pop();
        end = lines[lines.length - 1].replace('\r', '');
      }
    }
    return lines.join('');
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
  async build(_parameters: Parameters<BuildParameter>['cli'], ..._options: string[]): Promise<ConsoleCommand> {
    return Promise.resolve({
      error: [],
      success: [],
      code: 0
    });
  }
}

class LibraryBuilder extends Builder {
  private regex = new RegExp(`^export [*] from .*;$`);

  constructor(context: CliProject, rootProject: string, projects: Record<string, BuildProjectContext> = {}) {
    super(context, rootProject, projects);
    context.assets = [...new Set([...context.assets, 'package.json', 'readme.md', 'README.md'])];
  }

  async build(parameters: Parameters<BuildParameter>['cli'], ...options: string[]): Promise<ConsoleCommand> {
    const prepare = await super.build(parameters, ...options);
    if (prepare.code === 0 && typeof parameters.prod !== 'undefined') {
      const src = resolve(this.rootProject, this.context.location.root);
      const outDirConsole = await launcher.cwd(src).launch('tsc', '--showConfig', ...options);
      const json = this.linesToJson(outDirConsole.success);
      const outDir = JSON.parse(json || '{}').compilerOptions?.outDir;
      if (!outDir) {
        throw new Error('No outDir found');
      }
      const outDirPath = resolve(src, outDir);
      await this.exposeOnlyPublicApi(outDirPath);
      updateJson(resolve(outDirPath, 'package.json'), content => {
        content.scripts = undefined;
        return content;
      });
      updateContent(resolve(outDirPath, 'package.json'), content =>
        content.replaceAll('src/index.d.ts', 'index.d.ts').replaceAll('src/index.js', 'index.js')
      );
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

  private async addFileToKeep(parent: string, name: string, keep: Set<string>): Promise<any> {
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
