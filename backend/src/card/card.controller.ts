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
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ProjectRole } from 'src/project/enums/project-role.enum';

@Controller('cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  create(@Body() createCardDto: CreateCardDto, @Req() req) {
    return this.cardService.create(createCardDto, req.user);
  }

  @Patch('reorder')
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  @ResponseMessage('Card moved successfully')
  reorder(@Body() reorderCardDto: ReorderCardDto, @Req() req) {
    return this.cardService.reorder(reorderCardDto, req.user);
  }

  @Patch(':id/toggle')
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  toggle(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.cardService.toggle(id, req.user);
  }

  @Patch(':id')
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCardDto: UpdateCardDto,
    @Req() req,
  ) {
    return this.cardService.update(id, updateCardDto, req.user);
  }

  @Delete(':id')
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.cardService.remove(id, req.user);
  }

  @Post(':id/assign')
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  assignMember(
    @Param('id', ParseIntPipe) cardId: number,
    @Body() dto: AssignUserDto,
    @Req() req,
  ) {
    return this.cardService.assignMember(cardId, dto, req.user);
  }

  // Unassign User
  @Delete(':id/assign/:userId')
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  removeMember(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req,
  ) {
    return this.cardService.removeMember(cardId, userId, req.user);
  }

  @Post(':id/labels/:labelId')
  @Roles(ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.OWNER)
  toggleLabel(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('labelId', ParseIntPipe) labelId: number,
    @Req() req,
  ) {
    return this.cardService.toggleLabel(cardId, labelId, req.user);
  }
}
