import {
  retrieveDecorator,
  retrieveElementTypes,
  retrieveOptionals
} from '../../decorators/global/parameter.decorators';
import { retrieveParameterTypes } from '../../decorators/global/metadata.decorators';
import { ProviderToken, ProviderType, Type } from '../provider/provider.type';
import { BeanPost } from '../bean/bean.post';
import { AsyncSync, toPromise } from '../../helper/type.helper';
import { Context } from '../context.model';
import { putRequester } from '../../decorators/conditional/internal.conditional';
import { PMEIG_ADMIN_TOKEN } from '../../decorators/conditional/conditional.helper';
import { retrieveConverters } from '../converters/converter';

interface FactoryConstructorArgumentContext {
  resolve(context: Context): Promise<any>;
  type: string;
}

interface FactoryConstructorContext {
  arguments: FactoryConstructorArgumentContext[];
}

let beanPostExcludes: string[] = [];

export abstract class ConstructorFactory {
  static from(target: ProviderType<any>) {
    if (target.length > 0) {
      if (target.prototype?.constructor) {
        return new ConstructorInjectorFactory();
      }
      return new FunctionConstructorFactory();
    }
    return new EmptyConstructorFactory();
  }

  abstract create<T>(target: ProviderType<T>, context: Context): Promise<T>;

  async build<T extends any>(target: ProviderType<T>, context: Context, name: string | symbol): Promise<T> {
    if (beanPostExcludes.includes(target.name)) {
      return Promise.resolve(undefined as unknown as T);
    }
    putRequester(name);
    let resetBeanPostExclude = () => {};
    if (name === BeanPost.name) {
      const index = beanPostExcludes.push(target.name) - 1;
      resetBeanPostExclude = () => (beanPostExcludes = beanPostExcludes.splice(index, 1));
    }
    const bean = await this.create(target, context);
    resetBeanPostExclude();
    putRequester();
    return this.postConstruct(target, context, bean, name);
  }

  private async postConstruct<T>(
    target: ProviderType<T>,
    context: Context,
    bean: T,
    name: string | symbol
  ): Promise<T> {
    if (name !== BeanPost.name) {
      putRequester(PMEIG_ADMIN_TOKEN);
      const postConstructors = await context.multiResolve(BeanPost, []);
      putRequester();
      for (const postConstructor of postConstructors) {
        if (postConstructor.isHandler(target, name, bean)) {
          bean = (await toPromise(postConstructor.postConstruct(target, name, bean))) as T;
        }
      }
    }
    return bean;
  }
}

class ConstructorInjectorFactory extends ConstructorFactory {
  private context: FactoryConstructorContext = {
    arguments: []
  };

  async create<T>(target: Type<T>, context: Context): Promise<T> {
    const contextConstructor = this.getInjectorArguments(target);
    let index = 0;
    try {
      const args = contextConstructor.map(async (argumentContext, indexArgument) => {
        index = indexArgument;
        return await argumentContext.resolve(context);
      });
      const injectables = await Promise.all(args);
      return new target(...injectables) as T;
    } catch (error) {
      console.error(error);
      throw new Error(`Error while injecting ${contextConstructor[index].type} for ${target.name} at index ${index}`);
    }
  }

  private getInjectorArguments<T>(target: Type<T>) {
    if (this.context.arguments.length === 0) {
      const optionals = retrieveOptionals(target);
      const types = retrieveParameterTypes(target);
      const elements = retrieveElementTypes(target);
      const converters = retrieveConverters(target);
      const decorators = retrieveDecorator(target);
      this.context.arguments = types.map((type, index) => {
        const element = elements.find(element => element.index === index);
        const decorator = decorators[index];
        let resolve = this.extractResolver('resolve', type, index, optionals);
        if (element) {
          resolve = this.extractResolver('multiResolve', element.type, index, optionals);
        }
        if (decorator) {
          resolve = context => context.withDecorator(decorator);
        }
        const converter = converters[index];
        if (converter) {
          const provider = resolve;
          resolve = async (context: Context) => {
            const value = await provider(context);
            if (typeof value === 'undefined') {
              return undefined;
            }
            if (Array.isArray(value)) {
              return value.map(item => converter.to(item));
            }
            return converter.to(value);
          };
        }
        return {
          resolve,
          type: type.name
        };
      });
    }
    return this.context.arguments;
  }

  private extractResolver(
    prefix: 'resolve' | 'multiResolve',
    type: ProviderToken<any>,
    index: number,
    optionals: number[]
  ) {
    if (optionals.includes(index)) {
      return (context: Context) => context[prefix](type);
    }
    // @ts-ignore
    return (context: Context) => context[prefix + 'Required'](type);
  }
}

class EmptyConstructorFactory extends ConstructorFactory {
  create<T>(target: Type<T>, _context: Context): Promise<T> {
    const item = new target() as T;
    return Promise.resolve(item);
  }
}

class FunctionConstructorFactory extends ConstructorFactory {
  create<T extends any>(target: (context: Context) => AsyncSync<T>, context: Context): Promise<T> {
    return Promise.resolve(target(context));
  }
}
