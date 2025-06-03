import {
  ApplicationContext,
  BeanPost,
  Configuration,
  Decorators,
  getMetadataReflection,
  hasDecorator,
  ProviderType,
  Type
} from '@server/core';
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
  private env?: Environment;
  constructor(private readonly applicationContext: ApplicationContext) {
    super();
  }

  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return hasDecorator(target as Type<any>, Properties.name);
  }

  async postConstruct(target: ProviderType<any>, name: string | symbol, bean: any): Promise<any> {
    const prefix = getMetadataReflection<string>(prefix_key, target)!;
    const env = await this.environment;
    const properties = await env.find<Record<string, any>>(prefix, {});
    this.insertInRecord(bean, properties);
    propertiesRefresh.pipe(filter(env => env instanceof Environment)).subscribe(async value => {
      this.insertInRecord(bean, await value.find(prefix, {}));
    });
    return bean;
  }

  private get environment() {
    if (!this.env) {
      return this.applicationContext.resolveRequired(Environment).then(env => {
        this.env = env;
        return env;
      });
    }
    return Promise.resolve(this.env);
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
