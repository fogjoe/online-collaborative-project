import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  notifyDueSoonInApp?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyDueSoonEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOverdueInApp?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOverdueEmail?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
