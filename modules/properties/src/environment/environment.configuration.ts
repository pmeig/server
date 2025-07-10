import { Configuration } from '@pmeig/srv-core';
import { Bootstrap } from '../bootstrap/bootstrap.configuration';
import { propertiesRefresh } from '../refresh/properties.refresh';
import { filter } from 'rxjs';
import { EnvConfig } from './model/env-config';

@Configuration
export class EnvironmentConfiguration implements EnvConfig {
  location = './resources';
  watch = false;
  profiles: string[] = [];
  vault = false;

  static from(bootstrap: Bootstrap) {
    return EnvironmentConfiguration.configFromBootstrap(bootstrap).then(config => new EnvironmentConfiguration(config));
  }

  private static configFromBootstrap(bootstrap: Bootstrap) {
    return Promise.all([
      bootstrap.find<string>('APP_PROFILES', []),
      bootstrap.find<string>('SOURCES_LOCATION', './resources'),
      bootstrap.find<string>('APP_MODE', '')
    ]).then(([profiles, path, mode]) => {
      return {
        profiles,
        location: path,
        watch: mode.toUpperCase() === 'WATCH'
      };
    });
  }

  constructor(update?: Partial<EnvironmentConfiguration>) {
    if (update) {
      Object.entries(update).forEach(([key, value]) => {
        this[key] = value;
      });
    }
    propertiesRefresh.pipe(filter(env => env instanceof Bootstrap)).subscribe(async env => {
      const newConfiguration = await EnvironmentConfiguration.configFromBootstrap(env as Bootstrap);
      Object.entries(newConfiguration).forEach(([key, value]) => {
        this[key] = value;
      });
      propertiesRefresh.next(this);
    });
  }
}
