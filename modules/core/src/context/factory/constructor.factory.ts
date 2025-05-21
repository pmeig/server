import { retrieveOptionals } from '../../decorators/global/parameter.decorators';
import { retrieveParameterTypes } from '../../decorators/global/metadata.decorators';
import { Type } from '../provider.type';
import { Context } from '../application-context';

interface FactoryConstructorArgumentContext {
  resolve(context: Context): any;
  type: string;
}

interface FactoryConstructorContext {
  arguments: FactoryConstructorArgumentContext[];
}

export abstract class ConstructorFactory {
  abstract build<T extends any>(target: Type<T>, context: Context): T;

  static from(target: Type<any>) {
    if (target.length > 0) {
      return new ConstructorInjectorFactory();
    }
    return new EmptyConstructorFactory();
  }
}

class ConstructorInjectorFactory extends ConstructorFactory {
  private context: FactoryConstructorContext = {
    arguments: [],
  };

  build<T>(target: Type<T>, context: Context): T {
    const contextConstructor = this.getInjectorArguments(target);
    let index = 0;
    try {
      const args = contextConstructor.map((argumentContext, indexArgument) => {
        index = indexArgument;
        return argumentContext.resolve(context);
      });
      return new target(...args) as T;
    } catch (error) {
      throw new Error(`Error while injecting ${contextConstructor[index].type} for ${target.name} at index ${index}`);
    }
  }

  private getInjectorArguments<T>(target: Type<T>) {
    if (this.context.arguments.length === 0) {
      const optionals = retrieveOptionals(target);
      const types = retrieveParameterTypes(target);
      this.context.arguments = types.map((type, index) => {
        let resolve = (context: Context) => context.resolveRequired(type);
        if (optionals.includes(index)) {
          resolve = (context: Context) => context.resolve(type);
        }
        return {
          resolve,
          type: type.name,
        };
      });
    }
    return this.context.arguments;
  }
}

class EmptyConstructorFactory extends ConstructorFactory {
  build<T>(target: Type<T>, context: Context): T {
    return new target() as T;
  }
}
