import { Module } from '@server/core';
import { Bootstrap } from './bootstrap/bootstrap.configuration';
import { createVaultClient, VaultClient, VaultProperties } from '@server/vault';
import { findVaultProperties } from './helper/properties.helper';
import { PropertiesPost } from './properties.decorators';
import { Environment } from './environment/environment';
import { EnvironmentConfiguration } from './environment/environment.configuration';
import { vaultRefresh } from './bootstrap-refresh';

@Module({
  providers: [
    Bootstrap,
    PropertiesPost,
    {
      provide: VaultProperties,
      useFactory: async context => {
        const bootstrap = await context.resolveRequired(Bootstrap);
        return findVaultProperties(bootstrap);
      }
    },
    {
      provide: VaultClient,
      useFactory: async context => {
        const vaultProperties = await context.resolveRequired(VaultProperties);
        const vault = await createVaultClient(vaultProperties);
        if (vault) {
          vaultRefresh.subscribe(value => {
            createVaultClient(value).then(client => {
              if (client) {
                Object.entries(client).forEach(([key, value]) => {
                  vault[key] = value;
                });
              }
            });
          });
        }
        return vault;
      }
    },
    {
      provide: EnvironmentConfiguration,
      useFactory: async context => {
        const bootstrap = await context.resolveRequired(Bootstrap);
        return EnvironmentConfiguration.from(bootstrap);
      }
    },
    Environment
  ]
})
export class PropertiesModule {}
