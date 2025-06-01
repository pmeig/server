import { createVaultClient, VaultClient, VaultProperties } from '@server/vault';
import { findVaultProperties, mergeRecord } from '../helper/properties.helper';
import { readAllEnv, readAllProperties, watchSources } from '../helper/io.helper';
import { EnvironmentItem } from '../environment/environment.item';
import { Env } from '../environment/env';
import { AsyncSync, Configuration, Internal, Nullable, OptionalAsyncSync, TooArray } from '@server/core';
import { PropertiesFile } from '../properties.type';
import { bootstrapRefresh } from '../bootstrap-refresh';

@Configuration
@Internal
export class Bootstrap implements Env {
  private properties: EnvironmentItem;
  readonly sources: Readonly<string[]>;
  private lastMode = '';
  private unwatch = () => {};
  private readonly vault = {
    client: undefined as Nullable<VaultClient>,
    properties: undefined as Nullable<VaultProperties>
  };

  constructor() {
    const { env, sources } = this.refreshSources();
    let uniqueSources = new Set(env.sources);
    sources.forEach(source => (uniqueSources = uniqueSources.add(source)));
    this.sources = [...uniqueSources];
  }

  async get<T extends TooArray<Record<string, any> | number | string | boolean>>(key: string) {
    const item = await this.find<T>(key);
    if (item) {
      return item;
    }
    throw new Error(`Property ${key} not found`);
  }

  find<T extends Record<string, any> | number | string | boolean>(
    key: string,
    defaultValue: AsyncSync<T[]> | (() => AsyncSync<T[]>)
  ): Promise<T[]>;
  find<T extends Record<string, any> | number | string | boolean>(
    key: string,
    defaultValue: AsyncSync<T> | (() => AsyncSync<T>)
  ): Promise<T>;
  find<T extends Record<string, any> | number | string | boolean>(key: string): Promise<Nullable<T>>;
  find<T extends Record<string, any> | number | string | boolean>(
    key: string,
    defaultValue: OptionalAsyncSync<T | T[]> | (() => OptionalAsyncSync<T | T[]>) = () => undefined
  ): Promise<Nullable<T> | T[]> {
    let replace = defaultValue;
    if (typeof defaultValue !== 'function') {
      replace = () => defaultValue;
    }
    let item: EnvironmentItem | Promise<Nullable<T>> | undefined = this.properties.read(key.split('.'));
    if (item) {
      item = item.get(this, this.vault.client);
    }
    return this.applyDefault(item, replace as () => OptionalAsyncSync<T>);
  }

  private async applyDefault<T>(item: OptionalAsyncSync<T>, replace: () => OptionalAsyncSync<T>): Promise<Nullable<T>> {
    if (item) {
      item = await item;
    }
    return Promise.resolve(item ?? replace());
  }

  private async createVault() {
    this.vault.properties = await findVaultProperties(this);
    return createVaultClient(this.vault.properties);
  }

  private watchSources(env: PropertiesFile) {
    const mode = env['MODE']?.toString()?.toUpperCase();
    if (this.lastMode !== mode) {
      this.unwatch();
      this.unwatch = watchSources(mode, this.sources, () => {
        this.refreshSources();
      });
      this.lastMode = mode;
    }
  }

  private refreshSources() {
    let env = readAllEnv([]);
    const profilesFromEnv: string = env.properties['APP_PROFILES'];
    const profiles = profilesFromEnv?.split(',') ?? [];
    if (profilesFromEnv) {
      env = readAllEnv(profiles);
    }
    const { properties, sources } = readAllProperties('bootstrap', profiles, env['SOURCES_LOCATION'] ?? './resources');
    this.properties = EnvironmentItem.from(mergeRecord(env, properties));
    this.createVault().then(vault => (this.vault.client = vault));
    this.watchSources(env);
    bootstrapRefresh.next(this);
    return {
      env,
      sources
    };
  }
}
