import { existsSync, readdirSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import { basename, resolve } from 'path';
import { PropertiesFile } from '../properties.type';
import { mergeRecord } from './properties.helper';
import * as process from 'node:process';

export const readProperties = <T extends Record<string, any> = Record<string, any>>(path: string) => {
  const content = readFileSync(path, 'utf-8');
  return load(content) as T;
};

const createUpdaterEnv = (env: {}, keys: string[]) => {
  const key = keys.pop()!;
  let updater = (value: any, parent: Record<string, any>) => {
    parent[key] = value;
    return parent;
  };
  let origin = env;
  keys.forEach(key => {
    origin = origin[key];
    const memoryUpdater = updater;
    updater = (value, parent) => {
      parent[key] = memoryUpdater(value, origin ?? {});
      return parent;
    };
  });
  return updater;
};

export const readEnv = <T extends Record<string, any> = Record<string, any>>(path: string) => {
  const content = readFileSync(path, 'utf-8');
  return content
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .reduce(
      (acc, line) => {
        const [key, value] = line.split('=');
        const keys = key.split('.');
        const updater = createUpdaterEnv(acc, keys);
        acc = updater(value, acc);
        return acc;
      },
      {} as Record<string, any>
    ) as T;
};

export const readAllProperties = <T extends Record<string, any> = Record<string, any>>(
  type: 'app' | 'bootstrap',
  profiles: string[],
  location: string
): PropertiesFile<T> => {
  if (!existsSync(location)) {
    return {
      properties: {} as T,
      sources: [] as string[]
    };
  }
  const mainFiles = toFileYamlExtensionAccepted(type);
  const accepted = mainFiles.concat(profiles.flatMap(profile => toFileYamlExtensionAccepted(`${type}-${profile}`)));
  const folders = [location];
  const sources: string[] = [];
  let properties: Record<string, any> = {};
  while (folders.length > 0) {
    const parent = folders.shift()!;
    properties = readdirSync(parent, { encoding: 'utf-8', withFileTypes: true })
      .map(dirent => {
        const path = resolve(parent, dirent.name);
        if (dirent.isDirectory()) {
          folders.push(path);
          return undefined;
        }
        if (accepted.includes(dirent.name)) return path;
        return undefined;
      })
      .filter(path => !!path)
      .sort(path => {
        const name = basename(path!);
        return profiles.indexOf(name.split('.')[0].split('-')[1]);
      })
      .reduce((acc, file) => {
        acc = mergeRecord(acc, readProperties(file!));
        sources.push(file!);
        return acc;
      }, properties);
  }
  return {
    properties: properties as T,
    sources
  };
};

export const readAllEnv = <T extends Record<string, any> = Record<string, any>>(
  profiles: string[]
): PropertiesFile<T> => {
  const fileNames = ['.env', ...profiles.map(profile => profile + '.env')];
  const sources: string[] = [];
  const env = process.env;
  const properties = readdirSync('.', { encoding: 'utf-8', withFileTypes: true })
    .filter(dirent => dirent.isFile() && fileNames.includes(dirent.name))
    .sort(dirent => {
      const profile = dirent.name.split('.')[0];
      return profiles.indexOf(profile);
    })
    .reduce(
      (acc, dirent) => {
        const newEnv = readEnv(dirent.name);
        acc = mergeRecord(acc, newEnv);
        return acc;
      },
      {} as Record<string, any>
    ) as T;
  return {
    properties: mergeRecord({ ...env }, properties) as T,
    sources
  };
};

const toFileYamlExtensionAccepted = (name: string) => {
  return ['yaml', 'yml'].map(extension => `${name}.${extension}`);
};
