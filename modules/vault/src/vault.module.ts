import { Module } from '@server/core';
import { VaultProperties } from './vault.properties';
import { VaultClient } from './vault-client';

@Module({
  providers: [VaultProperties, VaultClient]
})
export class VaultModule {}
