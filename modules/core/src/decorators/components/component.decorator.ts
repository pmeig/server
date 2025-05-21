import { PutType, PutOrder, PutScope } from './context.helper';
import { ScopeType } from '../../context/provider.type';

export const Priority = Object.freeze({
  custom: Number.MAX_SAFE_INTEGER,
  component: 3,
  service: 2,
  controller: 1,
  properties: 0,
});

export const Properties = (prefix: string) => (target: any) => {
  PutType(target, 'properties', Priority.properties, { prefix });
};

export const Component = (target: object) => PutType(target, 'component', Priority.component);

export const Service = (target: object) => PutType(target, 'service', Priority.service);

export const Controller = (target: object) => PutType(target, 'controller', Priority.controller);

export const Order = (order: number) => (target: object) => PutOrder(target, order);

export const Scope = (scope: ScopeType) => (target: object) => PutScope(target, scope);

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
