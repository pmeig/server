import { PmeigServerError, PmeigServerErrorMessage } from './pmeig-server.error';
import { HttpStatus } from '../models/status.model';
import { Nullable } from '@pmeig/srv-core';

export abstract class TechnicalError extends PmeigServerError {
  protected constructor(code: number);
  protected constructor(code: number, cause: Error);
  protected constructor(code: number, message: string, cause?: Error);
  protected constructor(code: number, message: string, business: string, cause?: Error);
  protected constructor(code: number, status: number, cause?: Error);
  protected constructor(code: number, status: number, message: string, cause?: Error);
  protected constructor(code: number, status: number, message: string, business?: string, cause?: Error);
  protected constructor(
    code: number,
    status?: number | string | Error,
    message?: string | Error,
    business?: string | Error,
    cause?: Error
  ) {
    super(code);
    let httpStatus = 0;
    let msg = {} as PmeigServerErrorMessage;
    let error = cause;
    if (typeof status !== 'number') {
      if (message instanceof Error) {
        error = message;
        message = undefined;
      }
      if (business instanceof Error) {
        error = business;
        business = undefined;
      }
      business = message;
      message = status;
      httpStatus = HttpStatus.serverError.SERVICE_UNAVAILABLE;
    }
    if (typeof message === 'string') {
      msg = {
        technical: message,
        business: business as Nullable<string>
      };
    } else {
      error = message;
    }
    this.update(httpStatus, msg, error);
  }
}
