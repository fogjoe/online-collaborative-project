import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('cards')
@UseGuards(AuthGuard('jwt'))
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  create(@Body() createCardDto: CreateCardDto, @Req() req: any) {
    return this.cardsService.create(createCardDto, req.user.id);
  }

  @Get()
  findAll(@Query('listId') listId: string) {
    return this.cardsService.findAllByList(listId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateCardDto,
    @Req() req: any,
  ) {
    return this.cardsService.update(id, updateCardDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cardsService.remove(id);
  }
}
