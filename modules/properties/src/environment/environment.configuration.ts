import { Configuration } from '@server/core';
import { Bootstrap } from '../bootstrap/bootstrap.configuration';

@Configuration
export class EnvironmentConfiguration {
  location = './resources';
  watch = false;
  profiles: string[] = [];
  vault = false;

  static from(bootstrap: Bootstrap) {
    return Promise.all([
      bootstrap.find<string>('APP_PROFILES').then(profiles => profiles?.split(',') ?? []),
      bootstrap.find<string>('SOURCES_LOCATION', './resources'),
      bootstrap.find<string>('MODE', '')
    ]).then(([profiles, path, mode]) => {
      return new EnvironmentConfiguration({
        profiles,
        location: path,
        watch: mode === 'watch'
      });
    });
  }

  constructor(update?: Partial<EnvironmentConfiguration>) {
    if (update) {
      Object.entries(update).forEach(([key, value]) => {
        this[key] = value;
      });
    }
  }
}
