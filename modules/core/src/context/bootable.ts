import { Context } from './application-context';

export abstract class Bootable {
  abstract run(context: Context, ...args: any[]): Promise<void>;
}
