import { BeanPost, Configuration, Order, ProviderType } from '@pmeig/srv-core';
import { ValidatorProperties } from './validator.properties';
import { randomNonce, randomState } from 'openid-client';
import { Environment } from '@pmeig/srv-properties';

@Configuration
@Order(Number.MAX_SAFE_INTEGER)
export class DefaultValidatorPost extends BeanPost<ValidatorProperties> {
  constructor(private readonly env: Environment) {
    super();
  }

  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return target.name === ValidatorProperties.name;
  }

  async postConstruct(
    target: ProviderType<ValidatorProperties>,
    name: string | symbol,
    bean: ValidatorProperties
  ): Promise<ValidatorProperties> {
    if (!bean.nonce) {
      bean.nonce = randomNonce();
      console.log('generated nonce: ', bean.nonce);
    }
    const auth = await this.env.get('security.auth');
    if (!bean.state && (!auth || auth === 'oidc')) {
      bean.state = randomState();
      console.log('generated state: ', bean.state);
    }
    return bean;
  }
}
