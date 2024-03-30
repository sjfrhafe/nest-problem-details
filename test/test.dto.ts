import { IsString } from 'class-validator';

export class TestDto {
  @IsString()
  name: string;
}
