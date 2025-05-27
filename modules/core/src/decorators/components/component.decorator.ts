import { PutName, PutOrder, PutScope, PutType } from './context.helper';
import { ScopeType } from '../../context/provider/provider.type';
import { ClassDecorator } from '../type.decorators';
import { Decorators } from '../decorator.builder';

export const Component = Decorators.class('Component', target => PutType(target));

export const Configuration = createComponentDecorator('Configuration');

export const Order = (order: number) => Decorators.class('Order', target => PutOrder(target, order));

export const Scope = (scope: ScopeType) => Decorators.class('Scope', target => PutScope(target, scope));

export const Named: (...names: string[]) => ClassDecorator = names =>
  Decorators.class('Named', target => PutName(target, names));

export function createComponentDecorator(name: string, handler: ClassDecorator = () => {}) {
  return Decorators.class(name, target => {
    Component(target);
    handler(target);
  });
}
