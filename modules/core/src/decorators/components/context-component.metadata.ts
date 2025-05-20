import 'reflect-metadata';
import { ProviderFactory, SingletonProviderFactory } from '../../context/factory/provider.factory';
import { ScopeType, Type } from '../../context/provider.type';
import { FactoryProviderScoped } from '../../context/factory/provider-scope.factory';

const context_key = 'components:context';

export interface ComponentContext {
  type?: string;
  priority?: number;
  order?: number;
  factory?: ProviderFactory;
  metadata: Record<string, any>;
}

export const ContextComponentMetadata = (target: object, type: string, priority: number, metadata: Record<string, any> = {}) => {
  updateContext({ type, priority, metadata }, target);
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

const updateContext = (context: Partial<ComponentContext>, target: object) => {
  const previous = Reflect.getMetadata(context_key, target) as ComponentContext;
  Reflect.defineMetadata(
    context_key,
    {
      factory: context.factory ?? previous?.factory ?? new SingletonProviderFactory(target as Type<any>),
      type: context.type ?? previous?.type,
      priority: context.priority ?? previous?.priority,
      order: context.order ?? previous?.order,
      metadata: context.metadata ?? previous?.metadata ?? {},
    },
    target
  );
};
