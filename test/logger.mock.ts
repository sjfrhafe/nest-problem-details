import { LoggerService } from '@nestjs/common';

export const MockedLogger = {
  error: jest.fn(),
} as unknown as LoggerService;
