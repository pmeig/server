import {
  Decorators,
  getMetadataReflection,
  Partials,
  reflectMetadataContext,
  reflectUpdate,
  Type
} from '@pmeig/srv-core';
import { Method } from './models/rest.type';
import type { RestErrorHandler, RestHandler } from './http/http.type';
import { HttpStatus, HttpStatusCode } from './models/status.model';
import { MediaType } from './models/media.model';

const rest_key = 'rest:mapper';
const rest_middleware_key = 'rest:middleware';
const rest_error_middleware_key = 'rest:error-middleware';

export interface RestMapper {
  path?: string;
  options: {
    status: HttpStatusCode;
    media: string;
    method: Method;
  };
}

const updateRestMapper = (item: Partials<RestMapper>, target: object, propertyKey?: string | symbol) => {
  reflectUpdate<RestMapper>(
    origin => {
      if (!origin) {
        origin = {
          options: {
            status: HttpStatus.OK,
            media: MediaType.JSON,
            method: 'GET'
          }
        };
      }
      return {
        path: item.path ?? origin.path,
        options: {
          ...origin.options,
          ...item.options
        }
      };
    },
    rest_key,
    target,
    propertyKey
  );
};

export const RequestMapper = (path: string = '', method: Method = 'GET') =>
  Decorators.all('RequestMapper', (target, propertyKey) => {
    updateRestMapper(
      {
        path,
        options: {
          method
        }
      },
      target,
      propertyKey
    );
  }) as ClassDecorator & MethodDecorator;

export const OptionsMapper = (
  options: Partial<RestMapper['options']>,
  target: object,
  propertyKey?: string | symbol
) => {
  updateRestMapper(
    {
      options
    },
    target,
    propertyKey
  );
};

export const retrieveRestConfig = (target: Type<any>, propertyKey?: string | symbol) =>
  getMetadataReflection<RestMapper>(rest_key, target, propertyKey);

export const insertMiddleware = (middleware: RestHandler): ClassDecorator | MethodDecorator =>
  Decorators.all('Middleware', (target: Type<any>, propertyKey?: string | symbol) => {
    reflectMetadataContext(rest_middleware_key, target, propertyKey).set(middleware);
  });

export const insertErrorMiddleware = (middleware: RestErrorHandler): ClassDecorator | MethodDecorator =>
  Decorators.all('ErrorMiddleware', (target: Type<any>, propertyKey?: string | symbol) => {
    reflectMetadataContext(rest_middleware_key, target, propertyKey).set(middleware);
  });

export const retrieveMiddleware = (target: Type<any>, propertyKey?: string | symbol) =>
  getMetadataReflection<RestHandler>(rest_middleware_key, target, propertyKey);

export const retrieveErrorMiddleware = (target: Type<any>, propertyKey?: string | symbol) =>
  getMetadataReflection<RestErrorHandler>(rest_error_middleware_key, target, propertyKey);
