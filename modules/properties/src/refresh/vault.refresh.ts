import { AsyncSync, BeanPost, Configuration, Internal, ProviderType } from '@server/core';
import { VaultClient, VaultProperties } from '@server/vault';
import { propertiesRefresh } from './properties.refresh';
import { filter } from 'rxjs';
import { Bootstrap } from '../bootstrap/bootstrap.configuration';
import { findVaultProperties } from '../helper/properties.helper';

@Internal
@Configuration
export class VaultRefresh extends BeanPost<VaultClient | VaultProperties> {
  isHandler(
    _target: ProviderType<VaultClient | VaultProperties>,
    name: string | symbol,
    _bean: VaultClient | VaultProperties
  ): boolean {
    return [VaultProperties.name, VaultClient.name].includes(name.toString());
  }

  postConstruct(
    target: ProviderType<VaultClient | VaultProperties>,
    name: string | symbol,
    bean: VaultClient | VaultProperties
  ): AsyncSync<VaultClient | VaultProperties> {
    let current = bean;
    propertiesRefresh.pipe(filter(env => env instanceof Bootstrap)).subscribe(async env => {
      const properties = await findVaultProperties(env);
      if (VaultProperties.name) {
        Object.entries(properties).forEach(([key, value]) => {
          bean[key] = value;
        });
      } else {
        current = new VaultClient(properties);
      }
    });
    if (VaultClient.name === name.toString()) {
      return new Proxy(bean, {
        get(target: any, p: string | symbol, _: any): any {
          return current[p];
        }
      });
    }
    return bean;
  }
}
