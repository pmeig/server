import { Configuration, Optional, AsyncSync, Nullable, OptionalAsyncSync, TooArray } from '@server/core';
import { Env } from './env';
import { EnvironmentItem } from './environment.item';
import { VaultClient } from '@server/vault';
import { readAllProperties } from '../helper/io.helper';
import { EnvironmentConfiguration } from './environment.configuration';
import { contextRefresh } from '../bootstrap-refresh';

@Configuration
export class Environment implements Env {
  private properties: EnvironmentItem;
  sources: Readonly<string[]>;

  constructor(
    context: EnvironmentConfiguration,
    @Optional private readonly vaultClient?: VaultClient
  ) {
    this.initWithContext(context);
    contextRefresh.subscribe(context => this.initWithContext(context));
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
    const profiles = context.profiles;
    const location = context.location;
    const { properties, sources } = readAllProperties('app', profiles, location);
    this.properties = EnvironmentItem.from(properties);
    this.sources = Object.freeze(sources);
  }
}
