import { retrieveElementTypes, retrieveOptionals } from '../../decorators/global/parameter.decorators';
import { retrieveParameterTypes } from '../../decorators/global/metadata.decorators';
import { ProviderToken, Type } from '../provider/provider.type';
import { Context } from '../application-context';
import { ProviderType } from './provider-factory';

interface FactoryConstructorArgumentContext {
  resolve(context: Context): Promise<any>;
  type: string;
}

interface FactoryConstructorContext {
  arguments: FactoryConstructorArgumentContext[];
}

export abstract class ConstructorFactory {
  abstract build<T extends any>(target: ProviderType<T>, context: Context): Promise<T>;

  static from(target: ProviderType<any>) {
    if (target.length > 0) {
      if (target.prototype?.constructor) {
        return new ConstructorInjectorFactory();
      }
      return new FunctionConstructorFactory();
    }
    return new EmptyConstructorFactory();
  }
}

class ConstructorInjectorFactory extends ConstructorFactory {
  private context: FactoryConstructorContext = {
    arguments: [],
  };

  async build<T>(target: Type<T>, context: Context): Promise<T> {
    const contextConstructor = this.getInjectorArguments(target);
    let index = 0;
    try {
      const args = contextConstructor.map(async (argumentContext, indexArgument) => {
        index = indexArgument;
        return await argumentContext.resolve(context);
      });
      const values_1 = await Promise.all(args);
      return new target(...values_1) as T;
    } catch (error) {
      throw new Error(`Error while injecting ${contextConstructor[index].type} for ${target.name} at index ${index}`);
    }
  }

  private getInjectorArguments<T>(target: Type<T>) {
    if (this.context.arguments.length === 0) {
      const optionals = retrieveOptionals(target);
      const types = retrieveParameterTypes(target);
      const elements = retrieveElementTypes(target);
      this.context.arguments = types.map((type, index) => {
        const element = elements.find(element => element.index === index);
        let resolve = this.extractResolver('resolve', type, index, optionals);
        if (element) {
          resolve = this.extractResolver('multiResolve', element.type, index, optionals);
        }
        return {
          resolve,
          type: type.name,
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
    return (context: Context) => context[prefix + 'Required'](type);
  }
}

class EmptyConstructorFactory extends ConstructorFactory {
  build<T>(target: Type<T>, context: Context): Promise<T> {
    return Promise.resolve(new target() as T);
  }
}

class FunctionConstructorFactory extends ConstructorFactory {
  build<T extends any>(target: (context: Context) => Promise<T> | T, context: Context): Promise<T> {
    return Promise.resolve(target(context));
  }
}
