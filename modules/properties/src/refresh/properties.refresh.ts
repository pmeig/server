import { EnvironmentConfiguration } from '../environment/environment.configuration';
import { unwatchFile, watchFile } from 'fs';
import { Subject } from 'rxjs';
import { Env } from '../environment/model/env';
import { EnvConfig } from '../environment/model/env-config';

export const propertiesRefresh = new Subject<Env | EnvConfig>();

export const watchSources = (
  context: EnvironmentConfiguration,
  sources: Readonly<string[]>,
  unwatch: () => void,
  env: Env,
  lastMode?: 'WATCH'
) => {
  unwatch();
  if (context.watch && lastMode !== 'WATCH') {
    unwatch = () => {};
    sources.forEach(source => {
      const before = unwatch;
      unwatch = () => {
        before();
        unwatchFile(source);
      };
      watchFile(source, () => {
        propertiesRefresh.next(env);
      });
    });
  } else unwatch = () => {};
  return unwatch;
};
