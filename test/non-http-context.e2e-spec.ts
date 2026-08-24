import { ArgumentsHost } from '@nestjs/common';
import { ProblemDetailFilter } from '@sjfrhafe/nest-problem-details';
import { MockedLogger } from './logger.mock';

const urlResolver = (code: number, title: string) =>
  `[customurl]/${code}/${title}`;

describe('ProblemDetailFilter in non-HTTP contexts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not throw a secondary error when handling raw errors outside HTTP', () => {
    const filter = new ProblemDetailFilter(urlResolver);
    filter.setLogger(MockedLogger);
    const exception = new Error('consumer failed');
    const host = {
      getType: () => 'rpc',
      switchToHttp: () => ({
        getRequest: () => undefined,
        getResponse: () => ({}),
      }),
    } as unknown as ArgumentsHost;

    expect(() => filter.catch(exception, host)).not.toThrow();
    expect(MockedLogger.error).toHaveBeenCalledWith({
      status: 500,
      type: '[customurl]/500/Internal Server Error',
      title: 'Internal Server Error',
      detail: 'consumer failed',
    });
  });
});
