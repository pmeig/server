import {
  Configuration,
  Converter,
  getMultiMetadataReflection,
  Internal,
  List,
  retrieveConverters,
  retrieveParameterTypes
} from '@server/core';
import { Request, Response } from 'express';

export const request_parameter = 'request:param';

@Configuration
@Internal
export class ExpressResolver {
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
      const instance = type();
      const converter =
        customConverters[item.index] ??
        customConverters[-1] ??
        this.converters.find(convert => convert.hasConverter(instance));
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
