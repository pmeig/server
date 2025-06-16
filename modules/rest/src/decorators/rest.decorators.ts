import { Configuration, Decorators } from '@server/core';
import { insertMiddleware, OptionsMapper, RequestMapper } from '../rest';
import { HttpStatus, HttpStatusText } from '../models/status.model';
import { RequestHandler } from 'express';

export const Middleware = (middleware: RequestHandler): ClassDecorator | MethodDecorator =>
  insertMiddleware(middleware);

export const Controller = (path: string) =>
  Decorators.class('Controller', target => {
    Configuration(target);
    (RequestMapper(path) as ClassDecorator)(target);
  });
export const Get = (path: string) =>
  Decorators.method('Get', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'GET')(target, propertyKey, descriptor);
  });
export const Post = (path: string) =>
  Decorators.method('Post', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'POST')(target, propertyKey, descriptor);
  });
export const Put = (path: string) =>
  Decorators.method('Put', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'PUT')(target, propertyKey, descriptor);
  });
export const Patch = (path: string) =>
  Decorators.method('Patch', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'PATCH')(target, propertyKey, descriptor);
  });
export const Delete = (path: string) =>
  Decorators.method('Delete', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'DELETE')(target, propertyKey, descriptor);
  });

type StatusParameter<T extends typeof HttpStatus | typeof HttpStatusText> = Omit<
  T,
  'redirect' | 'informational' | 'success' | 'serverError' | 'clientError'
>;

export const Status = (
  code:
    | StatusParameter<typeof HttpStatus>[keyof StatusParameter<typeof HttpStatus>]
    | keyof StatusParameter<typeof HttpStatus>
) =>
  Decorators.method('Status', (target, propertyKey) => {
    OptionsMapper(
      {
        status: typeof code === 'string' ? HttpStatus[code] : code
      },
      target,
      propertyKey
    );
  });

export const Media = (media: string) =>
  Decorators.method('Media', (target, propertyKey) => {
    OptionsMapper(
      {
        media
      },
      target,
      propertyKey
    );
  });
