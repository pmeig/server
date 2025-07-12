import { getTypeOf, Nullable } from '../helper/type.helper';
import { CustomProvider, Provider, ProviderToken, Type } from './provider/provider.type';
import {
  ComponentContext,
  retrieveContext,
  retrieveImport,
  updateContext
} from '../decorators/components/component.helper';
import { createComponentDecorator, Import } from '../decorators/components/component.decorator';
import { PutDesignParam } from '../decorators/global/metadata.decorators';
import { retrieveModuleContext } from './context.decorators';
import { hasDecorator } from '../decorators/decorator.builder';
import { Bootable } from './bootable';
import { Context, DefaultValue, ModuleContext, MultiDefaultValue } from './context.model';
import { ProviderFactory } from './factory/provider.factory';
import { DecoratorRef } from '../decorators/type.decorators';
import { LifecycleModule } from './lifecycle/init-handler.lifecycle';
import { ConverterModule } from './converters/converter.module';
import { ImportFactory } from './factory/import.factory';
import * as crypto from 'node:crypto';

const checked: string[] = [];

export class ApplicationContext implements Context {
  private factories: Record<string | symbol, ComponentContext[]> = {};
  private factoriesOrdered: Record<string | symbol, ComponentContext[]> = {};
  private children: ImportFactory[] = [];
  readonly id: string = crypto.randomUUID();

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
    await this.searchModuleByDecorators();
    const boots = await this.multiResolve(Bootable);
    for (const boot of boots) {
      await boot.run(this, ...args);
    }
    return this;
  }

  async restart() {
    await this.close();
    this.init(this.configuration);
    return this.start();
  }

  async close() {
    const beans = await this.multiResolve(Bootable, []);
    for (const bean of beans) {
      await bean.close(this);
    }
  }

  async has(key: any): Promise<boolean> {
    const token = this.extractToken(key);
    let found = (await this.findFactories(token)).length > 0;
    if (found) return true;
    const modules = await this.findValidChildren();
    if (!found && modules.length > 0) {
      const iterator = [...modules];
      while (!found && iterator.length > 0) {
        const child = iterator.shift()!;
        found = await child.has(key);
      }
    }
    return found;
  }

  async resolve<T>(key: ProviderToken<T>, defaultValue: DefaultValue<T> = undefined): Promise<Nullable<T>> {
    const token = this.extractToken(key);
    if ([ApplicationContext.name, 'Context'].includes(token.toString())) {
      return this as unknown as T;
    }
    const factory = (await this.findAll(token)).shift();
    return this.useChildren(factory?.factory?.build(this.contextReference, token), token, defaultValue).then(value => {
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
    const factories = await this.findAll(token);
    const beans: any[] = [];
    for (const factory of factories) {
      const bean = await factory.factory?.build(this.contextReference, token);
      if (bean) {
        beans.push(bean);
      }
    }
    return this.applyDefault(Promise.resolve(beans), defaultValue);
  }

  async multiResolveRequired<T>(key: ProviderToken<T>): Promise<T[]> {
    const retrieve = await this.multiResolve(key);
    if (retrieve.length === 0) throw new Error(`No provider found for ${this.extractToken(key).toString()}`);
    return retrieve;
  }

  async withDecorator(decorator: DecoratorRef | string): Promise<any[]> {
    const contexts = Object.values(this.factories).flat();
    const beans: any[] = [];
    const factories: ProviderFactory[] = [];
    for (const context of contexts) {
      if (!checked.includes(context.factory?.ref ?? 'error')) {
        checked.push(context.factory?.ref ?? 'unknown');
        if (
          (await context.factory?.isAccessible(this.contextReference)) &&
          typeof context.factory?.type === 'function' &&
          hasDecorator(context.factory.type as Type<any>, decorator)
        ) {
          factories.push(context.factory!);
        }
        checked.pop();
      }
    }

    for (const factory of factories) {
      beans.push(await factory.build(this.contextReference, decorator.toString()));
    }

    for (const module of await this.findValidChildren()) {
      beans.push(...(await module.withDecorator(decorator)));
    }
    return beans;
  }

  private async findAll(key: ProviderToken<any>): Promise<ComponentContext[]> {
    const token = this.extractToken(key);
    // if (this.factoriesOrdered[token]) return this.factoriesOrdered[token];
    const factories = await this.findFactories(token);
    const children = await this.findValidChildren();
    for (const child of children) {
      if (await child.has(token)) {
        factories.push(...(await (child as ApplicationContext).findAll(token)));
      }
    }
    const factoriesOrdered = factories.sort((first, second) => this.sortContext(first, second));
    this.factoriesOrdered[token] = factoriesOrdered;
    return factoriesOrdered;
  }

  private async findFactories(token: string | symbol) {
    const factories: ComponentContext[] = [];
    for (const factory of this.factories[token] ?? []) {
      if (!checked.includes(factory?.factory?.ref ?? 'error')) {
        checked.push(factory?.factory?.ref ?? 'unknown');
        const check = await factory?.factory?.isAccessible(this.contextReference);
        if (check) {
          factories.push(factory!);
        }
        checked.pop();
      }
    }
    return factories;
  }

  private async findValidChildren() {
    const modules: Context[] = [];
    for (const child of this.children) {
      if (!checked.includes(child.ref)) {
        checked.push(child.ref);
        if (await child.isAccessible(this.contextReference)) {
          const module = await child.build();
          if (module) modules.push(module);
        }
        checked.pop();
      }
    }
    return modules;
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
      .map(module => {
        const context = retrieveContext(module) ?? {};
        if (!context.names) {
          context.names = [];
        }
        context.names.push(module.name);
        return {
          type: module,
          context
        };
      })
      .sort((first, second) => this.sortContext(first.context, second.context))
      .forEach(module => {
        const context = retrieveModuleContext(module.type);
        if (context) {
          this.children.push(
            new ImportFactory(module.type, moduleContext =>
              Promise.resolve(new ApplicationContext(moduleContext, this.contextReference))
            )
          );
        }
      });
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
      let context: Context | undefined = undefined;
      let iterator = [...(await this.findValidChildren())];
      while (!context && iterator.length > 0) {
        const child = iterator.shift()!;
        if (await child.has(token)) {
          context = child;
        }
      }
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

  private async searchModuleByDecorators() {
    const modulable = await this.withDecorator(Import);
    for (const module of modulable) {
      const imports = retrieveImport(getTypeOf(module));
      imports.forEach(importable => {
        let context = importable;
        if (typeof importable === 'function') {
          context = retrieveModuleContext(importable) ?? {};
        }
        const child = new ApplicationContext(context as ModuleContext, this.contextReference);
        child.searchModuleByDecorators();
        this.children.push(new ImportFactory(module, () => Promise.resolve(child)));
      });
    }
  }

  private compareOrderContext(
    compare: {
      order?: number;
      after?: string;
      before?: string;
    },
    names: (string | symbol)[]
  ): 'after' | 'before' | number {
    if (compare.after && names.includes(compare.after)) {
      return 'after';
    }
    if (compare.before && names.includes(compare.before)) {
      return 'before';
    }
    return compare.order ?? 0;
  }

  private sortContext(first: ComponentContext, second: ComponentContext) {
    const compareFirst = this.compareOrderContext(first.compare ?? { order: 0 }, second.names ?? []);
    if (typeof compareFirst === 'string') return compareFirst === 'after' ? 0 : -1;
    const compareSecond = this.compareOrderContext(second.compare ?? { order: 0 }, first.names ?? []);
    if (typeof compareSecond === 'string') return compareSecond === 'after' ? -1 : 0;
    return compareFirst - compareSecond;
  }
}
