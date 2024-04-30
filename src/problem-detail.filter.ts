import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  LoggerService,
} from '@nestjs/common';
import {
  ProblemDetail,
  ProblemDetailException,
} from './problem-detail.exception';

@Catch()
export class ProblemDetailFilter implements ExceptionFilter<HttpException> {
  private logger: LoggerService;

  constructor(protected urlResolver?: ProblemDetailTypeUrlResolver) {}

  public setLogger(logger: LoggerService) {
    this.logger = logger;
  }

  private logError = (e: ProblemDetail) => {
    if (this.logger) this.logger.error(e);
  };

  private getTypeUrlForCode = (code: number, title: string) => {
    if (this.urlResolver) return this.urlResolver(code, title);
    return `https://httpstatuses.com/${code}`;
  };

  private handleProblemDetail = (
    e: ProblemDetailException,
    host: ArgumentsHost,
  ) => {
    const { type, title, detail, instance, ...additionalProperties } =
      e.getResponse();

    const response = {
      status: e.getStatus(),
      type: type || this.getTypeUrlForCode(e.getStatus(), title),
      title,
      detail,
      instance: instance || host.switchToHttp().getRequest().url,
      ...additionalProperties,
    };

    this.logError(response);

    return host
      .switchToHttp()
      .getResponse()
      .status(e.getStatus())
      .header('Content-Type', 'application/problem+json')
      .send(response);
  };

  private handleBadRequestException = (
    e: BadRequestException,
    host: ArgumentsHost,
  ) => {
    const title = e.name
      .replace('Exception', '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();

    const message = (e.getResponse() as any).message;
    const detail = Array.isArray(message) ? message[0] : message;

    const response = {
      status: e.getStatus(),
      type: this.getTypeUrlForCode(e.getStatus(), title),
      title,
      detail,
      instance: host.switchToHttp().getRequest().url,
    };

    this.logError(response);

    host
      .switchToHttp()
      .getResponse()
      .status(e.getStatus())
      .header('Content-Type', 'application/problem+json')
      .send(response);
  };

  private handleHttpException = (e: HttpException, host: ArgumentsHost) => {
    const title = e.name
      .replace('Exception', '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();

    const response = {
      status: e.getStatus(),
      type: this.getTypeUrlForCode(e.getStatus(), title),
      title,
      detail: e.message,
      instance: host.switchToHttp().getRequest().url,
    };

    this.logError(response);

    host
      .switchToHttp()
      .getResponse()
      .status(e.getStatus())
      .header('Content-Type', 'application/problem+json')
      .send(response);
  };

  private handleRawError = (e: Error, host: ArgumentsHost) => {
    const title = 'Internal Server Error';

    const response = {
      status: 500,
      type: this.getTypeUrlForCode(500, title),
      title,
      detail: e.message,
      instance: host.switchToHttp().getRequest().url,
    };

    this.logError(response);

    host
      .switchToHttp()
      .getResponse()
      .status(500)
      .header('Content-Type', 'application/problem+json')
      .send(response);
  };

  catch(exception: Error, host: ArgumentsHost) {
    if (exception instanceof ProblemDetailException)
      return this.handleProblemDetail(exception, host);

    if (exception instanceof BadRequestException)
      return this.handleBadRequestException(exception, host);

    if (exception instanceof HttpException)
      return this.handleHttpException(exception, host);

    return this.handleRawError(exception, host);
  }
}

export type ProblemDetailTypeUrlResolver = (
  code: number,
  title: string,
) => string;
