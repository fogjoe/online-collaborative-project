import { IsNotEmpty, IsNumber } from 'class-validator';

export class AssignUserDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
