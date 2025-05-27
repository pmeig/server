import { existsSync, readFileSync, writeFileSync } from 'fs';
import { readdirSync } from 'node:fs';
import { dump, load } from 'js-yaml';
import { dirname } from 'path';

export const readJson = <T extends Record<string, any> = Record<string, any>>(path: string) =>
  JSON.parse(readFileSync(path, 'utf8')) as T;

export const writeJson = (path: string, data: Record<string, any>) => {
  const json = JSON.stringify(data, null, 2);
  writeFileSync(path, json);
};

export const updateJson = <T extends Record<string, any> = Record<string, any>>(
  path: string,
  data: (value: T) => Partial<T>
) => {
  const json = readJson<T>(path);
  writeJson(path, {
    ...json,
    ...data(json)
  });
};

export const updateYaml = <T extends Record<string, any> = Record<string, any>>(
  path: string,
  data: (value: T) => Partial<T>
) => {
  const yaml = readYaml<T>(path);
  writeYaml(path, {
    ...yaml,
    ...data(yaml)
  });
};

export const browseDir = (
  path: string,
  handler: {
    file?: (file: string) => void;
    folder?: (folder: string) => void;
    continue?: (path: string) => boolean;
  } = {
    file: () => {},
    folder: () => {},
    continue: () => true
  }
) => {
  const use = {
    file: handler.file || (() => {}),
    folder: handler.folder || (() => {}),
    continue: handler.continue || (() => true)
  };
  const folders = [path];
  const contents = {
    files: [] as string[],
    folders: [] as string[]
  };
  if (existsSync(path)) {
    let continueBrowse = true;
    while (continueBrowse && folders.length > 0) {
      const folder = folders.pop()!;
      readdirSync(folder, { encoding: 'utf-8', withFileTypes: true }).forEach(file => {
        if (file.isDirectory()) {
          contents.folders.push(file.name);
          use.folder(`${folder}/${file.name}`);
          folders.push(`${folder}/${file.name}`);
        } else {
          contents.files.push(file.name);
          use.file(`${folder}/${file.name}`);
        }
        continueBrowse = use.continue(`${folder}/${file.name}`);
      });
    }
  }
  return contents;
};

export const findFile = <T = any>(path: string, test: (folder: string) => T) => {
  let found: T | undefined;
  let parent = path;
  while (!found && dirname(parent) !== parent) {
    found = test(parent);
    parent = dirname(parent);
  }
  return found ?? test(path);
};

export const readYaml = <T extends Record<string, any> = Record<string, any>>(path: string) => {
  const content = readFileSync(path, 'utf8');
  return load(content) as T;
};

export const writeYaml = (path: string, record: Record<string, any>) => {
  const content = dump(record, {
    indent: 2
  });
  writeFileSync(path, content);
};

export const updateContent = (path: string, update: (content: string) => string) => {
  const content = readFileSync(path, 'utf8');
  writeFileSync(path, update(content));
};
