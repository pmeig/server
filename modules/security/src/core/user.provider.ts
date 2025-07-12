import { AsyncSync, Configuration, Nullable } from '@pmeig/srv-core';
import { User } from '../models/user.model';

@Configuration
export class UserProvider<T = any> {
  // noinspection JSUnusedLocalSymbols
  createUser(metadata: T): AsyncSync<Nullable<User>> {
    return undefined;
  }
}
