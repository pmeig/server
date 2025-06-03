import { AsyncSync, Configuration, Nullable, Optional, OptionalAsyncSync, TooArray } from '@server/core';
import { Env } from './model/env';
import { EnvironmentItem } from './environment.item';
import { VaultClient } from '@server/vault';
import { readAllProperties } from '../helper/io.helper';
import { EnvironmentConfiguration } from './environment.configuration';
import { propertiesRefresh, watchSources } from '../refresh/properties.refresh';
import { filter } from 'rxjs';
import { isEnvConfig } from './model/env-config';
import { mergeRecord } from '../helper/properties.helper';

@Configuration
export class Environment implements Env {
  private properties: EnvironmentItem;
  private unwatch = () => {};
  private lastMode?: 'WATCH';
  sources: Readonly<string[]>;

  constructor(
    context: EnvironmentConfiguration,
    @Optional private readonly vaultClient?: VaultClient
  ) {
    this.initWithContext(context);
    propertiesRefresh.pipe(filter(env => env === this || isEnvConfig(env))).subscribe(env => {
      const newContext = isEnvConfig(env) ? env : context;
      this.initWithContext(newContext);
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
      item = item.get(this, this.vaultClient);
    }
    return this.applyDefault(item, replace as () => OptionalAsyncSync<T>);
  }

  private async applyDefault<T>(item: OptionalAsyncSync<T>, replace: () => OptionalAsyncSync<T>): Promise<Nullable<T>> {
    if (item) {
      item = await item;
    }
    return Promise.resolve(item ?? replace());
  }

  private initWithContext(context: EnvironmentConfiguration) {
    this.initProperties(context);
    this.unwatch = watchSources(context, this.sources, () => this.unwatch(), this, this.lastMode);
    this.lastMode = context.watch ? 'WATCH' : undefined;
  }

  private initProperties(context: EnvironmentConfiguration) {
    const profiles = context.profiles;
    const location = context.location;
    const { properties, sources } = readAllProperties('app', profiles, location);
    this.properties = EnvironmentItem.from(mergeRecord({ ...process.env }, properties));
    this.sources = Object.freeze(sources);
  }
}
