import { Context } from '../context.model';
import { Provider, ScopeType, Type } from '../provider/provider.type';
import { Component, Configuration, Import } from '../../decorators/components/component.decorator';
import { Module } from '../context.decorators';

// noinspection JSMismatchedCollectionQueryUpdate
@Configuration
@Module({})
export class ApplicationRegistrar {
  private providers: Provider[] = [];
  private imports: Type<any>[] = [];
  private reload: boolean = true;

  register(name: string, bean: any | ((context: Context) => any), scope?: ScopeType): void;
  register(provide: Provider): void;
  register(name: string | Provider, bean?: any | ((context: Context) => any), scope: ScopeType = 'singleton') {
    this.reload = true;
    let provider = name;
    if (typeof name === 'string') {
      provider = { provide: name, useFactory: typeof bean === 'function' ? bean : () => bean, scope };
    } else if (typeof name === 'function') {
      Component(name);
    }
    this.providers.push(provider as Provider);
  }

  import(importBean: Type<any>): void {
    this.reload = true;
    Import(importBean);
    this.imports.push(importBean);
  }
}