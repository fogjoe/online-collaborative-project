import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  // When creating a project, you must know "who" created it
  async create(
    createProjectDto: CreateProjectDto,
    user: User,
    avatarUrl: string | null,
  ) {
    const newProject = this.projectRepository.create({
      ...createProjectDto,
      owner: user, // Associate with the currently logged in user
      avatarUrl: avatarUrl ?? null,
    });
    return this.projectRepository.save(newProject);
  }

  // Find all projects of the current user
  async findAllByUser(user: User) {
    return this.projectRepository.find({
      where: { owner: { id: user.id } },
      order: { createdAt: 'DESC' }, // The latest created is at the front
    });
  }

  /**
   * Remove a project.
   * We must ensure the user owns the project before deleting.
   */
  async remove(id: number, user: User) {
    // 1. Check if project exists and belongs to user
    const project = await this.projectRepository.findOne({
      where: { id, owner: { id: user.id } },
    });

    if (!project) {
      throw new NotFoundException(
        `Project #${id} not found or you don't have permission`,
      );
    }

    // 2. Delete it (Cascade will handle lists/cards if configured in entity)
    return this.projectRepository.remove(project);
  }
}
