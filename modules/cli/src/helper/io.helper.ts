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
    file?: (file: string) => boolean;
    folder?: (folder: string) => boolean;
    continue?: (path: string) => boolean;
  } = {
    file: () => true,
    folder: () => true,
    continue: () => true
  }
) => {
  const use = {
    file: handler.file || (() => true),
    folder: handler.folder || (() => true),
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
        const path = `${folder}/${file.name}`;
        if (file.isDirectory()) {
          if (use.folder(path)) {
            contents.folders.push(file.name);
            folders.push(`${folder}/${file.name}`);
          }
        } else if (use.file(path)) {
          contents.files.push(path);
        }
        continueBrowse = use.continue(path);
      });
    }
  }
  return contents;
};

export const findFile = <T = any>(path: string, test: (folder: string) => T) => {
  let found: T | undefined;
  let parent = path;
  found = test(parent);
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
