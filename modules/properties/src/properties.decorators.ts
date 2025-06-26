import {
  BeanPost,
  Configuration,
  Decorators,
  getMetadataReflection,
  hasDecorator,
  ProviderType,
  Type
} from '@pmeig/srv-core';
import { Environment } from './environment/environment';
import { propertiesRefresh } from './refresh/properties.refresh';
import { filter } from 'rxjs';

const prefix_key = 'properties:prefix';

export const Properties = (prefix: string) =>
  Decorators.class('Properties', target => {
    Configuration(target);
    Reflect.defineMetadata(prefix_key, prefix, target);
  });

@Configuration
export class PropertiesPost extends BeanPost {
  constructor(private readonly env: Environment) {
    super();
  }

  isHandler(target: ProviderType<any>, _name: string | symbol, _bean: any): boolean {
    return hasDecorator(target as Type<any>, Properties);
  }

  async postConstruct(target: ProviderType<any>, name: string | symbol, bean: any): Promise<any> {
    const prefix = getMetadataReflection<string>(prefix_key, target)!;
    const properties = await this.env.find<Record<string, any>>(prefix, {});
    this.insertInRecord(bean, properties);
    propertiesRefresh.pipe(filter(env => env instanceof Environment)).subscribe(async value => {
      this.insertInRecord(bean, await value.find(prefix, {}));
    });
    return bean;
  }

  private insertInRecord(origin: Record<string, any>, record: Record<string, any>) {
    Object.entries(record).forEach(([key, value]) => {
      let getValue = () => value;
      if (typeof value === 'object') {
        if (!Array.isArray(value)) {
          getValue = () => this.insertInRecord(origin[key] ?? {}, value);
        }
      }
      origin[key] = getValue();
    });
    return origin;
  }
}
