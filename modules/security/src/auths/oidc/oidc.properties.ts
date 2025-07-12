import { Properties } from '@pmeig/srv-properties';
import { IssuerProvider } from '../../models/issuer.model';

@Properties('security.oidc')
export class OidcProperties extends IssuerProvider {
  credentials = {
    client_id: '',
    client_secret: ''
  };
  url = {
    redirect: '',
    jwks: '',
    issuer: ''
  };
  scope = 'advprofile groups picture email profile';

  getIssuer(): string {
    return this.url.issuer;
  }
}
