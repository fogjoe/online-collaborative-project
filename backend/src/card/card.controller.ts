import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  Req,
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
  create(@Body() createCardDto: CreateCardDto, @Req() req) {
    return this.cardService.create(createCardDto, req.user);
  }

  @Patch('reorder')
  @ResponseMessage('Card moved successfully')
  reorder(@Body() reorderCardDto: ReorderCardDto, @Req() req) {
    return this.cardService.reorder(reorderCardDto, req.user);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.cardService.toggle(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCardDto: UpdateCardDto,
    @Req() req,
  ) {
    return this.cardService.update(id, updateCardDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.cardService.remove(id, req.user);
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
