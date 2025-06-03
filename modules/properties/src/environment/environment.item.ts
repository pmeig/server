import { extractKeys } from '../helper/properties.helper';
import { VaultClient, VaultNode } from '@server/vault';
import { Env } from './model/env';

export type EnvironmentValue =
  | string
  | number
  | boolean
  | undefined
  | EnvironmentItem[]
  | Record<string, EnvironmentItem>;

export abstract class EnvironmentItem<U extends EnvironmentValue = EnvironmentValue> {
  static from(value: EnvironmentValue): EnvironmentItem {
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return new EnvironmentArray(value);
      }
      return new EnvironmentRecord(value);
    }
    if (typeof value === 'string') {
      return new EnvironmentString(value);
    }
    return new EnvironmentRef(value);
  }

  protected constructor(protected value: U) {}

  abstract get<T extends any = any>(properties: Env, vaultClient?: VaultClient): Promise<T>;

  read(key: string[]): EnvironmentItem | undefined {
    if (key.length === 0) {
      return this;
    }
    return undefined;
  }
}

export class EnvironmentRef extends EnvironmentItem<number | boolean | undefined> {
  constructor(value: number | boolean | undefined) {
    super(value);
  }

  get<T>(properties: Env, vaultClient?: VaultClient): Promise<T> {
    return Promise.resolve(this.value as T);
  }
}

export class EnvironmentRecord extends EnvironmentItem<Record<string, EnvironmentItem>> {
  constructor(value: Record<string, any>) {
    super(value);
    this.value = Object.entries(value).reduce(
      (record, [key, value]) => {
        record[key] = EnvironmentItem.from(value);
        return record;
      },
      {} as Record<string, EnvironmentItem>
    );
  }

  async get<T>(properties: Env, vaultClient: undefined): Promise<T> {
    const items = await Promise.all(
      Object.entries(this.value).map(([key, item]) => item.get(properties, vaultClient).then(value => ({ key, value })))
    );
    return items.reduce(
      (record, { key, value }) => {
        record[key] = value;
        return record;
      },
      {} as Record<string, any>
    ) as T;
  }

  read(key: string[]): EnvironmentItem | undefined {
    if (key.length === 0) {
      return this;
    }
    return this.value[key[0]]?.read(key.slice(1));
  }
}

export class EnvironmentArray extends EnvironmentItem<EnvironmentItem[]> {
  constructor(value: any[]) {
    super(value);
    this.value = value.map(item => EnvironmentItem.from(item));
  }

  get<T>(properties: Env, vaultClient?: VaultClient): Promise<T> {
    return Promise.all(this.value.map(item => item.get(properties, vaultClient))) as Promise<T>;
  }
}

export class EnvironmentString extends EnvironmentItem<string> {
  private readonly keys: string[];
  private isVault: boolean | 'runtime';

  constructor(value: string) {
    super(value);
    this.value = value.trim();
    this.keys = extractKeys(value);
    if (this.value.startsWith('${') && this.value.endsWith('}')) {
      this.isVault = 'runtime';
    } else {
      this.isVault = this.value.startsWith('vault(') && this.value.endsWith(')');
    }
  }

  async get<T>(properties: Env, vaultClient?: VaultClient): Promise<T> {
    let property = this.value;
    for (const key of this.keys) {
      const ref = `\${${key}}`;
      const value = await properties.find(key, ref);
      property = property.replaceAll(ref, value);
    }
    if (vaultClient) {
      return this.onVault(property, vaultClient).then(value => value as T);
    }
    return Promise.resolve(property as T);
  }

  private onVault(property: string, vaultClient: VaultClient): Promise<string | VaultNode> {
    if (this.isVault === 'runtime') {
      this.isVault = property.startsWith('vault(') && property.endsWith(')');
    }
    if (this.isVault) {
      const instruction = property.substring('vault('.length, property.length - 1);
      const [path, key] = instruction.split(',').map(value => value.trim());
      try {
        if (!key) {
          return vaultClient?.read(path, key);
        }
        return vaultClient?.read(path);
      } catch (error) {
        console.error(error);
        return Promise.resolve(this.value);
      }
    }
    return Promise.resolve(property);
  }
}
