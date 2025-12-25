import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ensureUploadSubdirectory } from 'src/common/utils/upload.util';
import { AttachmentsService } from './attachments.service';
import { ConfigService } from '@nestjs/config';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/markdown',
];

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('card/:cardId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = ensureUploadSubdirectory('attachments');
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(
            null,
            `attachment-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only PDF, DOCX, or image files are allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  upload(
    @Param('cardId', ParseIntPipe) cardId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Attachment file is required');
    }

    const backendUrl = this.configService.get<string>('SERVICE_URL');
    const fileUrl = `${backendUrl}/uploads/attachments/${file.filename}`;

    return this.attachmentsService.create(cardId, file, fileUrl);
  }

  @Get('card/:cardId')
  list(@Param('cardId', ParseIntPipe) cardId: number) {
    return this.attachmentsService.findByCard(cardId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attachmentsService.remove(id);
  }
}
