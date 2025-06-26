import { Configuration, Decorators } from '@pmeig/srv-core';
import { advisor_key, advisor_exception_key } from './advisor.services';

export const ControllerAdvisor = (...path: (string | RegExp)[]) =>
  Decorators.class('ControllerAdvisor', target => {
    Configuration(target);
    Reflect.defineMetadata(advisor_key, path, target);
  });

export const ExceptionAdvisor = (exception: ErrorConstructor) =>
  Decorators.method('ExceptionAdvisor', (target, propertyKey) => {
    Reflect.defineMetadata(advisor_exception_key, exception.name, target, propertyKey);
  });
