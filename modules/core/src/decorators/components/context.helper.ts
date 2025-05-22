import 'reflect-metadata';
import { ProviderFactory, SingletonProviderFactory } from '../../context/factory/provider-factory';
import { ScopeType, Type } from '../../context/provider/provider.type';
import { FactoryProviderScoped } from '../../context/factory/provider-scope';

const context_key = 'components:context';

export interface ComponentContext {
  type?: string;
  names?: (string | symbol)[];
  priority: number;
  order: number;
  factory?: ProviderFactory;
  metadata: Record<string, any>;
}

export const PutType = (target: object, type: string, priority: number, metadata: Record<string, any> = {}) => {
  updateContext({ type, priority, metadata, names: getNameProvider(target) }, target);
};

export const retrieveContext = (target: object): ComponentContext => {
  return Reflect.getMetadata(context_key, target) as ComponentContext;
};

export const PutOrder = (target: object, order: number) => {
  updateContext({ order }, target);
};

export const PutScope = (target: object, scope: ScopeType) => {
  updateContext({ factory: new FactoryProviderScoped[scope](target as Type<any>) }, target);
};

export const updateContext = (context: Partial<ComponentContext>, target: object) => {
  const previous = Reflect.getMetadata(context_key, target) as ComponentContext;
  Reflect.defineMetadata(
    context_key,
    {
      names: context.names ?? previous?.names,
      factory:
        context.factory?.valid(target) ??
        previous?.factory?.valid(target) ??
        new SingletonProviderFactory(target as Type<any>),
      type: context.type ?? previous?.type,
      priority: context.priority ?? previous?.priority ?? 0,
      order: context.order ?? previous?.order ?? 0,
      metadata: context.metadata ?? previous?.metadata ?? {},
    },
    target
  );
};

const getNameProvider = (target: object) => {
  const names: string[] = [];
  let prototype: { name: string | undefined } = target as { name: string | undefined };
  while (prototype.name) {
    names.push(prototype.name);
    prototype = Object.getPrototypeOf(prototype);
  }
  return names;
};
