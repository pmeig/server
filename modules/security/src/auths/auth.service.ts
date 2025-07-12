import { TokenMetadata } from '../core/jwt/token';

export abstract class AuthService {
  protected constructor() {}

  abstract login(): Promise<string | void>;
  abstract createToken(params: Record<string, string>): Promise<TokenMetadata>;
  abstract logout(): Promise<void>;
}
