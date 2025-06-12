import { Nullable, promiseFind } from '../helper/type.helper';
import { CustomProvider, Provider, ProviderToken, Type } from './provider/provider.type';
import { ComponentContext, retrieveContext, updateContext } from '../decorators/components/component.helper';
import { createComponentDecorator, Scope } from '../decorators/components/component.decorator';
import { PutDesignParam } from '../decorators/global/metadata.decorators';
import { retrieveModuleContext } from './context.decorators';
import { hasDecorator } from '../decorators/decorator.builder';
import { Bootable } from './bootable';
import { Context, DefaultValue, ModuleContext, MultiDefaultValue } from './context.model';
import { randomUUID } from 'crypto';
import { affectApplicationContext, putRequester } from '../decorators/conditional/internal.conditional';
import { ProviderFactory } from './factory/provider.factory';
import { DecoratorRef } from '../decorators/type.decorators';
import { PMEIG_ADMIN_TOKEN } from '../decorators/conditional/conditional.helper';
import { LifecycleModule } from './lifecycle/init-handler.lifecycle';
import { ConverterModule } from './converters/converter.module';

export class ApplicationContext implements Context {
  private factories: Record<string | symbol, ComponentContext[]> = {};
  private children: Context[] = [];
  readonly id: string = randomUUID();

  static run(boot: Type<any> | ModuleContext, ...args: any[]) {
    if (typeof boot === 'function') {
      boot = retrieveModuleContext(boot) ?? {};
    }
    return new ApplicationContext(boot).start(...args);
  }

  constructor(
    private readonly configuration: ModuleContext,
    private readonly contextReference: Context = this
  ) {
    this.init(configuration);
  }

  async start(...args: any[]) {
    putRequester(PMEIG_ADMIN_TOKEN);
    const boots = await this.multiResolve(Bootable);
    putRequester();
    for (const boot of boots) {
      putRequester(boot['_myContextId'] ?? this.id);
      await boot.run(this, ...args);
      putRequester();
    }
    return this;
  }

  async restart() {
    await this.close();
    this.init(this.configuration);
    return this.start();
  }

  async close() {
    putRequester(PMEIG_ADMIN_TOKEN);
    const beans = await this.multiResolve(Bootable, []);
    putRequester();
    for (const bean of beans) {
      await bean.close(this);
    }
  }

  async has(key: any): Promise<boolean> {
    const token = this.extractToken(key);
    const factories = await this.findFactories(token);
    return factories.length > 0;
  }

  async resolve<T>(key: ProviderToken<T>, defaultValue: DefaultValue<T> = undefined): Promise<Nullable<T>> {
    const token = this.extractToken(key);
    if ([ApplicationContext.name, 'Context'].includes(token.toString())) {
      return this as unknown as T;
    }
    const factory = (await this.findFactories(token))[0];
    const injectable = factory?.build(this.contextReference, token);
    return this.useChildren(injectable, token, defaultValue).then(value => {
      if (value) {
        value['_myContextId'] = this.id;
      }
      return value;
    });
  }

  async resolveRequired<T>(key: ProviderToken<T>): Promise<T> {
    const resolved = await this.resolve(key);
    if (!resolved) throw new Error(`No provider found for ${this.extractToken(key).toString()}`);
    return resolved;
  }

  async multiResolve<T>(key: ProviderToken<T>, defaultValue: MultiDefaultValue<T> = []): Promise<T[]> {
    const token = this.extractToken(key);
    if ([ApplicationContext.name, 'Context'].includes(token.toString())) return [this as unknown as T];
    const factories = await this.findFactories(token);
    const beans = await this.applyDefault<T>(
      Promise.all(factories.map(factory => factory.build(this.contextReference, token))).then(resolved =>
        resolved.filter(bean => !!bean)
      ),
      defaultValue
    ).then(resolved => {
      resolved.forEach(bean => (bean['_myContextId'] = this.id));
      return resolved;
    });
    const others = await Promise.all(this.children.map(module => module.multiResolve<T>(token, [])));
    return this.applyDefault(Promise.resolve(beans.concat(others.flat())), defaultValue);
  }

  async multiResolveRequired<T>(key: ProviderToken<T>): Promise<T[]> {
    const retrieve = await this.multiResolve(key);
    if (retrieve.length === 0) throw new Error(`No provider found for ${this.extractToken(key).toString()}`);
    return retrieve;
  }

  async withDecorator(decorator: DecoratorRef | string): Promise<any[]> {
    const beans = await Promise.all(
      Object.values(this.factories)
        .flatMap(factories => factories)
        .filter(factory => {
          const type = factory.factory?.type;
          if (typeof type === 'function') {
            return hasDecorator(type as Type<any>, decorator);
          }
          return false;
        })
        .map(factory => factory.factory!.build(this.contextReference, factory.factory!.type.name))
    );
    const others = (await Promise.all(this.children.map(module => module.withDecorator(decorator)))).flatMap(
      value => value
    );
    return beans.concat(others);
  }

  private async findFactories(token: string | symbol) {
    const factories: ProviderFactory[] = [];
    for (const factory of (this.factories[token] ?? []).map(factory => factory.factory)) {
      if ((await factory?.isAccessible(this)) ?? false) {
        factories.push(factory!);
      }
    }
    return factories;
  }

  private init(context: ModuleContext) {
    const instance = { ...context };
    this.factories = {};
    this.children = [];
    this.initProviders(instance.providers ?? []);
    this.initImports(instance.imports ?? []);
  }

  private initImports(imports: Type<any>[]) {
    if (this.id === this.contextReference.id) {
      imports.unshift(LifecycleModule, ConverterModule);
    }
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
    providers.forEach(provider => {
      let targetProvider = provider;
      if (typeof provider !== 'function') {
        targetProvider = this.prepareCustomProvider(provider);
      }
      affectApplicationContext(targetProvider as Type<any>, this);
      const metadata = retrieveContext(targetProvider);
      metadata.names?.forEach(name => {
        affectApplicationContext(name, this);
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
    return this.applyDefault(injectable, async () => {
      const context = await promiseFind(this.children, child => child.has(token));
      return this.applyDefault(context?.resolve(token, defaultValue), defaultValue);
    }) as Promise<T>;
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
    if (defaultValue && (typeof bean === 'undefined' || (Array.isArray(bean) && bean!.length === 0))) {
      return typeof defaultValue === 'function' ? (defaultValue as () => Promise<T | Nullable<T>>)() : defaultValue;
    }
    return bean;
  }
}
