import { Properties } from '@pmeig/srv-properties';

@Properties('security.validator')
export class ValidatorProperties {
  nonce: string;
  state: string;
}
