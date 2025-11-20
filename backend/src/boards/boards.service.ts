import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { CreateBoardDto } from './dto/create-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardsRepository: Repository<Board>,
  ) {}

  async create(createBoardDto: CreateBoardDto): Promise<Board> {
    const board = this.boardsRepository.create({
      name: createBoardDto.name,
      project: { id: createBoardDto.projectId },
    });
    return this.boardsRepository.save(board);
  }

  async findAllByProject(projectId: string): Promise<Board[]> {
    return this.boardsRepository.find({
      where: { project: { id: projectId } },
      relations: ['lists', 'lists.cards'],
    });
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.boardsRepository.findOne({
      where: { id },
      relations: ['lists', 'lists.cards'],
    });
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    // Sort lists by order
    board.lists.sort((a, b) => a.order - b.order);
    // Sort cards in lists
    board.lists.forEach((list) => {
      if (list.cards) {
        list.cards.sort((a, b) => a.order - b.order);
      }
    });
    return board;
  }

  async update(id: string, updateBoardDto: any): Promise<Board> {
    const board = await this.findOne(id);
    Object.assign(board, updateBoardDto);
    return this.boardsRepository.save(board);
  }

  async remove(id: string): Promise<void> {
    const result = await this.boardsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
  }
}
