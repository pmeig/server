import { Nullable } from '../helper/type.helper';
import { Type } from './provider.type';
import { ProviderFactory, SingletonProviderFactory } from './factory/provider.factory';

export interface Context {
  resolve: <T extends any = any>(key: Type<T>, defaultValue?: Nullable<T> | (() => Nullable<T>)) => Nullable<T>;
  resolveRequired: <T extends any = any>(key: Type<T>) => T;
  has: (key: Type<any>) => boolean;
}

export class Module implements Context {
  private readonly injectables: Record<any, ProviderFactory> = {};

  constructor(private readonly providers: Type<any>[] = []) {}

  init() {
    this.providers.forEach(provider => {
      this.injectables[provider as any] = new SingletonProviderFactory(provider as Type<any>);
    });
  }

  has(key: any): boolean {
    return !!this.injectables[key];
  }

  resolve<T>(key: Type<T>, defaultValue?: Nullable<T> | (() => Nullable<T>)): Nullable<T> {
    const injectable = this.injectables[key as any]?.build(this) as Nullable<T>;
    if (injectable) {
      return injectable;
    }
    if (defaultValue) {
      if (typeof defaultValue !== 'function') {
        defaultValue = () => defaultValue as Nullable<T>;
      }
      return (defaultValue as () => Nullable<T>)();
    }
    return undefined;
  }

  resolveRequired<T>(key: Type<T>): T {
    const retrieve = this.resolve(key);
    if (!retrieve) throw new Error(`No provider found for ${key}`);
    return retrieve as T;
  }
}
