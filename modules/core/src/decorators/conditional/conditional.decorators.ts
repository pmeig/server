import { Context } from '../../context/context.model';
import { Decorators } from '../decorator.builder';
import { AsyncSync, toPromise } from '../../helper/type.helper';
import { Type } from '../../context/provider/provider.type';
import { DECORATOR_STATE } from '../global/all/all.decorators';
import { reflectMultiMetadataContext } from '../decorators.helper';
import { conditional_key } from './conditional.helper';

export type ConditionalExecutor = (target: Type<any>, context: Context) => AsyncSync<boolean>;
export type PromiseConditionalExecutor = (target: Type<any>, context: Context) => Promise<boolean>;

const conditionalOrSave: ConditionalExecutor[] = [];

export const Conditional = (executor: ConditionalExecutor) =>
  Decorators.class('Conditional', target => {
    let insert = (conditional: ConditionalExecutor) => insertConditional(conditional, target);
    let modifier = (conditional: ConditionalExecutor) => conditional;
    if (DECORATOR_STATE.or) {
      insert = conditional => conditionalOrSave.push(conditional);
      DECORATOR_STATE.complete = () => {
        insertConditional(Conditionals.or(...conditionalOrSave), target);
        while (conditionalOrSave.length > 0) {
          conditionalOrSave.pop();
        }
      };
    }
    if (DECORATOR_STATE.not) {
      modifier = condition => {
        return Conditionals.not(condition);
      };
    }
    insert(modifier(executor));
  });

export const Conditionals = {
  and: (...conditionals: ConditionalExecutor[]) =>
    conditionals.reduce(
      (acc, condition) => {
        const prev = acc;
        return async (type: Type<any>, context: Context) =>
          (await prev(type, context)) && ((await toPromise(condition(type, context))) as boolean);
      },
      () => Promise.resolve(true)
    ) as PromiseConditionalExecutor,
  or: (...conditionals: ConditionalExecutor[]) =>
    conditionals.reduce(
      (acc: (type: Type<any>, context: Context) => Promise<boolean>, condition) => {
        const prev = acc;
        return async (type: Type<any>, context: Context) => {
          const promise = await prev(type, context);
          return promise || ((await toPromise(condition(type, context))) as boolean);
        };
      },
      () => Promise.resolve(false)
    ) as PromiseConditionalExecutor,
  not:
    (conditional: ConditionalExecutor): PromiseConditionalExecutor =>
    (type: Type<any>, context: Context) => {
      return toPromise(conditional(type, context)).then(value => !value) as Promise<boolean>;
    },
  create: (name: string, conditional: ConditionalExecutor) =>
    Decorators.class(name, target => Conditional(conditional)(target))
};

const insertConditional = (conditional: ConditionalExecutor, target: object) => {
  const metadata = reflectMultiMetadataContext<ConditionalExecutor>(conditional_key, target);
  const executor = metadata.get();
  executor.push(conditional);
  metadata.set(executor);
};
