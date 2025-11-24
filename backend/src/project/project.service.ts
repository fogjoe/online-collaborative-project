import { Injectable } from '@nestjs/common';
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
  async create(createProjectDto: CreateProjectDto, user: User) {
    const newProject = this.projectRepository.create({
      ...createProjectDto,
      owner: user, // Associate with the currently logged in user
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
}
