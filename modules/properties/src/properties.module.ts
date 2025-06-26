import { Module } from '@pmeig/srv-core';
import { Bootstrap } from './bootstrap/bootstrap.configuration';
import { createVaultClient, VaultClient, VaultProperties } from '@pmeig/srv-vault';
import { findVaultProperties } from './helper/properties.helper';
import { PropertiesPost } from './properties.decorators';
import { Environment } from './environment/environment';
import { EnvironmentConfiguration } from './environment/environment.configuration';
import { VaultRefresh } from './refresh/vault.refresh';

@Module({
  providers: [
    Bootstrap,
    PropertiesPost,
    VaultRefresh,
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
        return await createVaultClient(vaultProperties);
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
