import { Component, toPromise } from '@pmeig/srv-core';
import { JwtService } from '../../core/jwt/jwt.service';
import { OidcClient } from './oidc.client';
import { UserProvider } from '../../core/user.provider';
import { AuthService } from '../auth.service';
import { TokenMetadata } from '../../core/jwt/token';
import { ApplicationProperties } from '@pmeig/srv-properties';
import { JwtProperties } from '../../core/jwt/jwt.properties';
import { IssuerProvider } from '../../models/issuer.model';

@Component
export class OidcService extends AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtProperties: JwtProperties,
    private readonly issuerProvider: IssuerProvider,
    private readonly oidcClient: OidcClient,
    private readonly userProvider: UserProvider,
    private readonly applicationProperties: ApplicationProperties
  ) {
    super();
  }

  login(): Promise<string | void> {
    return Promise.resolve(this.oidcClient.authorizeUrl().toString());
  }

  async createToken(params: Record<string, string>): Promise<TokenMetadata> {
    const token = await this.oidcClient.callback(params.code, params.state);
    const userInfo = await this.oidcClient.userInfo(token.access_token, this.applicationProperties.name);
    const user = await toPromise(this.userProvider.createUser(userInfo));
    const tokenMetadata: TokenMetadata = {
      idToken: token.id_token,
      expiresIn: token.expiresIn(),
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: this.jwtProperties.expose.type
    };
    if (user) {
      return this.jwtService.encode(user, this.issuerProvider.getIssuer(), tokenMetadata);
    }
    return tokenMetadata;
  }

  logout(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
