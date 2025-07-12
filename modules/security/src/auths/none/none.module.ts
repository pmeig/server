import { NoneIssuerProvider } from './none-issuer.provider';
import { NoneAuthService } from './none-auth.service';
import { Module } from '@pmeig/srv-core';

@Module({
  providers: [NoneIssuerProvider, NoneAuthService]
})
export class NoneModule {}
