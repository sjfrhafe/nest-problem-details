import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ProblemDetailException } from './problem-detail.exception';

@Catch()
export class ProblemDetailFilter implements ExceptionFilter<HttpException> {
  constructor(protected urlResolver?: ProblemDetailTypeUrlResolver) {}

  private getTypeUrlForCode = (code: number) => {
    if (this.urlResolver) return this.urlResolver(code);
    return `https://httpstatuses.com/${code}`;
  };

  private handleProblemDetail = (
    e: ProblemDetailException,
    host: ArgumentsHost,
  ) => {
    const { type, title, detail, instance, ...additionalProperties } =
      e.getResponse();

    return host
      .switchToHttp()
      .getResponse()
      .status(e.getStatus())
      .header('Content-Type', 'application/problem+json')
      .json({
        type: type || this.getTypeUrlForCode(e.getStatus()),
        title,
        detail,
        instance: instance || host.switchToHttp().getRequest().url,
        ...additionalProperties,
      });
  };

  private handleHttpException = (e: HttpException, host: ArgumentsHost) =>
    host
      .switchToHttp()
      .getResponse()
      .status(e.getStatus())
      .header('Content-Type', 'application/problem+json')
      .json({
        type: this.getTypeUrlForCode(e.getStatus()),
        title: e.name
          .replace('Exception', '')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .trim(),
        detail: e.message,
        instance: host.switchToHttp().getRequest().url,
      });

  private handleRawError = (e: Error, host: ArgumentsHost) =>
    host
      .switchToHttp()
      .getResponse()
      .status(500)
      .setHeader('Content-Type', 'application/problem+json')
      .json({
        type: this.getTypeUrlForCode(500),
        title: 'Internal Server Error',
        detail: e.message,
        instance: host.switchToHttp().getRequest().url,
      });

  catch(exception: Error, host: ArgumentsHost) {
    if (exception instanceof ProblemDetailException)
      return this.handleProblemDetail(exception, host);

    if (exception instanceof HttpException)
      return this.handleHttpException(exception, host);

    return this.handleRawError(exception, host);
  }
}

export type ProblemDetailTypeUrlResolver = (code: number) => string;
