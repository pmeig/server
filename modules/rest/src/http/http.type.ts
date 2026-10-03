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

// Fastify types the `config` of a route (`route({ config })`, `request.routeOptions.config`) with this empty
// interface, made to be extended. The controller / method of each route is stored there, which gives
// `request.routeOptions.config.rest` typed access without casts. It adds an optional `rest` key to
// FastifyContextConfig for every code importing this module.
declare module 'fastify' {
  interface FastifyContextConfig extends RestRouteConfig {}
}

export const requestPath = (request: RestRequest): string => {
  const url = request.url;
  const index = url.indexOf('?');
  return index === -1 ? url : url.slice(0, index);
};
