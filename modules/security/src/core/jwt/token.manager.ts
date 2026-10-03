import type { RestRequest, RestResponse } from '@pmeig/srv-rest';
import { JwtAccess, JwtProperties } from './jwt.properties';
import { TokenMetadata } from './token';

export abstract class TokenManager {
  abstract name: JwtAccess;

  abstract expose(token: TokenMetadata, res: RestResponse): RestResponse;
  abstract extract(req: RestRequest): string | undefined;

  protected constructor(protected readonly jwtProperties: JwtProperties) {}
}
