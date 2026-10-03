import { Controller, Delete, Get, HttpStatus, Params, Res, Status } from '@pmeig/srv-rest';
import type { RestResponse } from '@pmeig/srv-rest';
import { AuthService } from './auth.service';
import { TokenManager } from '../core/jwt/token.manager';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenManager: TokenManager
  ) {}

  @Get('login')
  @Status(HttpStatus.TEMPORARY_REDIRECT)
  login() {
    return this.authService.login();
  }

  @Get('callback')
  async callback(@Params queries: Record<string, string>, @Res response: RestResponse) {
    const token = await this.authService.createToken(queries);
    return this.tokenManager.expose(token, response);
  }

  @Delete('logout')
  logout() {
    return this.authService.logout();
  }
}
