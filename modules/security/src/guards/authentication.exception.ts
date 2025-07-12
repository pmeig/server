import { HttpStatusClientError, TechnicalError } from '@pmeig/srv-rest';

type HttpStatusClientErrorCode = (typeof HttpStatusClientError)[keyof typeof HttpStatusClientError];

export class AuthenticationException extends TechnicalError {
  constructor(
    code: number,
    status: HttpStatusClientErrorCode,
    message: string = 'Authentication failed',
    business?: string
  ) {
    super(code, status, message, business);
  }
}
