import { inject_key, PutName, PutOrder, PutScope, PutType } from './component.helper';
import { ScopeType, Type } from '../../context/provider/provider.type';
import { ClassDecorator } from '../type.decorators';
import { Decorators } from '../decorator.builder';
import { reflectUpdate } from '../decorators.helper';

export const Component = Decorators.class('Component', target => PutType(target));

export const Configuration = createComponentDecorator('Configuration');

export const Order = (order: number) => Decorators.class('Order', target => PutOrder(target, order));

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

export function createComponentDecorator(name: string, handler: ClassDecorator = () => {}) {
  return Decorators.class(name, target => {
    Component(target);
    handler(target);
  });
}
