import { IssuerProvider } from '../../models/issuer.model';
import { Component, Order } from '@pmeig/srv-core';

@Component
@Order(Number.MAX_SAFE_INTEGER)
export class NoneIssuerProvider extends IssuerProvider {
  getIssuer(): string {
    return '';
  }
}
