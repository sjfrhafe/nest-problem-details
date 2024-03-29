import { HttpException } from '@nestjs/common';

type ProblemDetailBaseConfig = {
  type?: string;
  title: string;
  detail: string;
  instance?: string;
};

type AdditionalProperties = Record<
  string,
  string | number | string[] | number[]
>;

type ProblemDetailConfig = ProblemDetailBaseConfig & AdditionalProperties;

export class ProblemDetailException extends HttpException {
  constructor(responseCode: number, args: ProblemDetailConfig) {
    super(args, responseCode);
  }

  getResponse(): ProblemDetailConfig {
    return super.getResponse() as ProblemDetailConfig;
  }
}
