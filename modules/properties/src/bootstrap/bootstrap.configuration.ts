import { createVaultClient, VaultClient, VaultProperties } from '@server/vault';
import { findVaultProperties, mergeRecord } from '../helper/properties.helper';
import { readAllEnv, readAllProperties } from '../helper/io.helper';
import { EnvironmentItem } from '../environment/environment.item';
import { Env } from '../environment/model/env';
import { AsyncSync, Configuration, Internal, Nullable, OptionalAsyncSync, TooArray } from '@server/core';
import { propertiesRefresh, watchSources } from '../refresh/properties.refresh';
import { filter } from 'rxjs';

@Configuration
@Internal
export class Bootstrap implements Env {
  private properties: EnvironmentItem;
  sources: Readonly<string[]>;
  private lastMode?: 'WATCH';
  private unwatch = () => {};
  private readonly vault = {
    client: undefined as Nullable<VaultClient>,
    properties: undefined as Nullable<VaultProperties>
  };

  constructor() {
    const { env, sources } = this.refreshSources();
    let uniqueSources = new Set(env.sources);
    sources.forEach(source => (uniqueSources = uniqueSources.add(source)));
    this.sources = Object.freeze([...uniqueSources]);
    propertiesRefresh.pipe(filter(env => env === this)).subscribe(() => {
      this.refreshSources();
    });
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

  private refreshSources() {
    let env = readAllEnv([]);
    const profilesFromEnv: string = env.properties['APP_PROFILES'];
    const profiles = profilesFromEnv?.split(',') ?? [];
    if (profilesFromEnv) {
      env = readAllEnv(profiles);
    }
    const { properties, sources } = readAllProperties('bootstrap', profiles, env['SOURCES_LOCATION'] ?? './resources');
    const record = mergeRecord(env.properties, properties);
    this.properties = EnvironmentItem.from(record);
    this.createVault().then(vault => (this.vault.client = vault));
    const mode = record['APP_MODE']?.toUpperCase();
    const files = [...env.sources, ...sources];
    this.unwatch = watchSources(
      {
        profiles,
        location: '.',
        watch: mode === 'WATCH',
        vault: false
      },
      files,
      () => this.unwatch(),
      this,
      this.lastMode
    );
    this.lastMode = mode;
    return {
      env,
      sources: files
    };
  }
}
