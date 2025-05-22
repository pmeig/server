import { Nullable } from '../helper/type.helper';
import { CustomProvider, Provider, ProviderToken, Type } from './provider/provider.type';
import { ComponentContext, retrieveContext, updateContext } from '../decorators/components/context.helper';
import { createComponentDecorator, Scope } from '../decorators/components/component.decorator';
import { PutParam } from '../decorators/global/metadata.decorators';

export interface Context {
  resolve: <T extends any = any>(
    key: ProviderToken<T>,
    defaultValue?: Nullable<T> | Promise<Nullable<T>> | (() => Nullable<T> | Promise<Nullable<T>>)
  ) => Promise<Nullable<T>>;
  resolveRequired: <T extends any = any>(key: ProviderToken<T>) => Promise<T>;
  multiResolve: <T extends any = any>(
    key: ProviderToken<T>,
    defaultValue?: T[] | Promise<T[]> | (() => T[] | Promise<T[]>)
  ) => Promise<T[]>;
  multiResolveRequired: <T extends any = any>(key: Type<T>) => Promise<T[]>;
  has: (key: Type<any>) => boolean;
}

export interface ModuleContext {
  providers: Provider[];
}

export class Module implements Context {
  private factories: Record<string | symbol, ComponentContext[]> = {};

  constructor(context: ModuleContext) {
    this.init(context);
  }

  has(key: any): boolean {
    return !!this.factories[key];
  }

  async resolve<T>(
    key: ProviderToken<T>,
    defaultValue: Nullable<T> | Promise<Nullable<T>> | (() => Nullable<T> | Promise<T>) = undefined
  ): Promise<Nullable<T>> {
    const token = this.extractToken(key);
    if (token === Module.name) {
      return this as unknown as T;
    }
    const injectable = await (this.factories[token] ?? [])[0]?.factory?.build(this);
    return this.applyDefault(injectable, defaultValue);
  }

  async resolveRequired<T>(key: ProviderToken<T>): Promise<T> {
    const retrieve = await this.resolve(key);
    if (!retrieve) throw new Error(`No provider found for ${this.extractToken(key).toString()}`);
    return retrieve;
  }

  async multiResolve<T>(
    key: ProviderToken<T>,
    defaultValue: T[] | Promise<T[]> | (() => T[] | Promise<T[]>) = []
  ): Promise<T[]> {
    const token = this.extractToken(key);
    if (token === Module.name) return [this as unknown as T];
    const factories = this.factories[token];
    return Promise.all(factories.map(factory => this.applyDefault(factory.factory?.build(this), defaultValue)));
  }

  async multiResolveRequired<T>(key: ProviderToken<T>): Promise<T[]> {
    const retrieve = await this.multiResolve(key);
    if (retrieve.length === 0) throw new Error(`No provider found for ${this.extractToken(key).toString()}`);
    return retrieve;
  }

  private init(context: ModuleContext) {
    this.initProviders(context.providers);
  }

  private initProviders(providers: Provider[]) {
    providers.forEach(provider => {
      let targetProvider = provider;
      if (typeof provider !== 'function') {
        targetProvider = this.prepareCustomProvider(provider);
      }
      const metadata = retrieveContext(targetProvider);
      metadata.names?.forEach(name => {
        const context = this.factories[name] ?? [];
        context.push(metadata);
        this.factories[name] = context;
      });
    });

    Object.entries(this.factories).forEach(([key, context]) => {
      this.factories[key] = context.sort((first, second) => first.order - second.order);
    });
  }

  private prepareCustomProvider(provider: CustomProvider<any>): Type<any> {
    const target = provider.useFactory.bind(provider);
    const name = typeof provider.provide === 'function' ? provider.provide.name : provider.provide;
    createComponentDecorator('provider')(target);
    PutParam(target, Module);
    updateContext(
      {
        names: [name],
      },
      target
    );
    if (provider.scope) {
      Scope(provider.scope)(target);
    }
    return target;
  }

  private extractToken(key: ProviderToken<any>) {
    if (['string', 'symbol'].includes(typeof key)) {
      return key as string | symbol;
    }
    return (key as { name: string }).name;
  }

  private applyDefault<T extends any>(
    injectable: Promise<any> | undefined,
    defaultValue: Nullable<T> | Promise<Nullable<T>> | (() => Nullable<T> | Promise<Nullable<T>>)
  ) {
    if (injectable) {
      return injectable;
    }
    if (defaultValue) {
      if (typeof defaultValue !== 'function') {
        defaultValue = () => defaultValue as Nullable<T> | Promise<Nullable<T>>;
      }
      return (defaultValue as () => Nullable<T>)();
    }
    return undefined;
  }
}
