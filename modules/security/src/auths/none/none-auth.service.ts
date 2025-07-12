import { Configuration } from '@pmeig/srv-core';
import { TokenMetadata } from '../../core/jwt/token';
import { AuthService } from '../auth.service';

@Configuration
export class NoneAuthService extends AuthService {
  constructor() {
    super();
  }

  createToken(params: Record<string, string>): Promise<TokenMetadata> {
    return Promise.resolve({
      tokenType: 'body',
      accessToken: 'none'
    });
  }

  login(): Promise<string | void> {
    return Promise.resolve('');
  }

  logout(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
