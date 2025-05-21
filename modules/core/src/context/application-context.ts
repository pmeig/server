import { Nullable } from '../helper/type.helper';
import { Type } from './provider.type';
import { ComponentContext, retrieveContext } from '../decorators/components/context.helper';

export interface Context {
  resolve: <T extends any = any>(key: Type<T>, defaultValue?: Nullable<T> | (() => Nullable<T>)) => Nullable<T>;
  resolveRequired: <T extends any = any>(key: Type<T>) => T;
  has: (key: Type<any>) => boolean;
}

export class Module implements Context {
  private injectables: Record<string, ComponentContext[]> = {};

  constructor(private readonly providers: Type<any>[] = []) {}

  init() {
    this.providers.forEach(provider => {
      const metadata = retrieveContext(provider);
      metadata.names?.forEach(name => {
        const context = this.injectables[name] ?? [];
        context.push(metadata);
        this.injectables[name] = context;
      });
    });

    Object.entries(this.injectables).forEach(([key, context]) => {
      this.injectables[key] = context.sort((first, second) => first.order - second.order);
    });
  }

  has(key: any): boolean {
    return !!this.injectables[key];
  }

  resolve<T>(key: Type<T>, defaultValue?: Nullable<T> | (() => Nullable<T>)): Nullable<T> {
    const injectable = (this.injectables[key.name] ?? [])[0]?.factory?.build(this);
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
