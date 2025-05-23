import { PutName, PutOrder, PutScope, PutType } from './context.helper';
import { ScopeType } from '../../context/provider/provider.type';
import { ClassDecorator } from '../type.decorators';

export const Priority = Object.freeze({
  custom: Number.MAX_SAFE_INTEGER,
  component: 4,
  service: 3,
  controller: 2,
  properties: 1,
  configuration: Number.MIN_SAFE_INTEGER + 1,
});

export const Properties = (prefix: string) => (target: any) => {
  PutType(target, 'properties', Priority.properties, { prefix });
};

export const Component = (target: object) => PutType(target, 'component', Priority.component);

export const Service = (target: object) => PutType(target, 'service', Priority.service);

export const Controller = (target: object) => PutType(target, 'controller', Priority.controller);

export const Configuration = (target: object) => PutType(target, 'configuration', Priority.configuration);

export const Order = (order: number) => (target: object) => PutOrder(target, order);

export const Scope = (scope: ScopeType) => (target: object) => PutScope(target, scope);

export const Named: (...names: string[]) => ClassDecorator = names => (target: object) => PutName(target, ...names);

export function createComponentDecorator(name: string, priority: number, before: keyof typeof Priority): ClassDecorator;
export function createComponentDecorator(name: string, priority: number | keyof typeof Priority): ClassDecorator;
export function createComponentDecorator(name: string): ClassDecorator;
export function createComponentDecorator(
  name: string,
  priority: number | keyof typeof Priority = 0,
  before: keyof typeof Priority = 'custom'
) {
  if (typeof priority === 'string') {
    before = priority;
    priority = 0;
  }
  priority = priority + Priority[before] * 0.9;
  return (target: object) => {
    PutType(target, name, priority);
  };
}
