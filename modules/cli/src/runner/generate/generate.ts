import { existsSync, mkdirSync } from 'fs';
import { CliContext } from '../../server/cli.context';
import { dirname, resolve, basename } from 'path';
import { copyFileSync } from 'node:fs';
import { GeneratorParameters } from './generate.runner';
import { Parameters } from '../runner.helper';
import {
  browseDir,
  findFile,
  readJson,
  updateContent,
  updateJson,
  updateYaml,
  writeJson
} from '../../helper/io.helper';
import { launcher } from '../../launcher';

const templates = resolve(dirname(process.argv[1]), 'runner', 'generate', 'templates');
const fileImportReference = Object.freeze({
  service: '@server/mvc',
  component: '@server/core',
  configuration: '@server/core',
  controller: '@server/mvc',
  properties: '@server/properties'
});

export abstract class Generator {
  constructor(
    protected readonly type: keyof Omit<CliContext['architecture'], 'prefix'>,
    protected readonly rootProject: string,
    protected readonly location: string,
    protected readonly name: string
  ) {}

  static from(type: keyof Omit<CliContext['architecture'], 'prefix'>, rootProject: string, project: string): Generator {
    switch (type) {
      case 'library':
      case 'application':
        return new ModuleGenerator(type, rootProject, process.cwd(), project);
      default:
        if (!Object.keys(fileImportReference).includes(type)) {
          return new NoopGenerator(type);
        }
        return new FileGenerator(type, rootProject, process.cwd(), project);
    }
  }

  write(
    context: CliContext,
    parameters: Parameters<GeneratorParameters>['cli'],
    rootProject: string,
    ...params: string[]
  ) {
    const configuration = context.architecture[this.type];
    return this.generate(
      context,
      resolve(
        parameters.destination
          ? resolve(rootProject, parameters.destination[0])
          : configuration?.root
            ? resolve(rootProject, configuration.root)
            : this.location,
        this.name
      ),
      parameters.prefix?.[0] ?? configuration?.prefix ?? '',
      ...params
    );
  }

  protected abstract generate(context: CliContext, path: string, prefix: string, ...params: string[]): Promise<void>;
}

class NoopGenerator extends Generator {
  constructor(type: keyof Omit<CliContext['architecture'], 'prefix'>) {
    super(type, '', '', '');
  }

  protected generate(_context: CliContext, _path: string, _prefix: string, ..._params: string[]): Promise<void> {
    throw new Error(`Is impossible to generate ${this.type}, only ${Object.keys(fileImportReference)}`);
  }

  write(
    context: CliContext,
    _parameters: Parameters<GeneratorParameters>['cli'],
    _rootProject: string,
    ...params: string[]
  ): Promise<void> {
    return this.generate(context, '', '', ...params);
  }
}

class FileGenerator extends Generator {
  protected generate(context: CliContext, path: string, prefix: string, ...params: string[]): Promise<void> {
    const nameFile = (!this.name.includes('-') ? this.toTildeName() : this.name).toLowerCase();
    const file = resolve(dirname(path), `${nameFile}.${this.type}.ts`);
    const name = this.name
      .split('-')
      .reduce((acc, fragment) => acc + fragment.slice(0, 1).toUpperCase() + fragment.slice(1));
    copyFileSync(resolve(templates, 'file', 'component.ts.template'), file);
    updateContent(file, content => {
      const decorator = this.type.slice(0, 1).toUpperCase() + this.type.slice(1);
      return content
        .replaceAll('{NAME}', name.slice(0, 1).toUpperCase() + name.slice(1))
        .replaceAll('{DECORATOR}', decorator)
        .replaceAll('{LIBRARY}', fileImportReference[this.type]);
    });
    return Promise.resolve();
  }

  private toTildeName() {
    let tildeName = '';
    let name = this.name;
    let addTilde = () => {
      addTilde = () => tildeName + '-';
      return tildeName;
    };
    while (name.length > 1) {
      const letter = name.charAt(0);
      if (letter.toUpperCase() === letter) {
        const nextLetter = name.charAt(1);
        if (nextLetter.toUpperCase() !== nextLetter) {
          tildeName += addTilde();
        }
      }
      tildeName += letter;
      name = name.slice(1);
    }
    return tildeName + name.charAt(0);
  }
}

class ModuleGenerator extends Generator {
  protected generate(context: CliContext, path: string, prefix: string, ...params: string[]): Promise<void> {
    this.createSrcRoot(path, prefix);
    this.updateConfigWithNewModule(context, path, prefix);
    return launcher
      .cwd(path)
      .launch('install')
      .then(() => {});
  }

  private createSrcRoot(path: string, prefix: string) {
    mkdirSync(dirname(path), { recursive: true });
    const templatePath = resolve(templates, this.type);
    browseDir(templatePath, {
      file: file => {
        const destination = file.replace(templatePath, path).replace('.template', '');
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(file, destination);
      }
    });
    this.updatePackage(path, prefix);
    this.updateTsConfig(path);
  }

  private updateConfigWithNewModule(context: CliContext, path: string, prefix: string) {
    context.projects[this.name] = {
      type: this.type as 'application' | 'library',
      location: {
        root: resolve(path, this.name).replace(this.rootProject, '').replaceAll('\\', '/')
      },
      assets: []
    };
    writeJson(resolve(this.rootProject, 'pmeig-cli.json'), context);
    let pathLibrary = path.replace(this.rootProject, '').replaceAll('\\', '/');
    pathLibrary = pathLibrary.startsWith('/') ? pathLibrary.slice(1) : pathLibrary;
    updateJson(resolve(this.rootProject, 'tsconfig.json'), (tsconfig: Record<string, any>) => {
      const paths = tsconfig.compilerOptions.paths ?? {};
      const name = prefix + this.name;
      paths[name] = [pathLibrary];
      paths[`${name}/src/*`] = [pathLibrary + '/src/*'];
      tsconfig.compilerOptions.paths = paths;
      return tsconfig;
    });
    const workspace = resolve(this.rootProject, 'pnpm-workspace.yaml');
    if (existsSync(workspace)) {
      const packageAdd =
        findFile(path, folder => {
          if (dirname(folder) === this.rootProject) {
            return basename(folder);
          }
        }) + '/*';
      updateYaml(workspace, (yaml: Record<string, any>) => {
        const packages = yaml.packages ?? [];
        if (packages.every(packageName => packageName !== packageAdd)) {
          packages.push(packageAdd);
        }
        yaml.packages = packages;
        return yaml;
      });
    }
  }

  private updatePackage(path: string, prefix: string) {
    const packageJson = readJson(resolve(this.rootProject, 'package.json'));
    updateJson(resolve(path, 'package.json'), json => {
      json.name = prefix + this.name;
      json.keywords = packageJson.keywords ?? [];
      json.license = packageJson.license ?? '';
      json.packageManager = packageJson.packageManager;
      json.author = packageJson.author;
      json.scripts.build = json.scripts.build.replace('{PMEIG_NAME}', this.name);
      Object.keys(json.peerDependencies).forEach(dependency => {
        json.peerDependencies[dependency] = packageJson.dependencies[dependency];
      });
      Object.keys(json.devDependencies).forEach(dependency => {
        json.devDependencies[dependency] = packageJson.devDependencies[dependency];
      });
      return json;
    });
  }

  private updateTsConfig(path: string) {
    let number = -1;
    findFile(path, folder => {
      number++;
      return folder === this.rootProject;
    });
    updateContent(resolve(path, 'tsconfig.json'), content => {
      return content.replaceAll('{ROLLBACK}', '../'.repeat(number)).replace('{NAME}', this.name);
    });
  }
}
