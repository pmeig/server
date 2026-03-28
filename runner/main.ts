import { ApplicationContext, Component, Import, Module, Order, Scope } from '@pmeig/srv-core';
import { randomBytes } from 'crypto';
import { Properties, PropertiesModule } from '@pmeig/srv-properties';
import { Catch, Controller, ControllerAdvisor, Delete, Get, Params, Put, Req, Res, RestModule } from '@pmeig/srv-rest';
import type { Request, Response } from 'express';
import { Public, SecurityModule } from '@pmeig/srv-security';

interface Named {
  name: string;
}

@Component
@Order(-5)
class First implements Named {
  name = 'first';
  id = randomBytes(16).toString('hex');

  toString(): string {
    return this.name;
  }
}

@Properties('test.properties')
export class Props {
  test = 'test';
  toto = 'toto';
  popo = 'popo';
  lolo = 'lolo';
}

@Properties('check')
export class CheckContinue {
  continue = true;
}

@Component
@Scope('request')
export class ScopedRequest {
  message = 0;
  sub = {
    testing: 10
  };
}

@Component
export class TestService {
  constructor(public readonly test: ScopedRequest) {}
}

@Module({})
export class FirstSecondModule {}

@Import(FirstSecondModule)
export class InjectModule {}

@Controller('test')
export class TestController {
  private attempt = 0;
  constructor(
    private readonly props: Props,
    private readonly context: ApplicationContext,
    private readonly testScopedRequest: ScopedRequest,
    private readonly testService: TestService
  ) {}

  @Get(':id/:number')
  @Public
  async test(@Req request: Request, @Res response: Response, @Params params: Record<string, any>) {
    this.testService.test.sub.testing++;
    this.testService.test.message += 5;
    if (this.attempt++ > 2) {
      throw new Error('error throwing');
    }
    return this.testService.test;
  }

  @Put('test')
  put() {}

  @Delete('delete')
  delete() {}
}

@ControllerAdvisor()
export class TestAdvisor {
  @Catch(Error)
  test(error: Error, response: Response) {
    return response.send(error.message);
  }
}

@Module({
  imports: [PropertiesModule, RestModule, SecurityModule],
  providers: [First, TestController, Props, ScopedRequest, TestService, TestAdvisor, InjectModule]
})
export class ThirdFourthModule {}

export const server = ApplicationContext.run(ThirdFourthModule, process.argv.slice(2));
