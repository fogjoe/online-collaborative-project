import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm'; // 1. Import DataSource
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { User } from '../user/entities/user.entity';
import { List } from 'src/list/entities/list.entity';
import { ListStatus } from 'src/list/enums/list-status.enum';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // When creating a project, we now use a Transaction to ensure lists are created too
  async create(
    createProjectDto: CreateProjectDto,
    user: User,
    avatarUrl: string | null,
  ) {
    // Start a database transaction
    return this.dataSource.transaction(async (manager) => {
      // 1. Create the Project instance
      const newProject = manager.create(Project, {
        ...createProjectDto,
        owner: user,
        avatarUrl: avatarUrl ?? null,
      });

      // 2. Save the Project first (so we get an ID)
      const savedProject = await manager.save(newProject);

      // 3. Prepare the 3 Default Lists linked to this new project
      const defaultLists = [
        manager.create(List, {
          name: 'To Do',
          status: ListStatus.TODO,
          order: 0,
          project: savedProject,
        }),
        manager.create(List, {
          name: 'In Progress',
          status: ListStatus.IN_PROGRESS,
          order: 1,
          project: savedProject,
        }),
        manager.create(List, {
          name: 'Done',
          status: ListStatus.DONE,
          order: 2,
          project: savedProject,
        }),
      ];

      // 4. Save the lists
      await manager.save(List, defaultLists);

      // 5. Return the project
      return savedProject;
    });
  }

  // Find all projects of the current user
  async findAllByUser(user: User) {
    return this.projectRepository.find({
      where: [{ owner: { id: user.id } }, { members: { id: user.id } }],
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Remove a project.
   */
  async remove(id: number, user: User) {
    const project = await this.projectRepository.findOne({
      where: { id, owner: { id: user.id } },
    });

    if (!project) {
      throw new NotFoundException(
        `Project #${id} not found or you don't have permission`,
      );
    }

    return this.projectRepository.remove(project);
  }

  // Add Member by Email
  async addMember(projectId: number, addMemberDto: AddMemberDto) {
    const { email } = addMemberDto;

    // 1. Find the Project (and load existing members)
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members'], // Important!
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Find the User to invite
    const userToAdd = await this.userRepository.findOneBy({ email });

    if (!userToAdd) {
      throw new NotFoundException('User with this email does not exist');
    }

    // 3. Check if already a member
    const isAlreadyMember = project.members.some(
      (member) => member.id === userToAdd.id,
    );

    if (isAlreadyMember) {
      // Option: Throw error or just return success (idempotent)
      return { message: 'User is already a member', project };
    }

    // 4. Add User and Save
    project.members.push(userToAdd);
    await this.projectRepository.save(project);

    return { message: 'Member added successfully', member: userToAdd };
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!project) {
      throw new NotFoundException(`Project #${id} not found`);
    }

    return project;
  }
}
