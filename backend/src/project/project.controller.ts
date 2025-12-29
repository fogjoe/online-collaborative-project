import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { AddMemberDto } from './dto/add-member.dto';
import { ensureUploadSubdirectory } from 'src/common/utils/upload.util';
import { ActivityLog } from 'src/activity/decorators/log-activity.decorator';
import { ActivityLoggingInterceptor } from 'src/activity/interceptors/activity-logging.interceptor';

@Controller('projects')
@UseGuards(JwtAuthGuard) //  Only logged in users can access
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('avatar', {
      // Storage configuration: Save files to './uploads/avatars' directory
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = ensureUploadSubdirectory('avatars');
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          // Generate a unique filename (e.g., random-string.jpg)
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      // Optional: File validation (limit size to 5MB, only images)
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req,
    @UploadedFile() file: Express.Multer.File, // Receive the file here
  ) {
    // If a file was uploaded, create the full URL
    let avatarUrl: string | null = null;
    if (file) {
      // Note: In production, use your actual domain env variable instead of localhost
      const backendUrl = this.configService.get<string>('SERVICE_URL');
      avatarUrl = `${backendUrl}/uploads/avatars/${file.filename}`;
    }

    return this.projectService.create(createProjectDto, req.user, avatarUrl);
  }

  @Get()
  findAll(@Req() req) {
    return this.projectService.findAllByUser(req.user);
  }

  /**
   * DELETE /api/projects/:id
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.projectService.remove(id, req.user);
  }

  @Post(':id/members')
  @UseInterceptors(ActivityLoggingInterceptor)
  @ActivityLog({
    action: 'invited_member',
    projectIdParam: 'id',
    buildPayload: (context, result) => {
      const req = context.switchToHttp().getRequest();
      const responseData =
        result && typeof result === 'object' && 'data' in result
          ? (result as { data?: unknown }).data
          : result;
      const member =
        responseData && typeof responseData === 'object'
          ? (responseData as { member?: { id?: number; email?: string } })
              .member
          : undefined;
      return {
        newValue: { email: req.body?.email },
        metadata: {
          memberId: member?.id,
          memberEmail: member?.email ?? req.body?.email,
        },
      };
    },
  })
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.projectService.addMember(id, addMemberDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.findOne(id);
  }
}
