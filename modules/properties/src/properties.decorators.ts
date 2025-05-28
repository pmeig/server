import { createComponentDecorator } from '@server/core';

const prefix_key = 'properties:prefix';

export const Properties = (prefix: string) =>
  createComponentDecorator('properties', target => {
    Reflect.defineMetadata(prefix_key, prefix, target);
  });
