import { PmeigServerError } from './pmeig-server.error';

export interface BusinessErrorMessage {
  technical?: string;
  business: string;
}

export abstract class BusinessError extends PmeigServerError {
  protected constructor(code: number);
  protected constructor(code: number, cause: Error);
  protected constructor(code: number, status: number | BusinessErrorMessage, cause?: Error);
  protected constructor(code: number, status: number, message: BusinessErrorMessage, cause?: Error);
  protected constructor(
    code: number,
    status?: number | PmeigServerErrorMessage | Error,
    message?: PmeigServerErrorMessage | Error,
    cause?: Error
  ) {
    super(code);
    this.update(status, message, cause);
  }
}
