import { ApplicationRegistrar } from './application.registrar';
import { Context } from '../context.model';

export abstract class Registrar {
  abstract registrar(registrar: ApplicationRegistrar, context: Context): Promise<void>;
}