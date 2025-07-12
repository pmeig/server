import { Request, Response } from 'express';
import { JwtAccess, JwtProperties } from './jwt.properties';
import { TokenMetadata } from './token';

export abstract class TokenManager {
  abstract name: JwtAccess;

  abstract expose(token: TokenMetadata, res: Response): Response;
  abstract extract(req: Request): string | undefined;

  protected constructor(protected readonly jwtProperties: JwtProperties) {}
}
