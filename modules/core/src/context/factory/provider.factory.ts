import { Context } from '../application-context';
import { Type } from '../provider.type';

export interface ProviderFactory<T extends any = any> {
  build(context: Context): T | undefined;
}

export class RequestProviderFactory<T extends any = any> implements ProviderFactory<T> {
  constructor(private readonly type: Type<T>) {}

  build(_context: Context): T | undefined {
    return undefined;
  }
}

export class TransientProviderFactory<T extends any = any> implements ProviderFactory<T> {
  constructor(private readonly type: Type<T>) {}

  build(_context: Context): T | undefined {
    return undefined;
  }
}

export class SingletonProviderFactory<T extends any = any> implements ProviderFactory<T> {
  private singleton?: T;
  constructor(private readonly type: Type<T>) {}

  build(context: Context): T | undefined {
    if (this.singleton) {
      return this.singleton;
    }
    this.singleton = new this.type();
    return this.singleton;
  }
}
