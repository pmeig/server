import { BeanPost } from '../bean/bean.post';
import { Converter } from './converter';
import { List } from '../../decorators/global/parameter.decorators';
import { ObjectConverter } from './object.converter';
import { ProviderType } from '../provider/provider.type';
import { AsyncSync } from '../../helper/type.helper';
import { Configuration } from '../../decorators/components/component.decorator';
import { Internal } from '../../decorators/conditional/conditional.decorators';
import { RefConverter } from './ref.converter';

@Configuration
@Internal
export class ConverterPost extends BeanPost {
  private readonly converters: Converter<any>[];
  constructor(@List(Converter) converters: Converter<any>[]) {
    super();
    this.converters = converters
      .filter(converter => Object.getPrototypeOf(converter).constructor.name !== ObjectConverter.name)
      .sort(a =>
        Object.getPrototypeOf(a).constructor.name === RefConverter.name
          ? Number.MAX_SAFE_INTEGER
          : Number.MIN_SAFE_INTEGER
      );
  }

  postConstruct(target: ProviderType<any>, name: string | symbol, bean: any): AsyncSync<any> {
    return this.converters.find(converter => converter.hasConverter(bean))?.to(bean) ?? bean;
  }
}
