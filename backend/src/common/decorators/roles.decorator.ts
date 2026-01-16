import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from 'src/project/enums/project-role.enum';

export const RolesKey = 'roles';
export const Roles = (...roles: ProjectRole[]) => SetMetadata(RolesKey, roles);
