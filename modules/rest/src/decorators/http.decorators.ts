import { AsyncSync, Decorators, MethodParameterDecorator, NoConvert, reflectMultiUpdate } from '@pmeig/srv-core';
import { request_parameter } from '../boot/resolver/rest-parameter.resolver';
import type { RestNext, RestRequest, RestResponse } from '../http/http.type';
import { Middleware } from './rest.decorators';

export const RestDecorators = Object.freeze({
  parameter: (
    name: string,
    handler: (request: RestRequest, response: RestResponse) => AsyncSync<any>,
    ...applies: MethodParameterDecorator[]
  ) =>
    Decorators.parameter.method(name, (target, propertyKey, index) => {
      applies.forEach(apply => apply(target, propertyKey, index));
      reflectMultiUpdate(
        items => {
          items.push({
            index,
            handler
          });
          return items;
        },
        request_parameter,
        target,
        propertyKey
      );
    }),
  method: (
    name: string,
    handler: (request: RestRequest, response: RestResponse, next: RestNext) => void,
    ...applies: MethodDecorator[]
  ) =>
    Decorators.method(name, (target, propertyKey, descriptor) => {
      applies.forEach(apply => apply(target, propertyKey, descriptor));
      Middleware((request, response, next) => {
        handler(request, response, next);
      });
    })
});

export const Param = (name: string) =>
  RestDecorators.parameter('Param', request => {
    return (request.query as Record<string, unknown>)[name];
  });
export const Params = RestDecorators.parameter('Params', request => {
  return request.query;
});

export const Path = (name: string) =>
  RestDecorators.parameter(name, request => {
    return (request.params as Record<string, unknown>)[name];
  });

export const Paths = RestDecorators.parameter('Paths', request => {
  return request.params;
});

export const Body = RestDecorators.parameter('Body', request => {
  return request.body;
});

export const Header = (name: string) =>
  RestDecorators.parameter('Header', request => {
    return request.headers[name];
  });

export const Headers = RestDecorators.parameter('Headers', request => {
  return request.headers;
});

export const Req = RestDecorators.parameter(
  'Req',
  request => {
    return request;
  },
  (target, propertyKey, parameterIndex) => NoConvert(target, propertyKey, parameterIndex)
);

export const Res = RestDecorators.parameter(
  'Res',
  (_, response) => {
    return response;
  },
  (target, propertyKey, parameterIndex) => NoConvert(target, propertyKey, parameterIndex)
);
