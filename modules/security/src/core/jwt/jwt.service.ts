import jwt from 'jsonwebtoken';
import ms, { StringValue } from 'ms';
import { JwtProperties } from './jwt.properties';
import { User } from '../../models/user.model';
import { ApplicationProperties } from '@pmeig/srv-properties';
import { TokenMetadata } from './token';
import { Configuration } from '@pmeig/srv-core';
import { ValidatorProperties } from '../validator.properties';

@Configuration
export class JwtService<T extends User = User> {
  constructor(
    private readonly jwtProperties: JwtProperties,
    private readonly applicationProperties: ApplicationProperties,
    private readonly validatorProperties: ValidatorProperties
  ) {}

  encode(user: T, issuer: string, tokenMetadata: TokenMetadata): TokenMetadata {
    const claims = user as Record<string, any>;
    claims['nonce'] = this.validatorProperties.nonce;
    claims['iss'] = issuer;
    claims['sub'] = this.applicationProperties.name;
    claims['id'] = tokenMetadata.idToken;
    const expiresIn = (
      this.jwtProperties.expires.length === 0 ? `${tokenMetadata.expiresIn}s` : this.jwtProperties.expires
    ) as StringValue;
    const token = jwt.sign(claims as object, this.jwtProperties.secret, {
      encoding: 'utf8',
      algorithm: this.jwtProperties.algorithm,
      expiresIn
    });
    return {
      accessToken: token,
      expiresIn: ms(expiresIn),
      tokenType: this.jwtProperties.expose.type,
      idToken: tokenMetadata.idToken
    };
  }

  decode(token: string, issuer: string): T | string | undefined {
    try {
      let decode: any = jwt.verify(token, this.jwtProperties.secret, {
        algorithms: [this.jwtProperties.algorithm],
        nonce: this.validatorProperties.nonce,
        issuer,
        subject: this.applicationProperties.name
      });
      if (typeof decode === 'string') {
        if (!decode.trimStart().startsWith('{') || !decode.trimEnd().endsWith('}')) {
          return decode;
        }
        decode = JSON.parse(decode) as unknown;
      }
      return decode as T;
    } catch (error) {
      console.debug(error);
      return undefined;
    }
  }
}
