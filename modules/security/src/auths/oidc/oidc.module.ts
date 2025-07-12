import { OidcProperties } from './oidc.properties';
import { OidcClient } from './oidc.client';
import { Module } from '@pmeig/srv-core';
import { ConditionalProperties } from '@pmeig/srv-properties';
import { OidcService } from './oidc.service';

@Module({
  providers: [OidcProperties, OidcClient, OidcService]
})
@ConditionalProperties('security.auth', 'oidc', true)
export class OidcModule {}
