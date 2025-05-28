import { Nullable } from '../helper/type.helper';
import { CustomProvider, Provider, ProviderToken, Type } from './provider/provider.type';
import { ComponentContext, retrieveContext, updateContext } from '../decorators/components/context.helper';
import { createComponentDecorator, Scope } from '../decorators/components/component.decorator';
import { PutDesignParam } from '../decorators/global/metadata.decorators';
import { provideLifecycle } from './lifecycle/init-handler.lifecycle';
import { Module, retrieveModuleContext } from './context.decorators';
import { Decorator } from '../decorators/type.decorators';
import { BeanHandler } from './factory/bean-handler';

type DefaultValue<T> = Nullable<T> | Promise<Nullable<T>> | (() => Nullable<T> | Promise<Nullable<T>>);
type MultiDefaultValue<T> = T[] | Promise<T[]> | (() => T[] | Promise<T[]>);

const DEFAULT_PROVIDERS: Record<string, Provider[]> = Object.freeze({
  [BeanHandler.name]: [...provideLifecycle()]
});

export interface Context {
  resolve: <T extends any = any>(key: ProviderToken<T>, defaultValue?: DefaultValue<T>) => Promise<Nullable<T>>;
  resolveRequired: <T extends any = any>(key: ProviderToken<T>) => Promise<T>;
  multiResolve: <T extends any = any>(key: ProviderToken<T>, defaultValue?: MultiDefaultValue<T>) => Promise<T[]>;
  multiResolveRequired: <T extends any = any>(key: ProviderToken<T>) => Promise<T[]>;
  has: (key: ProviderToken<any>) => boolean;
  withDecorator: (decorator: Decorator | string) => any[];
}

export interface ModuleContext {
  providers?: Provider[];
  imports?: Type<any>[];
}

export class ApplicationContext implements Context {
  private factories: Record<string | symbol, ComponentContext[]> = {};
  private readonly children: Context[] = [];

  constructor(
    context: ModuleContext,
    private readonly contextReference: Context = this
  ) {
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
    if ([ApplicationContext.name, Module.name].includes(token.toString())) {
      return this as unknown as T;
    }
    const injectable = await (this.factories[token] ?? [])[0]?.factory?.build(this.contextReference, token);
    return this.useChildren(injectable, token, defaultValue);
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
    if ([ApplicationContext.name, Module.name].includes(token.toString())) return [this as unknown as T];
    const factories = this.factories[token] ?? [];
    const beans = this.applyDefault<T>(
      Promise.all(factories.map(factory => factory.factory?.build(this.contextReference, token))).then(build =>
        build.filter(test => !!test)
      ),
      () => []
    );
    let removeDefault = (values: T[]) => values;
    const defaultValues = DEFAULT_PROVIDERS[token.toString()].map(defaultProvider =>
      typeof defaultProvider === 'function' ? defaultProvider.name : defaultProvider.provide
    );
    if (defaultValues) {
      removeDefault = (values: T[]) =>
        values.filter(value => !defaultValues.includes(Object.getPrototypeOf(value).constructor.name));
    }
    return this.applyDefault(
      beans.then(async values => {
        const others = await Promise.all(this.children.map(module => module.multiResolve<T>(token, () => [])));
        const all = removeDefault(others.flatMap(value => value));
        return values.concat(all);
      }),
      defaultValue
    );
  }

  async multiResolveRequired<T>(key: ProviderToken<T>): Promise<T[]> {
    const retrieve = await this.multiResolve(key);
    if (retrieve.length === 0) throw new Error(`No provider found for ${this.extractToken(key).toString()}`);
    return retrieve;
  }

  withDecorator(decorator: Decorator | string): any[] {
    return [];
  }

  private init(context: ModuleContext) {
    this.initProviders(context.providers ?? []);
    this.initImports(context.imports ?? []);
  }

  private initImports(imports: Type<any>[]) {
    imports
      .sort(module => retrieveContext(module)?.order ?? Number.MAX_SAFE_INTEGER * 0.9)
      .forEach(module => {
        const context = retrieveModuleContext(module);
        if (context) {
          const child = new ApplicationContext(context, this.contextReference);
          this.children.push(child);
        }
      });
  }

  private initProviders(providers: Provider[]) {
    this.putDefaultHandler(providers);
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
    const factory = provider.useFactory.bind(provider);
    const name = typeof provider.provide === 'function' ? provider.provide.name : provider.provide;
    let target: Type<any> = factory as unknown as Type<any>;
    if (factory.length === 0) {
      target = ((_: Context) => (factory as Function)()) as unknown as Type<any>;
    }
    PutDesignParam(target, ApplicationContext);
    createComponentDecorator('provider')(target);
    updateContext(
      {
        names: [name]
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

  private useChildren<T>(
    injectable: Promise<any> | undefined,
    token: string | symbol,
    defaultValue: DefaultValue<T> | MultiDefaultValue<T>
  ) {
    return this.applyDefault(injectable, () => {
      return this.applyDefault(
        this.children.find(child => child.has(token))?.resolve(token, defaultValue),
        defaultValue
      );
    });
  }

  private applyDefault<T = any, U = T[]>(
    injectable: Promise<U> | undefined,
    defaultValue: MultiDefaultValue<T>
  ): Promise<U>;
  private applyDefault<T extends any>(
    injectable: Promise<T> | undefined,
    defaultValue: DefaultValue<T>
  ): Promise<Nullable<T>>;
  private async applyDefault<T extends any>(
    injectable: Promise<T> | Promise<T[]> | undefined,
    defaultValue: DefaultValue<T> | MultiDefaultValue<T>
  ): Promise<T[] | Nullable<T>> {
    let bean: T[] | T | undefined = undefined;
    if (injectable) {
      bean = await injectable;
    }
    if ((!bean || (Array.isArray(bean) && bean.length === 0)) && defaultValue) {
      if (typeof defaultValue !== 'function') {
        defaultValue = () => defaultValue as Nullable<T> | Promise<Nullable<T>>;
      }
      return (defaultValue as () => T)();
    }
    return bean;
  }

  private putDefaultHandler(providers: Provider[] = []) {
    providers.push(...provideLifecycle());
  }
}
