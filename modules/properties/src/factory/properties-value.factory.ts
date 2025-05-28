import { extractKeys } from '../helper/properties.helper';
import { VaultClient, VaultNode } from '@server/vault';
import { Env } from '../environment/env';

export class PropertiesValueFactory {
  private readonly keys: string[];
  private readonly isVault: boolean | 'runtime';
  private readonly value: string;

  constructor(value: string) {
    this.value = value.trim();
    this.keys = extractKeys(value);
    if (this.value.startsWith('${') && this.value.endsWith('}')) {
      this.isVault = 'runtime';
    } else {
      this.isVault = this.value.startsWith('vault(') && this.value.endsWith(')');
    }
  }

  build<T extends string | VaultNode>(properties: Env, vaultClient?: VaultClient): Promise<T> {
    let property = this.value;
    this.keys.forEach(async key => {
      const ref = `\${${key}}`;
      const value = await properties.find(key, ref);
      property = property.replaceAll(ref, value);
    });
    if (vaultClient) {
      return this.onVault(property, vaultClient).then(value => value as T);
    }
    return Promise.resolve(property as T);
  }

  private onVault(property: string, vaultClient: VaultClient): Promise<string | VaultNode> {
    let vault = this.isVault;
    if (vault === 'runtime') {
      vault = property.startsWith('vault(') && property.endsWith(')');
    }
    if (vault) {
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
