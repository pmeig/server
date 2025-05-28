import { Configuration } from '@server/core';
import { mergeRecord } from '../helper/properties.helper';
import { readAllEnv, readAllProperties } from '../helper/io.helper';

@Configuration
export class Bootstrap {
  private readonly properties: Record<string, any>;
  readonly sources: Readonly<string[]>;

  constructor() {
    let env = readAllEnv([]);
    const profiles = env.properties['APP_PROFILES'];
    if (profiles) {
      env = readAllEnv(profiles);
    }
    const properties = readAllProperties('bootstrap', profiles, env['APP_PROPERTIES_PATH'] ?? './resources');
    this.sources = Object.freeze([...env.sources, ...properties.sources]);
    this.properties = mergeRecord(env.properties, properties.properties);
  }

  find<T>(key: string, defaultValue: T | undefined | (() => T | undefined) = () => undefined): T {
    let replace = defaultValue;
    if (typeof defaultValue !== 'function') {
      replace = () => defaultValue;
    }
    return this.properties[key];
  }
}
