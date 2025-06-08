import { Options } from '@swc/core';

const mergeDeep = (target: Options, source: Options | undefined): Options => {
  const newTarget = { ...target };
  if (source) {
    Object.keys(source).forEach(key => {
      if (typeof source[key] === 'object') {
        newTarget[key] = mergeDeep(target[key], source[key]);
      } else {
        newTarget[key] = source[key];
      }
    });
  }
  return newTarget;
};

export const SwcOptions = (options?: Options) =>
  mergeDeep(
    {
      module: {
        type: 'es6'
      },
      sourceMaps: true,
      filename: 'index.js',
      jsc: {
        target: 'es2024',
        parser: {
          syntax: 'typescript',
          decorators: true
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true
        }
      }
    },
    options
  );
