import { getMultiMetadataReflection } from '../decorators.helper';
import { ConditionalExecutor, Conditionals } from './conditional.decorators';
import { randomUUID } from 'crypto';

export const PMEIG_ADMIN_TOKEN = `pmeig:admin_token:${randomUUID().toString()}`;

export const conditional_key = 'conditional:methods';

export const retrieveConditionals = (target: object) =>
  Conditionals.and(...getMultiMetadataReflection<ConditionalExecutor>(conditional_key, target));
