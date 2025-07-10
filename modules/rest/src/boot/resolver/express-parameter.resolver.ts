import {
  Configuration,
  Converter,
  getMultiMetadataReflection,
  List,
  retrieveConverters,
  retrieveParameterTypes,
  Type
} from '@pmeig/srv-core';
import type { Request, Response } from 'express';

export const request_parameter = 'request:param';

@Configuration
export class ExpressParameterResolver {
  private readonly converters: Converter<any>[] = [];
  constructor(@List(Converter) converters: Converter<any>[]) {
    this.converters = converters;
  }

  resolve(target: any, name: string | symbol) {
    const metadata = getMultiMetadataReflection<{
      index: number;
      handler: (request: Request, response: Response) => any;
    }>(request_parameter, target, name);
    const types = retrieveParameterTypes(target, name);
    const customConverters = retrieveConverters(target, name) ?? {};
    const params = metadata.map(item => {
      const type = types[item.index];
      let converter: Converter<any> | undefined = customConverters[item.index] ?? customConverters[-1];
      if (!converter) {
        let instance: any;
        try {
          instance = type();
        } catch (error) {
          if (error.message.includes('cannot be invoked without "new"')) {
            instance = new (type as Type<any>)();
          }
        }
        converter = this.converters.find(convert => convert.hasConverter(instance));
      }
      if (!converter) {
        return (request: Request, response: Response, params: any[]) => {
          params[item.index] = item.handler(request, response);
          return params;
        };
      }
      return (request: Request, response: Response, params: any[]) => {
        params[item.index] = converter.to(item.handler(request, response));
        return params;
      };
    });
    return params.reduce(
      (acc: (request: Request, response: Response) => any[], setter) => {
        const origin = acc;
        return (request, response) => setter(request, response, origin(request, response));
      },
      request => Array(types.length).fill(request.body)
    ) as (request: Request, response: Response) => any[];
  }
}
