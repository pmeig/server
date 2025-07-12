import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  Configuration,
  discovery,
  fetchUserInfo,
  tokenRevocation
} from 'openid-client';
import { OidcProperties } from './oidc.properties';
import { Component } from '@pmeig/srv-core';
import { ValidatorProperties } from '../../core/validator.properties';

@Component
export class OidcClient {
  private configuration: Configuration;

  constructor(
    private readonly oidcProperty: OidcProperties,
    private readonly validatorProperties: ValidatorProperties
  ) {
    if (!this.oidcProperty.scope.includes('openid')) {
      this.oidcProperty.scope += ' openid';
    }
    this.createConfigurationOidcClient().then(configuration => (this.configuration = configuration));
  }

  userInfo(token: string, sub: string) {
    return fetchUserInfo(this.configuration, token, sub);
  }

  authorizeUrl() {
    return buildAuthorizationUrl(this.configuration, {
      state: this.validatorProperties.state,
      nonce: this.validatorProperties.nonce,
      redirect_uri: this.oidcProperty.url.redirect,
      scope: this.oidcProperty.scope
    });
  }

  callback(code: string, state: string) {
    return authorizationCodeGrant(
      this.configuration,
      new URL(this.oidcProperty.url.redirect + '?code=' + code + '&state=' + state),
      {
        expectedState: this.validatorProperties.state,
        expectedNonce: this.validatorProperties.nonce
      }
    );
  }

  revoke(token: string) {
    return tokenRevocation(this.configuration, token, new URLSearchParams('access_token'));
  }

  private createConfigurationOidcClient = () =>
    discovery(
      new URL(this.oidcProperty.url.issuer),
      this.oidcProperty.credentials.client_id,
      this.oidcProperty.credentials.client_secret
    );
}
