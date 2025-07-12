import { JwtAccess } from './jwt.properties';

export interface TokenMetadata {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: JwtAccess;
  idToken?: string;
}
