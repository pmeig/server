import { randomString } from '../../../random.helper';
import { Properties } from '@pmeig/srv-properties';

const AUTO_SIGN_BYTES = 16;

@Properties('security.parser.cookie')
export class CookieProperties {
  domain: string;
  path = '/';
  sameSite: 'lax' | 'strict' | 'none' = 'strict';
  secure = true;
  httpOnly = true;
  signed = true;
  sign: string;

  constructor() {
    setTimeout(() => {
      if (this.signed && !this.sign) {
        this.sign = randomString(AUTO_SIGN_BYTES);
      }
    }, 250);
  }
}
