import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProblemDetailFilter,
  ProblemDetailTypeUrlResolver,
} from '@sjfrhafe/nest-problem-details';
import * as request from 'supertest';
import { TestController } from './test.controller';
import { TestService } from './test.service';

const urlResolver = (code: number) => `[customurl]/${code}`;

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

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(problemDetailFilter);
    await app.init();
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
    await request(app.getHttpServer())
      .get('/test/problem-detail-exception')
      .expect(400)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        type: 'https://example.com/probs/out-of-credit',
        title: 'You do not have enough credit.',
        detail: 'Your current balance is 30, but that costs 50.',
        instance: '/account/12345/msgs/abc',
      });
  });

  it('catches ProblemDetailException with auto type and instance', async () => {
    await request(app.getHttpServer())
      .get('/test/problem-detail-exception-auto')
      .expect(452)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        type: '[customurl]/452',
        title: 'You do not have enough credit.',
        detail: 'Your current balance is 30, but that costs 50.',
        instance: '/test/problem-detail-exception-auto',
      });
  });

  it('catches build in BadRequestException with custom detail', async () => {
    await request(app.getHttpServer())
      .get('/test/bad-request')
      .expect(400)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        type: '[customurl]/400',
        title: 'Bad Request',
        detail: 'some custom detail',
        instance: '/test/bad-request',
      });
  });

  it('catches build in NotFoundException', async () => {
    await request(app.getHttpServer())
      .get('/test/not-found')
      .expect(404)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        type: '[customurl]/404',
        title: 'Not Found',
        detail: 'Not Found',
        instance: '/test/not-found',
      });
  });

  it('catches no route Not Found', async () => {
    await request(app.getHttpServer())
      .get('/not-found')
      .expect(404)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        type: '[customurl]/404',
        title: 'Not Found',
        detail: 'Cannot GET /not-found',
        instance: '/not-found',
      });
  });

  it('catches raw error', async () => {
    await request(app.getHttpServer())
      .get('/test/raw-error')
      .expect(500)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        type: '[customurl]/500',
        title: 'Internal Server Error',
        detail: 'something went wrong',
        instance: '/test/raw-error',
      });
  });

  it('catches errors thrown in service', async () => {
    await request(app.getHttpServer())
      .get('/test/error-in-service')
      .expect(500)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        type: '[customurl]/500',
        title: 'Internal Server Error',
        detail: 'something went wrong in service',
        instance: '/test/error-in-service',
      });
  });

  it('defaults type if no status code url resolver is provided', async () => {
    problemDetailFilter.overrideUrlResolver(undefined);

    await request(app.getHttpServer())
      .get('/test/raw-error')
      .expect(500)
      .expect('Content-Type', 'application/problem+json; charset=utf-8')
      .expect({
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        detail: 'something went wrong',
        instance: '/test/raw-error',
      });
  });
});
