import { serialize } from 'cookie';
import { sign } from 'cookie-signature';
import type { RestResponse } from '@pmeig/srv-rest';

export interface CookieWriteOptions {
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  /** lifetime in milliseconds (same unit as the `maxAge` option of express `res.cookie`) */
  maxAge?: number;
  signed?: boolean;
  /** secret used when `signed` is true (the one given to cookie-parser) */
  secret?: string;
}

/**
 * Equivalent of express `res.cookie` for a Fastify reply: signed cookies keep the `s:` format
 * understood by `cookie-parser`, so the reading side does not change.
 */
export const writeCookie = (response: RestResponse, name: string, value: string, options: CookieWriteOptions) => {
  const { signed, secret, maxAge, ...cookieOptions } = options;
  if (signed && !secret) {
    throw new Error('A secret is required to write signed cookies');
  }
  const stored = signed ? 's:' + sign(value, secret as string) : value;
  const lifetime =
    typeof maxAge === 'number' && !isNaN(maxAge)
      ? { maxAge: Math.floor(maxAge / 1000), expires: new Date(Date.now() + maxAge) }
      : {};
  // Fastify appends to the Set-Cookie header instead of replacing it
  return response.header('set-cookie', serialize(name, stored, { path: '/', ...cookieOptions, ...lifetime }));
};
