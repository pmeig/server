import { RestDecorators } from '@pmeig/srv-rest';
import { SECURITY_USER_FIELD_NAME } from '../core/security.constant';
import { Request } from 'express';

const getUserFromRequest = (request: Request) => request[SECURITY_USER_FIELD_NAME] ?? {};

export const ReqUser = RestDecorators.parameter('ReqUser', request => getUserFromRequest(request));
export const Username = RestDecorators.parameter('Username', request => getUserFromRequest(request).username);
export const Token = RestDecorators.parameter('Token', request => getUserFromRequest(request).token);
export const Authorities = RestDecorators.parameter('Authorities', request => getUserFromRequest(request).authorities);
