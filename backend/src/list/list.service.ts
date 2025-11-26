import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateListDto } from './dto/create-list.dto';
import { List } from './entities/list.entity';
import { Project } from '../project/entities/project.entity';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  /**
   * Create a new list within a specific project.
   */
  async create(createListDto: CreateListDto) {
    const { projectId, name } = createListDto;

    // 1. Validate project exists
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // 2. Calculate order (append to end)
    // Find the list with the highest order in this project
    const lastList = await this.listRepository.findOne({
      where: { project: { id: projectId } },
      order: { order: 'DESC' },
    });
    const newOrder = lastList ? lastList.order + 1 : 1;

    // 3. Create and save
    const newList = this.listRepository.create({
      name,
      order: newOrder,
      project,
    });

    return this.listRepository.save(newList);
  }

  /**
   * Get all lists for a project, including their cards.
   */
  async findAllByProject(projectId: number) {
    return this.listRepository.find({
      where: { project: { id: projectId } },
      relations: ['cards'], // Load cards automatically
      order: {
        order: 'ASC', // Sort lists by order
        cards: {
          order: 'ASC', // Sort cards inside list
        },
      },
    });
  }
}
