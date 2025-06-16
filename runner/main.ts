import { ApplicationContext, Component, Module, Order, Scope } from '@server/core';
import { randomBytes } from 'crypto';
import { Properties, PropertiesModule } from '@server/properties';
import {
  Controller,
  ControllerAdvisor,
  Delete,
  ExceptionAdvisor,
  Get,
  Param,
  Put,
  Req,
  Res,
  RestModule
} from '@server/rest';
import type { Request, Response } from 'express';

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
  async test(@Req request: Request, @Res response: Response, @Param('nb') params: number) {
    this.testService.test.sub.testing++;
    this.testService.test.message += 5;
    if (this.attempt++ > 2) {
      throw new Error('error throwing');
    }
    return this.testScopedRequest.message;
  }

  @Put('test')
  put() {}

  @Delete('delete')
  delete() {}
}

@ControllerAdvisor('/test')
export class TestAdvisor {
  @ExceptionAdvisor(Error)
  test(error: Error, response: Response) {
    console.log(error);
    return response.send(error.name);
  }
}

@Module({
  imports: [PropertiesModule, RestModule],
  providers: [First, TestController, Props, ScopedRequest, TestService, TestAdvisor]
})
export class ThirdFourthModule {}

export const server = ApplicationContext.run(ThirdFourthModule, process.argv.slice(2));
