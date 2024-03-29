import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { TestService } from './test.service';
import { ProblemDetailException } from '@sjfrhafe/nest-problem-details';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  getHello(): string {
    return this.testService.doSomething();
  }

  @Get('problem-detail-exception')
  getError() {
    throw new ProblemDetailException(400, {
      type: 'https://example.com/probs/out-of-credit',
      title: 'You do not have enough credit.',
      detail: 'Your current balance is 30, but that costs 50.',
      instance: '/account/12345/msgs/abc',
    });
  }

  @Get('problem-detail-exception-auto')
  getErrorAuto() {
    throw new ProblemDetailException(452, {
      title: 'You do not have enough credit.',
      detail: 'Your current balance is 30, but that costs 50.',
    });
  }

  @Get('bad-request')
  getOtherError() {
    throw new BadRequestException('some custom detail');
  }

  @Get('not-found')
  getNotFound() {
    throw new NotFoundException();
  }

  @Get('raw-error')
  getRawError() {
    throw new Error('something went wrong');
  }

  @Get('error-in-service')
  getErrorInService() {
    return this.testService.doError();
  }
}
