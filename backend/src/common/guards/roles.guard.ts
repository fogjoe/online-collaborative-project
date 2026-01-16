import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesKey } from '../decorators/roles.decorator';
import { ProjectRole } from 'src/project/enums/project-role.enum';
import { ProjectAccessService } from '../authorization/project-access.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<ProjectRole[]>(RolesKey, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      return false;
    }

    const projectId = await this.projectAccessService.resolveProjectId(request);
    if (!projectId) {
      return false;
    }

    const role = await this.projectAccessService.getUserRole(
      projectId,
      user.id,
    );

    if (!role) {
      return false;
    }

    return requiredRoles.includes(role);
  }
}
