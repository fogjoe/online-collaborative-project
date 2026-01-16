import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm'; // 1. Import DataSource
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { User } from '../user/entities/user.entity';
import { List } from 'src/list/entities/list.entity';
import { ListStatus } from 'src/list/enums/list-status.enum';
import { AddMemberDto } from './dto/add-member.dto';
import { NotificationService } from 'src/notification/notification.service';
import { WebsocketService } from 'src/websocket/websocket.service';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectRole } from './enums/project-role.enum';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private notificationsService: NotificationService,
    private readonly websocketService: WebsocketService,
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
      const ownerMembership = manager.create(ProjectMember, {
        projectId: savedProject.id,
        userId: user.id,
        project: savedProject,
        user,
        role: ProjectRole.OWNER,
      });
      await manager.save(ownerMembership);

      return savedProject;
    });
  }

  // Find all projects of the current user
  async findAllByUser(user: User) {
    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.projectMembers', 'projectMember')
      .leftJoinAndSelect('projectMember.user', 'memberUser')
      .where('owner.id = :userId', { userId: user.id })
      .orWhere('projectMember.userId = :userId', { userId: user.id })
      .orderBy('project.createdAt', 'DESC')
      .getMany();

    return projects.map((project) => {
      const members =
        project.projectMembers?.map((member) => ({
          ...member.user,
          role: member.role,
        })) ?? [];

      if (
        project.owner &&
        !members.some((member) => member.id === project.owner.id)
      ) {
        members.push({ ...project.owner, role: ProjectRole.OWNER });
      }

      const currentMembership =
        project.projectMembers?.find((m) => m.userId === user.id) ?? null;

      return {
        ...project,
        members,
        currentUserRole:
          currentMembership?.role ??
          (project.owner?.id === user.id ? ProjectRole.OWNER : null),
      };
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
    const { email, role } = addMemberDto;

    // 1. Find the Project (and load existing members)
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['projectMembers', 'projectMembers.user'],
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
    const isAlreadyMember = project.projectMembers?.some(
      (member) => member.userId === userToAdd.id,
    );

    if (isAlreadyMember) {
      // Option: Throw error or just return success (idempotent)
      return { message: 'User is already a member', project };
    }

    // 4. Add User and Save
    const membership = this.projectMemberRepository.create({
      projectId: project.id,
      userId: userToAdd.id,
      project,
      user: userToAdd,
      role: role ?? ProjectRole.MEMBER,
    });
    await this.projectMemberRepository.save(membership);

    await this.notificationsService.create(
      userToAdd,
      `You have been invited to join the project: "${project.name}"`,
      project.id,
    );

    // Emit WebSocket event for member joined
    this.websocketService.emitMemberJoined({
      projectId,
      member: {
        id: userToAdd.id,
        username: userToAdd.username,
        email: userToAdd.email,
        avatarUrl: userToAdd.avatarUrl,
        role: membership.role,
      },
    });

    return {
      message: 'Member added successfully',
      member: { ...userToAdd, role: membership.role },
    };
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner', 'projectMembers', 'projectMembers.user'],
    });

    if (!project) {
      throw new NotFoundException(`Project #${id} not found`);
    }

    const members =
      project.projectMembers?.map((member) => ({
        ...member.user,
        role: member.role,
      })) ?? [];

    if (
      project.owner &&
      !members.some((member) => member.id === project.owner.id)
    ) {
      members.push({ ...project.owner, role: ProjectRole.OWNER });
    }

    return {
      ...project,
      members,
    };
  }
}
