import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReorderCardDto } from './dto/reorder-card.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { UpdateCardDto } from './dto/update-card.dto';
import { AssignUserDto } from './dto/assign-user.dto';

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

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    return this.cardService.update(id, updateCardDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cardService.remove(id);
  }

  @Post(':id/assign')
  assignMember(
    @Param('id', ParseIntPipe) cardId: number,
    @Body() dto: AssignUserDto,
  ) {
    return this.cardService.assignMember(cardId, dto);
  }

  // Unassign User
  @Delete(':id/assign/:userId')
  removeMember(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.cardService.removeMember(cardId, userId);
  }

  @Post(':id/labels/:labelId')
  toggleLabel(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('labelId', ParseIntPipe) labelId: number,
  ) {
    return this.cardService.toggleLabel(cardId, labelId);
  }
}
