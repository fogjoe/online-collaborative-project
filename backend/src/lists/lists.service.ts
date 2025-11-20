import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from './entities/list.entity';
import { CreateListDto } from './dto/create-list.dto';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private listsRepository: Repository<List>,
  ) {}

  async create(createListDto: CreateListDto): Promise<List> {
    const list = this.listsRepository.create({
      name: createListDto.name,
      order: createListDto.order ?? 0,
      board: { id: createListDto.boardId },
    });
    return this.listsRepository.save(list);
  }

  async findAllByBoard(boardId: string): Promise<List[]> {
    return this.listsRepository.find({
      where: { board: { id: boardId } },
      order: { order: 'ASC' },
      relations: ['cards'],
    });
  }

  async findOne(id: string): Promise<List> {
    const list = await this.listsRepository.findOne({
      where: { id },
      relations: ['cards'],
    });
    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return list;
  }

  async update(id: string, updateListDto: any): Promise<List> {
    const list = await this.findOne(id);
    const oldOrder = list.order;
    const boardId = list.board.id;

    if (updateListDto.order !== undefined && updateListDto.order !== oldOrder) {
      const newOrder = updateListDto.order;

      if (newOrder > oldOrder) {
        // Moved right
        await this.listsRepository
          .createQueryBuilder()
          .update(List)
          .set({ order: () => '"order" - 1' })
          .where(
            'boardId = :boardId AND "order" > :oldOrder AND "order" <= :newOrder',
            {
              boardId,
              oldOrder,
              newOrder,
            },
          )
          .execute();
      } else {
        // Moved left
        await this.listsRepository
          .createQueryBuilder()
          .update(List)
          .set({ order: () => '"order" + 1' })
          .where(
            'boardId = :boardId AND "order" >= :newOrder AND "order" < :oldOrder',
            {
              boardId,
              newOrder,
              oldOrder,
            },
          )
          .execute();
      }
    }

    Object.assign(list, updateListDto);
    return this.listsRepository.save(list);
  }

  async remove(id: string): Promise<void> {
    const result = await this.listsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
  }
}
