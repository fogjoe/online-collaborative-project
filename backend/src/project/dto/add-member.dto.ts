import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ProjectRole } from '../enums/project-role.enum';

export class AddMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsEnum(ProjectRole)
  role?: ProjectRole;
}
