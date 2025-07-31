import { HttpError, PmeigServerErrorMessage } from './http.error';
import { HttpStatusCode } from '../models/status.model';

export interface BusinessErrorMessage {
  technical?: string;
  business: string;
}

export abstract class BusinessError extends HttpError {
  protected constructor(code: number);
  protected constructor(code: number, cause: Error);
  protected constructor(code: number, status: HttpStatusCode | BusinessErrorMessage, cause?: Error);
  protected constructor(code: number, status: HttpStatusCode, message: BusinessErrorMessage, cause?: Error);
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
