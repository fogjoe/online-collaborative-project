import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateListDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  boardId: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
