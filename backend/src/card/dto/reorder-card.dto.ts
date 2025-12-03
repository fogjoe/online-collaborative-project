import { IsNotEmpty, IsNumber } from 'class-validator';

export class ReorderCardDto {
  @IsNumber()
  @IsNotEmpty()
  cardId: number;

  @IsNumber()
  @IsNotEmpty()
  targetListId: number;

  @IsNumber()
  @IsNotEmpty()
  newOrder: number;
}
