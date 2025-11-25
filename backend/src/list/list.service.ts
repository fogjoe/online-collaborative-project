import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateListDto } from './dto/create-list.dto';
import { List } from './entities/list.entity';
// import { Project } from '../project/entities/project.entity';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(List)
    private listRepository: Repository<List>,
  ) {}

  /**
   * Create a new list within a specific project.
   */
  async create(createListDto: CreateListDto) {
    // 1. Find the project first (you might need to inject ProjectRepository)
    // For simplicity, we assume project_id is passed in DTO or we handle it in controller

    // Logic: calculate new order (last order + 1)

    const newList = this.listRepository.create({
      ...createListDto,
      // project: ... (linked project entity)
    });
    return this.listRepository.save(newList);
  }

  /**
   * Get all lists for a project, including their cards.
   */
  async findAllByProject(projectId: number) {
    return this.listRepository.find({
      where: { project: { id: projectId } },
      relations: ['cards'], // Eager load the cards inside the lists
      order: {
        order: 'ASC', // Sort lists by order
        cards: {
          order: 'ASC', // Sort cards inside lists by order
        },
      },
    });
  }
}
