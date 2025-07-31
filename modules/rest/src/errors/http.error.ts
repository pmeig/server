import { HttpStatus, HttpStatusCode } from '../models/status.model';

export interface PmeigServerErrorMessage {
  technical?: string;
  business?: string;
}

export abstract class HttpError extends Error {
  protected constructor(code: number);
  protected constructor(code: number, cause: Error);
  protected constructor(code: number, status: HttpStatusCode | PmeigServerErrorMessage, cause?: Error);
  protected constructor(code: number, status: HttpStatusCode, errorMessage: PmeigServerErrorMessage, cause?: Error);
  protected constructor(
    public readonly code: number,
    public status?: number | PmeigServerErrorMessage | Error,
    public errorMessage?: PmeigServerErrorMessage | Error,
    public cause?: Error
  ) {
    super();
    this.update(status, errorMessage, cause);
  }

  protected update(
    status?: number | PmeigServerErrorMessage | Error,
    errorMessage?: PmeigServerErrorMessage | Error,
    cause?: Error
  ) {
    if (typeof status !== 'number') {
      if (errorMessage instanceof Error) {
        cause = errorMessage;
      }
      errorMessage = status;
      this.status = HttpStatus.serverError.SERVICE_UNAVAILABLE;
    } else {
      this.status = status;
    }
    if (errorMessage instanceof Error) {
      cause = errorMessage;
      errorMessage = {
        technical: cause.message
      };
    }
    this.errorMessage = errorMessage;
    this.cause = cause;
    this.status = status;
    this.message = this.errorMessage?.technical ?? this.cause?.message ?? this.message;
  }
}
