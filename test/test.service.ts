import { Injectable } from '@nestjs/common';

@Injectable()
export class TestService {
  constructor() {}

  doSomething() {
    return 'Hello World!';
  }

  doError() {
    throw new Error('something went wrong in service');
  }
}
