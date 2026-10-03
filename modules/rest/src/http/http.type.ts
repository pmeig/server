import type { FastifyReply, FastifyRequest } from 'fastify';

export type RestRequest = FastifyRequest;
export type RestResponse = FastifyReply;
export type RestNext = (error?: unknown) => void;

export type RestHandler = (request: RestRequest, response: RestResponse, next: RestNext) => void | Promise<void>;
export type RestErrorHandler = (
  error: Error,
  request: RestRequest,
  response: RestResponse,
  next: RestNext
) => void | Promise<void>;

export interface RestRouteContext {
  controller: any;
  method: string;
}

export interface RestRouteConfig {
  rest?: RestRouteContext;
}

declare module 'fastify' {
  interface FastifyContextConfig extends RestRouteConfig {}
}

export const requestPath = (request: RestRequest): string => {
  const url = request.url;
  const index = url.indexOf('?');
  return index === -1 ? url : url.slice(0, index);
};
