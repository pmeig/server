import { ProviderFactory, SingletonProviderFactory } from '../../context/factory/provider.factory';
import { ScopeType, Type } from '../../context/provider/provider.type';
import { FactoryProviderScoped } from '../../context/provider-scope';
import {
  getMetadataReflection,
  getMultiMetadataReflection,
  reflectMetadataContext,
  reflectMultiMetadataContext
} from '../decorators.helper';
import { ModuleContext } from '../../context/context.model';
import { Partials } from '../../helper/type.helper';

const context_key = 'components:context';
const context_name = 'components:name';
export const inject_key = 'components:inject';
export const import_key = 'components:import';

export interface ComponentContext {
  names?: (string | symbol)[];
  compare: {
    order?: number;
    after?: string;
    before?: string;
  };
  factory?: ProviderFactory;
  metadata: Record<string, any>;
}

export const PutType = (target: object, metadata: Record<string, any> = {}) => {
  const names = getMultiMetadataReflection<string | symbol>(context_name, target);
  if (names.length === 0) getNameProvider(target).forEach(name => names.push(name));
  updateContext({ metadata, names }, target);
};

export const retrieveContext = (target: object): ComponentContext => {
  return Reflect.getMetadata(context_key, target) as ComponentContext;
};

export const retrieveInject = (target: object) =>
  getMetadataReflection<Record<number, string | Type<any>>>(inject_key, target) ?? {};

export const PutOrder = (target: object, order: number) => {
  updateContext(
    {
      compare: {
        order
      }
    },
    target
  );
};

export const PutLocationFrom = (location: 'before' | 'after', target: Type<any>, bean: Type<any>) => {
  updateContext({ compare: { [location]: target.name } }, bean);
};

export const PutScope = (target: object, scope: ScopeType) => {
  updateContext({ factory: new FactoryProviderScoped[scope](target as Type<any>) }, target);
};

export const PutName = (target: object, ...names: (string | symbol)[]) => {
  const handler = reflectMultiMetadataContext<string | symbol>(context_name, target);
  handler.set(names);
  const handlerContext = reflectMetadataContext<ComponentContext>(context_key, target);
  const context = handlerContext.get() ?? {
    compare: {
      order: 0
    },
    metadata: {}
  };
  context.names = names;
  handlerContext.set(context);
};

export const updateContext = (
  context: Partials<Exclude<ComponentContext, 'factory'>> & Pick<ComponentContext, 'factory'>,
  target: object
) => {
  const previous = Reflect.getMetadata(context_key, target) as ComponentContext;
  const names = new Set(context.names ?? []);
  previous?.names?.forEach(name => names.add(name));
  Reflect.defineMetadata(
    context_key,
    {
      names: [...names],
      factory:
        context.factory?.valid(target) ??
        previous?.factory?.valid(target) ??
        new SingletonProviderFactory(target as Type<any>),
      compare: {
        order: 0,
        ...previous?.compare,
        ...context.compare
      },
      metadata: {
        ...context.metadata,
        ...previous?.metadata
      }
    },
    target
  );
};

export const retrieveImport = (target: object) => {
  return getMultiMetadataReflection<Type<any> | ModuleContext>(import_key, target) ?? [];
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
