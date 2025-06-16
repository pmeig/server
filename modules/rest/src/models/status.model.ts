const toHttpStatusCode = <T extends Record<string, number>>(httpStatus: T) =>
  Object.entries(httpStatus).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {} as Record<number, keyof T>);

export const HttpStatusInformationalResponse = {
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102
};

export const HttpStatus1xx = toHttpStatusCode(HttpStatusInformationalResponse);

export const HttpStatusSuccess = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  MULTI_STATUS: 207,
  ALREADY_REPORTED: 208,
  IM_USED: 226
};

export const HttpStatus2xx = toHttpStatusCode(HttpStatusSuccess);

export const HttpStatusRedirect = {
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  USE_PROXY: 305,
  SWITCH_PROXY: 306,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308
};

export const HttpStatus3xx = toHttpStatusCode(HttpStatusRedirect);

export const HttpStatusClientError = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  IM_A_TEAPOT: 418,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451
};

export const HttpStatus4xx = toHttpStatusCode(HttpStatusClientError);

export const HttpStatusServerError = {
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};

export const HttpStatus5xx = toHttpStatusCode(HttpStatusServerError);

export const HttpStatus = Object.freeze({
  ...HttpStatusInformationalResponse,
  ...HttpStatusSuccess,
  ...HttpStatusRedirect,
  ...HttpStatusClientError,
  ...HttpStatusServerError,
  informational: HttpStatusInformationalResponse,
  success: HttpStatusSuccess,
  redirect: HttpStatusRedirect,
  clientError: HttpStatusClientError,
  serverError: HttpStatusServerError
});

export const HttpStatusText = Object.freeze({
  ...HttpStatus1xx,
  ...HttpStatus2xx,
  ...HttpStatus3xx,
  ...HttpStatus4xx,
  ...HttpStatus5xx,
  informational: HttpStatus1xx,
  success: HttpStatus2xx,
  redirect: HttpStatus3xx,
  clientError: HttpStatus4xx,
  serverError: HttpStatus5xx
});

export const HttpStatusNoValue = (code: number) => {
  if (is2xx(code)) return HttpStatus.NO_CONTENT;
  if (is3xx(code)) return HttpStatus.NOT_FOUND;
  return code;
};

export const is1xx = (code: number) => code < 200;
export const is2xx = (code: number) => code >= 200 && code < 300;
export const is3xx = (code: number) => code >= 300 && code < 400;
export const is4xx = (code: number) => code >= 400 && code < 500;
export const is5xx = (code: number) => code >= 500;
