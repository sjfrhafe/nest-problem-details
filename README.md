# Nest Problem Details

## Overview

This library provides tools to easily use the Problem Details standard for HTTP APIs as specified in [rfc9457](https://datatracker.ietf.org/doc/html/rfc9457#name-introduction) in NestJS. It provides support for both Express and Fastify.

## Functionalties

- Adjustable ProblemDetailsException
- Converting every thrown error in custom detail format
- Automatically handling HttpExceptions from `@nestjs/common` like `BadRequestException`
- Validation Pipe support
- Autogenerating type URL
- Extensible type URL logic
- Overriding content-type header
- Express and Fastify support

## Getting started

The heart of the library is the exception filter. It's added to bootstrap method in `main.ts` as a global exception filter.

```js
//...
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new ProblemDetailFilter());

  await app.listen(3000);
}
//...
```

Each error thrown is now returned in problem details formatting.

### ProblemDetailException (auto type and instance)

```js
throw new ProblemDetailException(403, {
  title: 'Forbidden',
  detail: 'You are not allowed to access this resource',
});
```

results in

```json
{
  "status": 403,
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "detail": "You are not allowed to access this resource",
  "instance": "cat/sam"
}
```

### ProblemDetailException (additional custom args)

```js
throw new ProblemDetailException(401, {
  type: 'https://example.com/errors/auth',
  title: 'JWT Expired',
  detail: `The provided JWT expired ${expired} minutes ago`,
  instance: 'profile/me',
  customHint: 'try to refresh you token',
});
```

results in

```json
{
  "status": 401,
  "type": "https://example.com/errors/auth",
  "title": "JWT Expired",
  "detail": "The provided JWT expired 4 minutes ago",
  "instance": "profile/me",
  "customHint": "try to refresh your token"
}
```

### Validation Pipe BadRequestExceptions

`test.dto.ts`

```js
import { IsString } from 'class-validator';

export class TestDto {
  @IsString()
  name: string;
}
```

`test.controller.ts`

```js
@Post()
  postHello(@Body() dto: TestDto): string {
    //do something with dto
  }
```

results in

```json
{
  "status": 400,
  "type": "https://httpstatuses.com/400",
  "title": "Bad Request",
  "detail": "name must be a string",
  "instance": "/"
}
```

### NestJS HttpExceptions

```js
new BadRequestException('some error');
```

results in

```json
{
  "status": 400,
  "type": "https://httpstatuses.com/400",
  "title": "Bad Request",
  "detail": "some error",
  "instance": "/"
}
```

### Raw Errors

```js
new Error('some error');
```

results in

```json
{
  "status": 500,
  "type": "https://httpstatuses.com/500",
  "title": "Internal Server Error",
  "detail": "some error",
  "instance": "/"
}
```

## Customize auto type generation

You can customize the auto generated type url by providing a `ProblemDetailTypeUrlResolver`.

```ts
const typeUrlResolver = (code: number, title: string) =>
  `https://example.com/errors/${code}`;

app.useGlobalFilters(new TestProblemDetailFilter(typeUrlResolver));
```

## Disclaimer

This open-source library is provided as-is, without any express or implied warranties. The author(s) of this library shall not be held responsible for any direct, indirect, incidental, special, exemplary, or consequential damages arising from the use of this library, including but not limited to, procurement of substitute goods or services, loss of use, data, or profits, or business interruption. Users are encouraged to thoroughly test the library in their own environments and use it at their own risk. Additionally, it is recommended to review the license and terms of use associated with this library before incorporating it into any projects.
