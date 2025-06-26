import { getMetadataReflection, getMultiMetadataReflection } from '@pmeig/srv-core';

export const advisor_key = 'advisor:controller';
export const advisor_exception_key = 'advisor:exception';

export const retrievePathAdvisor = (target: object) => getMultiMetadataReflection<RegExp | string>(advisor_key, target);

export const retrieveExceptionAdvisor = (target: object, propertyKey: string | symbol) =>
  getMetadataReflection<string>(advisor_exception_key, target, propertyKey);
