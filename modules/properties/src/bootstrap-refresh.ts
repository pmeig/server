import { Subject } from 'rxjs';
import { AsyncSync, BeanPost, Configuration, ProviderType } from '@server/core';
import { EnvironmentConfiguration } from './environment/environment.configuration';
import { Bootstrap } from './bootstrap/bootstrap.configuration';
import { VaultProperties } from '@server/vault';
import { Env } from './environment/env';
import { findVaultProperties } from './helper/properties.helper';

export const bootstrapRefresh = new Subject<Bootstrap>();
export const contextRefresh = new Subject<EnvironmentConfiguration>();
export const vaultRefresh = new Subject<VaultProperties>();
export const envRefresh = new Subject<Env>();

@Configuration
export class BootstrapRefresh extends BeanPost {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return [EnvironmentConfiguration.name, VaultProperties.name].includes(name.toString());
  }

  postConstruct(target: ProviderType<any>, name: string | symbol, bean: any): AsyncSync<any> {
    if (name.toString() === EnvironmentConfiguration.name) {
      bootstrapRefresh.subscribe(bootstrap => {
        EnvironmentConfiguration.from(bootstrap).then(value => {
          Object.entries(value).forEach(([key, value]) => {
            bean[key] = value;
          });
          contextRefresh.next(value);
        });
      });
    } else {
      bootstrapRefresh.subscribe(bootstrap => {
        findVaultProperties(bootstrap).then(value => {
          Object.entries(value).forEach(([key, value]) => {
            bean[key] = value;
          });
          vaultRefresh.next(value);
        });
      });
    }
    return bean;
  }
}
