import type { StringValue } from 'ms';
import { Algorithm } from 'jsonwebtoken';
import { randomString } from '../random.helper';
import { Properties } from '@pmeig/srv-properties';

export type JwtAccess = 'header' | 'cookie' | 'body';

@Properties('security.jwt')
export class JwtProperties {
  secret: string;
  expires: StringValue | '' = '';
  algorithm: Algorithm = 'HS512';
  expose = {
    type: 'header' as JwtAccess,
    prefix: 'Bearer'
  };

  constructor() {
    setTimeout(() => {
      if (!this.secret) {
        this.secret = this.randomSign();
        console.log('generate jwt with secret: ', this.secret);
      }
    }, 250);
  }

  setExpose(expose: { type: JwtAccess; prefix?: string }) {
    this.expose.type = expose.type;
    this.expose.prefix = expose.prefix ?? 'Bearer';
  }

  private randomSign() {
    if (this.algorithm !== 'none') {
      return randomString(Number(this.algorithm.slice(2)) / 8);
    }
    return '';
  }
}
