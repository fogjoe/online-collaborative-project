import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { WebSocketEvents, BoardUser } from './websocket.types';

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: number;
    username: string;
    email: string;
    avatarUrl?: string;
  };
}

interface JoinProjectPayload {
  projectId: number;
}

interface LeaveProjectPayload {
  projectId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/board',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track users in each project room: Map<projectId, Map<socketId, BoardUser>>
  private projectUsers: Map<number, Map<string, BoardUser>> = new Map();

  // Track which projects each socket is in: Map<socketId, Set<projectId>>
  private socketProjects: Map<string, Set<number>> = new Map();

  // Track in-flight authentications so event handlers can wait for completion
  private clientAuthPromises: Map<string, Promise<void>> = new Map();

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const authPromise = this.authenticateClient(client);
    this.clientAuthPromises.set(client.id, authPromise);
    try {
      await authPromise;
    } finally {
      this.clientAuthPromises.delete(client.id);
    }
  }

  private async authenticateClient(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token as string);

      // Find user in database
      const user = await this.userRepository.findOne({
        where: { email: payload.email },
      });

      if (!user) {
        client.emit('error', { message: 'User not found' });
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.user = {
        userId: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      };

      // Initialize socket tracking
      this.socketProjects.set(client.id, new Set());
    } catch {
      client.emit('error', { message: 'Invalid authentication token' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.clientAuthPromises.delete(client.id);
    if (!client.user) return;

    // Leave all project rooms
    const projects = this.socketProjects.get(client.id);
    if (projects) {
      for (const projectId of projects) {
        await this.leaveProjectRoom(client, projectId);
      }
    }

    // Cleanup socket tracking
    this.socketProjects.delete(client.id);
  }

  @SubscribeMessage(WebSocketEvents.JOIN_PROJECT)
  async handleJoinProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinProjectPayload,
  ) {
    await this.ensureClientAuthenticated(client);
    const clientUser = client.user;
    if (!clientUser) {
      return { success: false, message: 'Not authenticated' };
    }

    const { projectId } = payload;

    // Verify user has access to project
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'members'],
    });

    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const hasAccess =
      project.owner.id === clientUser.userId ||
      project.members.some((m) => m.id === clientUser.userId);

    if (!hasAccess) {
      return { success: false, message: 'Access denied' };
    }

    // Join the room
    const roomName = this.getProjectRoom(projectId);
    await client.join(roomName);

    // Track the user in this project
    if (!this.projectUsers.has(projectId)) {
      this.projectUsers.set(projectId, new Map());
    }
    if (!this.socketProjects.has(client.id)) {
      this.socketProjects.set(client.id, new Set());
    }

    const boardUser: BoardUser = {
      userId: clientUser.userId,
      username: clientUser.username,
      avatarUrl: clientUser.avatarUrl,
      joinedAt: new Date(),
    };

    this.projectUsers.get(projectId)!.set(client.id, boardUser);
    this.socketProjects.get(client.id)!.add(projectId);

    // Notify others in the room
    client.to(roomName).emit(WebSocketEvents.USER_JOINED_BOARD, {
      projectId,
      user: boardUser,
    });

    // Send current users to the joining client
    const currentUsers = Array.from(this.projectUsers.get(projectId)!.values());

    client.emit(WebSocketEvents.BOARD_USERS, {
      projectId,
      users: currentUsers,
    });

    return { success: true, users: currentUsers };
  }

  private async ensureClientAuthenticated(client: AuthenticatedSocket) {
    const pendingAuth = this.clientAuthPromises.get(client.id);
    if (pendingAuth) {
      try {
        await pendingAuth;
      } catch {
        // Authentication failure is already handled in authenticateClient
      }
    }
  }

  @SubscribeMessage(WebSocketEvents.LEAVE_PROJECT)
  async handleLeaveProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: LeaveProjectPayload,
  ) {
    if (!client.user) {
      return { success: false, message: 'Not authenticated' };
    }

    await this.leaveProjectRoom(client, payload.projectId);
    return { success: true };
  }

  private async leaveProjectRoom(
    client: AuthenticatedSocket,
    projectId: number,
  ) {
    if (!client.user) return;

    const roomName = this.getProjectRoom(projectId);
    await client.leave(roomName);

    // Remove user from tracking
    const projectUserMap = this.projectUsers.get(projectId);
    if (projectUserMap) {
      const user = projectUserMap.get(client.id);
      projectUserMap.delete(client.id);

      // Notify others
      if (user) {
        this.server.to(roomName).emit(WebSocketEvents.USER_LEFT_BOARD, {
          projectId,
          user,
        });
      }

      // Cleanup empty project map
      if (projectUserMap.size === 0) {
        this.projectUsers.delete(projectId);
      }
    }

    // Update socket tracking
    this.socketProjects.get(client.id)?.delete(projectId);
  }

  // Helper to get room name for a project
  getProjectRoom(projectId: number): string {
    return `project:${projectId}`;
  }

  // Get users currently in a project
  getProjectUsers(projectId: number): BoardUser[] {
    const userMap = this.projectUsers.get(projectId);
    if (!userMap) return [];
    return Array.from(userMap.values());
  }
}
