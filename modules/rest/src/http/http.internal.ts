// Internal to the rest module, not exported from the package.

/** controller and method handling a route, stored in the `config` of the Fastify route */
export interface RestRouteContext {
  controller: any;
  method: string;
}

export interface RestRouteConfig {
  rest?: RestRouteContext;
}
