import { AsyncSync, Decorators, reflectMultiUpdate } from '@server/core';
import { Request, Response } from 'express';
import { request_parameter } from './express.resolver';

export const RestDecorators = Object.freeze({
  parameter: (name: string, handler: (request: Request, response: Response) => AsyncSync<any>) =>
    Decorators.parameter.method(name, (target, propertyKey, index) => {
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
    })
});

export const Param = (name: string) =>
  RestDecorators.parameter('Param', request => {
    return request.query[name];
  });
export const Params = RestDecorators.parameter('Params', request => {
  return request.query;
});

export const Path = (name: string) =>
  RestDecorators.parameter(name, request => {
    return request.params[name];
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

export const Req = RestDecorators.parameter('Req', request => {
  return request;
});

export const Res = RestDecorators.parameter('Res', (_, response) => {
  return response;
});
