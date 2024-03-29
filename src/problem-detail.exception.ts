import { HttpException } from '@nestjs/common';

type ProblemDetailBase = {
  type?: string;
  title: string;
  detail: string;
  instance?: string;
};

type AdditionalProperties = Record<
  string,
  string | number | string[] | number[]
>;

export type ProblemDetail = ProblemDetailBase & AdditionalProperties;

export class ProblemDetailException extends HttpException {
  constructor(responseCode: number, args: ProblemDetail) {
    super(args, responseCode);
  }

  getResponse(): ProblemDetail {
    return super.getResponse() as ProblemDetail;
  }
}
