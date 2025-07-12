import { AsyncSync, BeanPost, Configuration, Order, ProviderType } from '@pmeig/srv-core';
import { ValidatorProperties } from './validator.properties';
import { randomNonce, randomState } from 'openid-client';

@Configuration
@Order(Number.MAX_SAFE_INTEGER)
export class DefaultValidatorPost extends BeanPost<ValidatorProperties> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return target.name === ValidatorProperties.name;
  }

  postConstruct(
    target: ProviderType<ValidatorProperties>,
    name: string | symbol,
    bean: ValidatorProperties
  ): AsyncSync<ValidatorProperties> {
    if (!bean.nonce) {
      bean.nonce = randomNonce();
      console.log('generated nonce: ', bean.nonce);
    }
    if (!bean.state) {
      bean.state = randomState();
      console.log('generated state: ', bean.state);
    }
    return bean;
  }
}
