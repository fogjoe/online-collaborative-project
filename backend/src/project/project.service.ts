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

  // 创建项目时，必须知道是“谁”创建的
  async create(createProjectDto: CreateProjectDto, user: User) {
    const newProject = this.projectRepository.create({
      ...createProjectDto,
      owner: user, // 关联当前登录用户
    });
    return this.projectRepository.save(newProject);
  }

  // 查找当前用户的所有项目
  async findAllByUser(user: User) {
    return this.projectRepository.find({
      where: { owner: { id: user.id } },
      order: { createdAt: 'DESC' }, // 最新创建的在前面
    });
  }
}
