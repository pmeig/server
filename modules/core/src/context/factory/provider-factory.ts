import { Context } from '../application-context';
import { CustomProviderFactory, Type } from '../provider/provider.type';
import { ConstructorFactory } from './constructor.factory';

export type ProviderType<T> = Type<T> | CustomProviderFactory<T>;

export abstract class ProviderFactory<T extends any = any> {
  protected readonly constructorFactory: ConstructorFactory;

  protected constructor(protected readonly type: ProviderType<T>) {
    this.constructorFactory = ConstructorFactory.from(type);
  }

  protected buildBean(context: Context, name: string | symbol): Promise<T | undefined> {
    return this.constructorFactory?.build(this.type as Type<T>, context, name);
  }

  build(context: Context, name: string | symbol): Promise<T | undefined> {
    return this.buildBean(context, name);
  }

  valid(target: object): ProviderFactory<T> | undefined {
    if (typeof this.type === 'function') {
      return this.type.name === (target as { name: string }).name ? this : undefined;
    }
    return target === this.type ? this : undefined;
  }
}

export class RequestProviderFactory<T extends any = any> extends ProviderFactory<T> {
  constructor(type: ProviderType<T>) {
    super(type);
  }
}

export class TransientProviderFactory<T extends any = any> extends ProviderFactory<T> {
  constructor(type: ProviderType<T>) {
    super(type);
  }
}

export class SingletonProviderFactory<T extends any = any> extends ProviderFactory<T> {
  private singleton?: T;
  constructor(type: ProviderType<T>) {
    super(type);
  }

  async buildBean(context: Context, name: string | symbol): Promise<T | undefined> {
    if (!this.singleton) {
      this.singleton = await this.constructorFactory.build(this.type as Type<T>, context, name);
    }
    return this.singleton;
  }
}
