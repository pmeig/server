import { JwtProperties } from './jwt.properties';
import { JwtService } from './jwt.service';
import { Module } from '@pmeig/srv-core';
import { JwtManagerModule } from './manager/manager.module';

@Module({
  imports: [JwtManagerModule],
  providers: [JwtProperties, JwtService]
})
export class JwtModule {}
