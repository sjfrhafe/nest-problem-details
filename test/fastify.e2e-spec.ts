import { INestApplication } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProblemDetailFilter,
  ProblemDetailTypeUrlResolver,
} from '@sjfrhafe/nest-problem-details';
import * as request from 'supertest';
import { MockedLogger } from './logger.mock';
import { TestController } from './test.controller';
import { TestService } from './test.service';

const urlResolver = (code: number, title: string) =>
  `[customurl]/${code}/${title}`;

class TestProblemDetailFilter extends ProblemDetailFilter {
  public overrideUrlResolver(
    resolver: ProblemDetailTypeUrlResolver | undefined,
  ) {
    this.urlResolver = resolver;
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const problemDetailFilter = new TestProblemDetailFilter(urlResolver);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [TestService],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    problemDetailFilter.setLogger(MockedLogger);

    app.useGlobalFilters(problemDetailFilter);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('does nothing per default', async () => {
    await request(app.getHttpServer())
      .get('/test')
      .expect(200)
      .expect('Hello World!');
  });

  it('catches ProblemDetailException', async () => {
    const expectedResult = {
      status: 400,
      type: 'https://example.com/probs/out-of-credit',
      title: 'You do not have enough credit.',
      detail: 'Your current balance is 30, but that costs 50.',
      instance: '/account/12345/msgs/abc',
    };

    await request(app.getHttpServer())
      .get('/test/problem-detail-exception')
      .expect(400)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect(expectedResult);

    expect(MockedLogger.error).toHaveBeenCalledWith(expectedResult);
  });

  it('catches ProblemDetailException with auto type and instance', async () => {
    const expectedResult = {
      status: 452,
      type: '[customurl]/452/You do not have enough credit.',
      title: 'You do not have enough credit.',
      detail: 'Your current balance is 30, but that costs 50.',
      instance: '/test/problem-detail-exception-auto',
    };

    await request(app.getHttpServer())
      .get('/test/problem-detail-exception-auto')
      .expect(452)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect(expectedResult);

    expect(MockedLogger.error).toHaveBeenCalledWith(expectedResult);
  });

  it('catches build in BadRequestException with custom detail', async () => {
    const expectedResult = {
      status: 400,
      type: '[customurl]/400/Bad Request',
      title: 'Bad Request',
      detail: 'some custom detail',
      instance: '/test/bad-request',
    };

    await request(app.getHttpServer())
      .get('/test/bad-request')
      .expect(400)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect(expectedResult);

    expect(MockedLogger.error).toHaveBeenCalledWith(expectedResult);
  });

  it('catches build in NotFoundException', async () => {
    const expectedResult = {
      status: 404,
      type: '[customurl]/404/Not Found',
      title: 'Not Found',
      detail: 'Not Found',
      instance: '/test/not-found',
    };

    await request(app.getHttpServer())
      .get('/test/not-found')
      .expect(404)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect(expectedResult);

    expect(MockedLogger.error).toHaveBeenCalledWith(expectedResult);
  });

  it('catches no route Not Found', async () => {
    const expectedResult = {
      status: 404,
      type: '[customurl]/404/Not Found',
      title: 'Not Found',
      detail: 'Cannot GET /not-found',
      instance: '/not-found',
    };

    await request(app.getHttpServer())
      .get('/not-found')
      .expect(404)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect(expectedResult);

    expect(MockedLogger.error).toHaveBeenCalledWith(expectedResult);
  });

  it('catches raw error', async () => {
    const expectedResult = {
      status: 500,
      type: '[customurl]/500/Internal Server Error',
      title: 'Internal Server Error',
      detail: 'something went wrong',
      instance: '/test/raw-error',
    };

    await request(app.getHttpServer())
      .get('/test/raw-error')
      .expect(500)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect(expectedResult);

    expect(MockedLogger.error).toHaveBeenCalledWith(expectedResult);
  });

  it('catches errors thrown in service', async () => {
    const expectedResult = {
      status: 500,
      type: '[customurl]/500/Internal Server Error',
      title: 'Internal Server Error',
      detail: 'something went wrong in service',
      instance: '/test/error-in-service',
    };

    await request(app.getHttpServer())
      .get('/test/error-in-service')
      .expect(500)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect(expectedResult);

    expect(MockedLogger.error).toHaveBeenCalledWith(expectedResult);
  });

  it('defaults type if no status code url resolver is provided', async () => {
    problemDetailFilter.overrideUrlResolver(undefined);

    await request(app.getHttpServer())
      .get('/test/raw-error')
      .expect(500)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        status: 500,
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        detail: 'something went wrong',
        instance: '/test/raw-error',
      });
  });
});
