import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReorderCardDto } from './dto/reorder-card.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  create(@Body() createCardDto: CreateCardDto) {
    return this.cardService.create(createCardDto);
  }

  @Patch('reorder')
  @ResponseMessage('Card moved successfully')
  reorder(@Body() reorderCardDto: ReorderCardDto) {
    return this.cardService.reorder(reorderCardDto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.cardService.toggle(id);
  }
}
