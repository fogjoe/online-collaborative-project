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

@Controller('projects')
@UseGuards(JwtAuthGuard) //  Only logged in users can access
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('avatar', {
      // Storage configuration: Save files to './uploads' directory
      storage: diskStorage({
        destination: './uploads',
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
      const backendUrl = 'http://localhost:7000';
      avatarUrl = `${backendUrl}/uploads/${file.filename}`;
    }

    return this.projectService.create(createProjectDto, req.user, avatarUrl);
  }

  @Get()
  findAll(@Req() req) {
    return this.projectService.findAllByUser(req.user);
  }

  /**
   * DELETE /api/projects/:id
   * ParseIntPipe 用来把 URL 参数从字符串转换成数字，并在不能转换时自动抛出 400 错误。
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.projectService.remove(id, req.user);
  }
}
