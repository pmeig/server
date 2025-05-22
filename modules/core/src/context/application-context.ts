import { Nullable } from '../helper/type.helper';
import { CustomProvider, Provider, Type } from './provider/provider.type';
import { ComponentContext, retrieveContext, updateContext } from '../decorators/components/context.helper';
import { createComponentDecorator, Scope } from '../decorators/components/component.decorator';
import { PutParam } from '../decorators/global/metadata.decorators';

export interface Context {
  resolve: <T extends any = any>(
    key: Type<T>,
    defaultValue?: Nullable<T> | (() => Nullable<T>)
  ) => Promise<Nullable<T>>;
  resolveRequired: <T extends any = any>(key: Type<T>) => Promise<T>;
  has: (key: Type<any>) => boolean;
}

export interface ModuleContext {
  providers: Provider[];
}

export class Module implements Context {
  private injectables: Record<string | symbol, ComponentContext[]> = {};

  constructor(context: ModuleContext) {
    this.init(context);
  }

  has(key: any): boolean {
    return !!this.injectables[key];
  }

  async resolve<T>(key: Type<T>, defaultValue?: Nullable<T> | (() => Nullable<T>)): Promise<Nullable<T>> {
    if (key.name === Module.name) {
      return this as unknown as T;
    }
    const injectable = await (this.injectables[key.name] ?? [])[0]?.factory?.build(this);
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

  async resolveRequired<T>(key: Type<T>): Promise<T> {
    const retrieve = await this.resolve(key);
    if (!retrieve) throw new Error(`No provider found for ${key}`);
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
        const context = this.injectables[name] ?? [];
        context.push(metadata);
        this.injectables[name] = context;
      });
    });

    Object.entries(this.injectables).forEach(([key, context]) => {
      this.injectables[key] = context.sort((first, second) => first.order - second.order);
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
}
