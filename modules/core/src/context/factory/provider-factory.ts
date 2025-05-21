import { Context } from '../application-context';
import { Type } from '../provider.type';
import { ConstructorFactory } from './constructor.factory';

export interface ProviderFactory<T extends any = any> {
  build(context: Context): T | undefined;
  valid(target: object): ProviderFactory<T> | undefined;
}

export class RequestProviderFactory<T extends any = any> implements ProviderFactory<T> {
  constructor(private readonly type: Type<T>) {}

  build(_context: Context): T | undefined {
    return undefined;
  }

  valid(target: object): ProviderFactory<T> | undefined {
    return undefined;
  }
}

export class TransientProviderFactory<T extends any = any> implements ProviderFactory<T> {
  constructor(private readonly type: Type<T>) {}

  build(_context: Context): T | undefined {
    return undefined;
  }

  valid(target: object): ProviderFactory<T> | undefined {
    return undefined;
  }
}

export class SingletonProviderFactory<T extends any = any> implements ProviderFactory<T> {
  private singleton?: T;
  private readonly constructorFactory: ConstructorFactory;
  constructor(private readonly type: Type<T>) {
    this.constructorFactory = ConstructorFactory.from(type);
  }

  build(context: Context): T | undefined {
    if (this.singleton) {
      return this.singleton;
    }
    this.singleton = this.constructorFactory.build(this.type, context);
    return this.singleton;
  }

  valid(target: object): ProviderFactory<T> | undefined {
    return this.type.name === (target as { name: string }).name ? this : undefined;
  }
}
