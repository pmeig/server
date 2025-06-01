import { Decorators } from '../decorators/decorator.builder';
import { Type } from './provider/provider.type';
import { getMetadataReflection } from '../decorators/decorators.helper';
import { ModuleContext } from './context.model';

const module_context = 'module:context';

export const Module = (context: ModuleContext) =>
  Decorators.class(Module.name, target => {
    Reflect.defineMetadata(module_context, context, target);
  });

export const retrieveModuleContext = (module: Type<any>) =>
  getMetadataReflection<ModuleContext>(module_context, module);
