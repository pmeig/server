import { Context, DefaultValue, MultiDefaultValue } from '../context.model';
import { ProviderToken } from '../provider/provider.type';
import { Nullable } from '../../helper/type.helper';
import { DecoratorRef } from '../../decorators/type.decorators';
import { ApplicationRegistrar } from './application.registrar';
import { ApplicationContext } from '../application.context';
import { ComponentContext } from '../../decorators/components/component.helper';
import { Module } from '../context.decorators';

@Module({})
export class ApplicationContextRegistrar implements Context {
  private delegate: Context;

  constructor(
    private readonly registrar: ApplicationRegistrar,
    private readonly contextReference: Context
  ) {}

  resolve<T>(key: ProviderToken<T>, defaultValue: DefaultValue<T> | undefined): Promise<Nullable<T>> {
    return this.apply('resolve', key, defaultValue);
  }

  has(key: ProviderToken<any>): Promise<boolean> {
    return this.apply('has', key);
  }

  get id(): string {
    return this.delegate.id;
  }

  multiResolve<T>(key: ProviderToken<T>, defaultValue: MultiDefaultValue<T> | undefined): Promise<T[]> {
    return this.apply('multiResolve', key, defaultValue);
  }

  multiResolveRequired<T>(key: ProviderToken<T>): Promise<T[]> {
    return this.apply('multiResolveRequired', key);
  }

  resolveRequired<T>(key: ProviderToken<T>): Promise<T> {
    return this.apply('resolveRequired', key);
  }

  withDecorator(decorator: DecoratorRef | string): Promise<any[]> {
    return this.apply('withDecorator', decorator);
  }

  // noinspection JSUnusedLocalSymbols
  private async findAllContext(token: string | symbol): Promise<ComponentContext[]> {
    return this.apply('findAllContext', token);
  }

  private apply<T>(propertyName: 'findAllContext', ...parameters: any[]): Promise<ComponentContext[]>;
  private apply<T>(propertyName: 'withDecorator', ...parameters: any[]): Promise<any[]>;
  private apply<T>(propertyName: 'has', ...parameters: any[]): Promise<boolean>;
  private apply<T>(propertyName: 'resolveRequired', ...parameters: any[]): Promise<T>;
  private apply<T>(propertyName: 'resolve', ...parameters: any[]): Promise<Nullable<T>>;
  private apply<T>(propertyName: 'multiResolve' | 'multiResolveRequired', ...parameters: any[]): Promise<T[]>;
  private apply<T>(
    propertyName: keyof ApplicationContext | 'findAllContext',
    ...parameters: any[]
  ): Promise<Nullable<T> | T[]> {
    if (this.registrar['reload']) {
      this.registrar['reload'] = false;
      this.delegate = new ApplicationContext(
        new Proxy(
          {
            providers: [],
            imports: []
          },
          {
            get: (_, property, receiver) => {
              return Reflect.get(this.registrar, property, receiver);
            }
          }
        ),
        this.contextReference
      );
    }
    return this.delegate[propertyName].bind(this.delegate)(...parameters);
  }
}