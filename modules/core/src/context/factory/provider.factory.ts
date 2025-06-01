import { ProviderType, Type } from '../provider/provider.type';
import { ConstructorFactory } from './constructor.factory';
import { Nullable } from '../../helper/type.helper';
import { Context } from '../context.model';

export abstract class ProviderFactory<T extends any = any> {
  protected readonly constructorFactory: ConstructorFactory;

  protected constructor(public readonly type: ProviderType<T>) {
    this.constructorFactory = ConstructorFactory.from(type);
  }

  protected buildBean(context: Context, name: string | symbol): Promise<Nullable<T>> {
    return this.constructorFactory?.build(this.type as Type<T>, context, name);
  }

  build(context: Context, name: string | symbol): Promise<Nullable<T>> {
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

  async buildBean(context: Context, name: string | symbol): Promise<Nullable<T>> {
    if (!this.singleton) {
      this.singleton = await this.constructorFactory.build(this.type as Type<T>, context, name);
    }
    return this.singleton;
  }
}
