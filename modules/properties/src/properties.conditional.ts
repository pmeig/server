import { AsyncSync, Conditionals, Context, Type } from '@pmeig/srv-core';
import { Environment } from './environment/environment';

export const ConditionalEnvironment = (
  name: string,
  condition: (environment: Environment, target: Type<any>, context: Context) => AsyncSync<boolean>
) =>
  Conditionals.create(name, (target, context) =>
    context.resolveRequired(Environment).then(environment => condition(environment, target, context))
  );
export const Profiles = (...profiles: string[]) =>
  ConditionalEnvironment('Profiles', environment => environment.hasProfiles(...profiles));

export function ConditionalProperties(key: string): ClassDecorator;
export function ConditionalProperties(key: string, expected: string): ClassDecorator;
export function ConditionalProperties(key: string, missing: boolean): ClassDecorator;
export function ConditionalProperties(key: string, expected: string, missing: boolean): ClassDecorator;
export function ConditionalProperties(key: string, expected?: string | boolean, missing: boolean = false) {
  return ConditionalEnvironment('ConditionalProperties', async environment => {
    const value = await environment.find(key);
    if (['undefined', 'object'].includes(typeof value)) return typeof expected === 'boolean' ? expected : missing;
    return String(value) === expected;
  });
}
