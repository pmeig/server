import { Component, Named, Order, Scope } from '@pmeig/srv-core';

export interface Authority {
  name: string;
  description?: string;
  links?: Record<string, any>;
}

export const newAuthority = (name: string, description?: string, links: Record<string, any> = {}) => {
  return {
    name,
    description,
    links
  } as Authority;
};

export interface User {
  name: string;
  token?: string;
  authorities: Authority[];
}

@Scope('request')
@Component
@Named('user')
@Order(Number.MAX_SAFE_INTEGER)
export class UserRequest implements User {
  authorities: Authority[] = [];
  name: string = '';
}
