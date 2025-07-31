import { import_key, inject_key, PutLocationFrom, PutName, PutOrder, PutScope, PutType } from './component.helper';
import { ScopeType, Type } from '../../context/provider/provider.type';
import { ClassDecorator } from '../type.decorators';
import { Decorators } from '../decorator.builder';
import { reflectMultiUpdate, reflectUpdate } from '../decorators.helper';
import { ModuleContext } from '../../context/context.model';

export const Component = Decorators.class('Component', target => PutType(target));

export const Configuration = createComponentDecorator('Configuration');

export const Service = createComponentDecorator('Service');

export const Order = (order: number) => Decorators.class('Order', target => PutOrder(target, order));

export const Before = (target: Type<any>) =>
  Decorators.class('Before', bean => {
    PutLocationFrom('before', target, bean);
  });

export const After = (target: Type<any>) => Decorators.class('After', bean => PutLocationFrom('after', target, bean));

export const Scope = (scope: ScopeType) => Decorators.class('Scope', target => PutScope(target, scope));

export const Named: (...names: string[]) => ClassDecorator = names =>
  Decorators.class('Named', target => PutName(target, names));

export const Inject = (name: string | Type<any>) =>
  Decorators.parameter.generic('Inject', (target, propertyKey, index) => {
    reflectUpdate<Record<number, string | Type<any>>>(
      item => {
        if (!item) {
          item = {};
        }
        item[index] = typeof name === 'string' ? name : name.name;
        return item;
      },
      inject_key,
      target
    );
  });

export const Import = (...modules: (Type<any> | ModuleContext)[]) =>
  Decorators.class('Import', target => {
    Configuration(target);
    reflectMultiUpdate<Type<any> | ModuleContext>(
      items => {
        items.push(...modules);
        return items;
      },
      import_key,
      target
    );
  });

export function createComponentDecorator(name: string, handler: ClassDecorator = () => {}) {
  return Decorators.class(name, target => {
    Component(target);
    handler(target);
  });
}
