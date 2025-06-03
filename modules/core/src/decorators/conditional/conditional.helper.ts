import { getMultiMetadataReflection } from '../decorators.helper';
import { ConditionalExecutor, Conditionals } from './conditional.decorators';

export const conditional_key = 'conditional:methods';

export const retrieveConditionals = (target: object) =>
  Conditionals.and(...getMultiMetadataReflection<ConditionalExecutor>(conditional_key, target));
